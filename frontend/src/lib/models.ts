// frontend/src/lib/models.ts
import type { CapabilitiesResponse, ModelOption, ModelProvider } from "@/types";
import { api } from "@/lib/api";

export async function getAvailableModels(): Promise<ModelOption[]> {
  const cap = await api<CapabilitiesResponse>("/api/capabilities");

  const providers = ["groq", "google", "openai"] as ModelProvider[];
  const out: ModelOption[] = [];

  for (const p of providers) {
    const prov = cap.providers[p];
    if (!prov?.enabled) continue;

    for (const m of prov.models ?? []) {
      out.push({
        value: m.value, // "provider/modelId"
        label: m.label,
        description: m.description,
        provider: p,
      });
    }
  }

  return out;
}

export async function getDefaultModel(): Promise<string> {
  const models = await getAvailableModels();
  return models[0]?.value ?? "";
}
