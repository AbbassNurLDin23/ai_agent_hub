// backend/src/controllers/chat.controller.ts
import type { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../db";
import { callLLM, type ChatMsg } from "../services/llm.service";
import { updateMetricsForAgent } from "../services/metrics.service";

const SendSchema = z.object({
  content: z.string().min(1),
});

const SendDirectSchema = z.object({
  agentId: z.string().min(1),
  content: z.string().min(1),
  conversationId: z.string().optional(),
});

// ✅ Role guard so TS + runtime are safe
function toChatMsg(m: { role: string; content: string }): ChatMsg | null {
  if (m.role === "user" || m.role === "assistant" || m.role === "system") {
    return { role: m.role, content: m.content };
  }
  return null;
}

function makeTitleFromFirstMessage(content: string): string {
  const text = (content ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "New chat";
  const max = 50;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function ensureConversationHasTitle(
  conversationId: string,
  firstUserText: string
) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, title: true },
  });

  if (!convo) return;

  const title = (convo.title ?? "").trim();
  if (!title || title.toLowerCase() === "new chat") {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: makeTitleFromFirstMessage(firstUserText) },
    });
  }
}

export async function listAgentConversations(req: Request, res: Response) {
  const conversations = await prisma.conversation.findMany({
    where: { agentId: req.params.agentId },
    orderBy: { createdAt: "desc" }, // ✅ use existing field
  });

  return res.json(conversations);
}

export async function startConversation(req: Request, res: Response) {
  const convo = await prisma.conversation.create({
    // ✅ set null so backend can auto-title it on first message
    data: { agentId: req.params.agentId, title: null },
  });

  return res.status(201).json(convo);
}

export async function listMessages(req: Request, res: Response) {
  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.conversationId },
    orderBy: { createdAt: "asc" },
  });

  return res.json(messages);
}

/**
 * POST /api/conversations/:conversationId/messages
 * Body: { content }
 */
export async function sendMessage(req: Request, res: Response) {
  const { content } = SendSchema.parse(req.body);

  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.conversationId },
    include: { agent: true },
  });

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const agent = conversation.agent;

  // ✅ if title is empty/"New chat", set it from first user message
  await ensureConversationHasTitle(conversation.id, content);

  const userMsg = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content,
    },
  });

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  const mappedHistory: ChatMsg[] = history
    .map((m) => toChatMsg({ role: m.role, content: m.content }))
    .filter((x): x is ChatMsg => x !== null);

  const start = Date.now();
  const llmResult = await callLLM({
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    messages: mappedHistory,
  });
  const latencyMs = Date.now() - start;

  const assistantMsg = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: llmResult.text,
      tokensUsed: llmResult.tokensUsed ?? null,
      latencyMs,
    },
  });

  await updateMetricsForAgent(agent.id, {
    tokensUsed: llmResult.tokensUsed ?? 0,
    latencyMs,
  });

  return res.json({
    conversationId: conversation.id,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    meta: {
      latencyMs,
      tokensUsed: llmResult.tokensUsed ?? null,
    },
  });
}

/**
 * POST /api/chat
 * Body: { agentId, content, conversationId? }
 */
export async function sendMessageDirect(req: Request, res: Response) {
  const { agentId, content, conversationId } = SendDirectSchema.parse(req.body);

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  let convo = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, agentId },
      })
    : null;

  if (!convo) {
    convo = await prisma.conversation.create({
      data: { agentId, title: null }, // ✅ auto-title on first message
    });
  }

  // ✅ ensure title from first message
  await ensureConversationHasTitle(convo.id, content);

  const userMsg = await prisma.message.create({
    data: {
      conversationId: convo.id,
      role: "user",
      content,
    },
  });

  const history = await prisma.message.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  const mappedHistory: ChatMsg[] = history
    .map((m) => toChatMsg({ role: m.role, content: m.content }))
    .filter((x): x is ChatMsg => x !== null);

  const start = Date.now();
  const llmResult = await callLLM({
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    messages: mappedHistory,
  });
  const latencyMs = Date.now() - start;

  const assistantMsg = await prisma.message.create({
    data: {
      conversationId: convo.id,
      role: "assistant",
      content: llmResult.text,
      tokensUsed: llmResult.tokensUsed ?? null,
      latencyMs,
    },
  });

  await updateMetricsForAgent(agent.id, {
    tokensUsed: llmResult.tokensUsed ?? 0,
    latencyMs,
  });

  return res.json({
    conversationId: convo.id,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    meta: {
      latencyMs,
      tokensUsed: llmResult.tokensUsed ?? null,
    },
  });
}
