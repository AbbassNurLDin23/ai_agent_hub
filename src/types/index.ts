export interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number;
  latency_ms: number;
  created_at: string;
}

export interface MetricsSnapshot {
  id: string;
  agent_id: string | null;
  messages_count: number;
  tokens_processed: number;
  avg_latency_ms: number;
  last_response_latency_ms: number;
  created_at: string;
}

export interface MetricsStreamData {
  timestamp: string;
  agentId: string | null;
  current: {
    messages_count: number;
    tokens_processed: number;
    avg_latency_ms: number;
    last_response_latency_ms: number;
  };
  history: {
    created_at: string;
    avg_latency_ms: number;
    tokens_processed: number;
    messages_count: number;
    last_response_latency_ms: number;
  }[];
  global: {
    totalMessages: number;
    totalTokens: number;
    avgLatency: number;
  } | null;
}

export type ModelOption = {
  value: string;
  label: string;
  description: string;
};

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    value: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Fast and balanced, great for most tasks',
  },
  {
    value: 'google/gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Top-tier reasoning and multimodal',
  },
  {
    value: 'google/gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Fastest and cheapest option',
  },
  {
    value: 'openai/gpt-5',
    label: 'GPT-5',
    description: 'Powerful all-rounder, best accuracy',
  },
  {
    value: 'openai/gpt-5-mini',
    label: 'GPT-5 Mini',
    description: 'Lower cost with strong performance',
  },
  {
    value: 'openai/gpt-5-nano',
    label: 'GPT-5 Nano',
    description: 'Speed optimized, high volume',
  },
];
