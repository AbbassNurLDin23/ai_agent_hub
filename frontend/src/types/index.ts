// frontend/src/types/index.ts

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  model: string; // now stored as "provider/modelId"
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  title: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokensUsed?: number | null;
  latencyMs?: number | null;
  createdAt: string;
}

export type MetricsSnapshot = {
  agentId: string;
  messagesCount: number;
  tokensProcessed: number;
  avgLatencyMs: number;
  lastResponseLatencyMs: number;
  updatedAt: string;
};

export type MetricsStreamData = {
  current: MetricsSnapshot;
  history: MetricsSnapshot[];
};

export type ModelProvider = "groq" | "google" | "openai";

export type CapModel = {
  value: string; // "provider/modelId"
  label: string; // name
  description: string;
};

export type CapabilitiesResponse = {
  providers: Record<
    ModelProvider,
    {
      enabled: boolean;
      models: CapModel[];
      reasonDisabled?: string;
    }
  >;
};

export type ModelOption = {
  value: string;
  label: string;
  description: string;
  provider: ModelProvider;
};
