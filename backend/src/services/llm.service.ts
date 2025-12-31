// backend/src/services/llm.service.ts
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

import type { ChatCompletionMessageParam as OpenAIChatMsg } from "openai/resources/chat/completions";
import type { ChatCompletionMessageParam as GroqChatMsg } from "groq-sdk/resources/chat/completions";

import {
  type Provider,
  defaultModelId,
  isModelAllowed,
} from "../config/providers";

export type Role = "system" | "user" | "assistant";
export type ChatMsg = { role: Role; content: string };

export interface LLMInput {
  /**
   * Supported formats:
   *  A) "provider/modelId"  e.g. "groq/llama-3.3-70b-versatile"
   *  B) API key (legacy)    e.g. "gsk_..." / "AIza..." / "sk-..."
   */
  model: string;
  systemPrompt: string;
  messages: ChatMsg[];
}

export interface LLMResponse {
  text: string;
  tokensUsed?: number;
}

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function requiredEnv(name: string): string {
  const v = env(name);
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

/** Detect provider from API key format */
function detectProviderFromKey(k: string): Provider | null {
  const key = (k ?? "").trim();
  if (!key) return null;

  if (key.startsWith("gsk_")) return "groq";
  if (key.startsWith("sk-")) return "openai";
  if (key.startsWith("AIza")) return "google";

  return null;
}

/**
 * Returns provider + modelId + apiKey
 * Supports:
 *  - "provider/modelId" => uses backend env key
 *  - legacy API key stored in agent.model => chooses a default modelId from providers config
 */
function parseAgentModel(value: string): {
  provider: Provider;
  modelId: string;
  apiKey: string;
} {
  const raw = (value ?? "").trim();
  if (!raw) throw new Error("Agent model is empty");

  // NEW FORMAT: provider/modelId
  if (raw.includes("/")) {
    const [providerPart, ...rest] = raw.split("/");
    const provider = providerPart as Provider;
    const modelId = rest.join("/").trim();

    if (provider !== "groq" && provider !== "google" && provider !== "openai") {
      throw new Error(`Unsupported provider "${providerPart}"`);
    }
    if (!modelId) {
      throw new Error(
        `Invalid model "${raw}". Expected "provider/modelId" e.g. "groq/llama-3.3-70b-versatile".`
      );
    }

    // Validate against providers.json (enabled + allowed models)
    if (!isModelAllowed(provider, modelId)) {
      throw new Error(
        `Model not allowed: "${provider}/${modelId}". Check providers config and API keys.`
      );
    }

    const apiKey =
      provider === "groq"
        ? requiredEnv("GROQ_API_KEY")
        : provider === "google"
        ? requiredEnv("GOOGLE_API_KEY")
        : requiredEnv("OPENAI_API_KEY");

    return { provider, modelId, apiKey };
  }

  // LEGACY FORMAT: agent.model is an API key
  const provider = detectProviderFromKey(raw);
  if (!provider) {
    throw new Error(
      `Invalid model "${raw}". Expected "provider/modelId" OR a recognized API key (gsk_/sk-/AIza...).`
    );
  }

  // Use the key stored in DB, and choose a modelId from config/default
  return {
    provider,
    modelId: defaultModelId(provider),
    apiKey: raw,
  };
}

/** Build NORMAL mutable messages array */
function buildMessages(systemPrompt: string, msgs: ChatMsg[]): ChatMsg[] {
  const sys = (systemPrompt ?? "").trim();
  const clean = msgs.filter((m) => m.role === "user" || m.role === "assistant");

  if (sys) return [{ role: "system", content: sys }, ...clean];
  return [...clean];
}

function toOpenAIMessages(
  systemPrompt: string,
  msgs: ChatMsg[]
): OpenAIChatMsg[] {
  return buildMessages(systemPrompt, msgs).map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

function toGroqMessages(systemPrompt: string, msgs: ChatMsg[]): GroqChatMsg[] {
  return buildMessages(systemPrompt, msgs).map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

async function callGroq(apiKey: string, modelId: string, input: LLMInput) {
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: modelId,
    messages: toGroqMessages(input.systemPrompt, input.messages),
    temperature: 0.7,
    max_tokens: 1200,
  });

  return {
    text: completion.choices?.[0]?.message?.content ?? "No response",
    tokensUsed: (completion.usage as unknown as { total_tokens?: number })
      ?.total_tokens,
  } satisfies LLMResponse;
}

async function callOpenAI(apiKey: string, modelId: string, input: LLMInput) {
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages: toOpenAIMessages(input.systemPrompt, input.messages),
    temperature: 0.7,
    max_tokens: 1200,
  });

  return {
    text: completion.choices?.[0]?.message?.content ?? "No response",
    tokensUsed: completion.usage?.total_tokens,
  } satisfies LLMResponse;
}

async function callGoogle(apiKey: string, modelId: string, input: LLMInput) {
  const google = new GoogleGenerativeAI(apiKey);

  const sys = (input.systemPrompt ?? "").trim();
  const model = google.getGenerativeModel({
    model: modelId,
    systemInstruction: sys || undefined,
  });

  const history = input.messages
    .filter((m) => m.role !== "system")
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const lastUser =
    [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastUser);

  return {
    text: result.response.text(),
    tokensUsed: result.response.usageMetadata?.totalTokenCount,
  } satisfies LLMResponse;
}

export async function callLLM(input: LLMInput): Promise<LLMResponse> {
  try {
    const { provider, modelId, apiKey } = parseAgentModel(input.model);

    if (provider === "groq") return await callGroq(apiKey, modelId, input);
    if (provider === "google") return await callGoogle(apiKey, modelId, input);
    if (provider === "openai") return await callOpenAI(apiKey, modelId, input);

    throw new Error("Unsupported provider");
  } catch (error) {
    console.error("LLM Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { text: `Error: ${msg}`, tokensUsed: 0 };
  }
}
