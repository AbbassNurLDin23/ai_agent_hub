import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";

const AgentCreateSchema = z.object({
  name: z.string().min(1),
  systemPrompt: z.string().min(1),
  model: z.string().min(1),
});

const AgentUpdateSchema = AgentCreateSchema.partial();

export async function listAgents(_req: Request, res: Response) {
  const agents = await prisma.agent.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return res.json(agents);
}

export async function getAgentById(req: Request, res: Response) {
  const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  return res.json(agent);
}

export async function createAgent(req: Request, res: Response) {
  const body = AgentCreateSchema.parse(req.body);

  const agent = await prisma.agent.create({
    data: {
      name: body.name,
      systemPrompt: body.systemPrompt,
      model: body.model,
    },
  });

  // optional but good
  await prisma.metricsSnapshot.upsert({
    where: { agentId: agent.id },
    update: {},
    create: { agentId: agent.id },
  });

  return res.status(201).json(agent);
}

export async function updateAgent(req: Request, res: Response) {
  const id = req.params.id;
  const body = AgentUpdateSchema.parse(req.body);

  // ✅ prevent empty update
  if (Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  // ✅ return 404 if not found (instead of Prisma throwing)
  const exists = await prisma.agent.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Agent not found" });

  const agent = await prisma.agent.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.systemPrompt !== undefined
        ? { systemPrompt: body.systemPrompt }
        : {}),
      ...(body.model !== undefined ? { model: body.model } : {}),
    },
  });

  return res.json(agent);
}

export async function deleteAgent(req: Request, res: Response) {
  const id = req.params.id;

  // ✅ return 404 if not found
  const exists = await prisma.agent.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Agent not found" });

  // Optional: delete related data first if FK constraints exist
  // If your prisma schema has relations with onDelete: Cascade you can skip these.
  await prisma.message
    .deleteMany({ where: { conversation: { agentId: id } } })
    .catch(() => {});
  await prisma.conversation
    .deleteMany({ where: { agentId: id } })
    .catch(() => {});
  await prisma.metricsSnapshot
    .deleteMany({ where: { agentId: id } })
    .catch(() => {});

  await prisma.agent.delete({ where: { id } });

  return res.status(204).send();
}
