// backend/src/config/providers.ts
import fs from "fs";
import path from "path";

export type Provider = "groq" | "google" | "openai";

export type ProviderModel = {
  id: string;
  name: string;
  description?: string;
};

export type ProviderItem = {
  provider: Provider;
  enabled: boolean;
  models: ProviderModel[];
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function hasProviderKey(provider: Provider): boolean {
  if (provider === "groq") return !!env("GROQ_API_KEY");
  if (provider === "google") return !!env("GOOGLE_API_KEY");
  if (provider === "openai") return !!env("OPENAI_API_KEY");
  return false;
}

function readJsonFile(filePath: string): unknown {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  const raw = fs.readFileSync(abs, "utf-8");
  return JSON.parse(raw);
}

export function providersFilePath(): string {
  return env("PROVIDERS_FILE") || "";
}

/**
 * Loads providers configuration:
 * - Prefer PROVIDERS_FILE (Docker approach)
 * - Optional fallback to PROVIDERS_JSON (local/dev only)
 * Then enforces:
 * - If API key missing => disabled
 * - If enabled but no models => disabled
 */
export function loadProviders(): {
  providers: ProviderItem[];
  debug: {
    providersFile: string;
    providersFilePresent: boolean;
    providersJsonPresent: boolean;
  };
} {
  const file = providersFilePath();
  const rawEnvJson = env("PROVIDERS_JSON");

  let source: unknown = null;
  let filePresent = false;

  // 1) Try file
  if (file) {
    try {
      // if file doesn't exist, this throws
      fs.accessSync(
        path.isAbsolute(file) ? file : path.resolve(process.cwd(), file),
        fs.constants.R_OK
      );
      filePresent = true;
      source = readJsonFile(file);
    } catch {
      filePresent = false;
      source = null;
    }
  }

  // 2) Fallback to env JSON (optional)
  if (!source && rawEnvJson) {
    try {
      source = JSON.parse(rawEnvJson);
    } catch {
      source = null;
    }
  }

  const arr = Array.isArray(source) ? (source as unknown[]) : [];

  const normalized: ProviderItem[] = arr
    .filter(Boolean)
    .map((x) => x as Partial<ProviderItem>)
    .filter(
      (x): x is ProviderItem =>
        !!x &&
        (x.provider === "groq" ||
          x.provider === "google" ||
          x.provider === "openai")
    )
    .map((p) => {
      const models = Array.isArray(p.models) ? p.models : [];
      const cleanModels: ProviderModel[] = models
        .map((m) => m as Partial<ProviderModel>)
        .map((m) => ({
          id: String(m.id ?? "").trim(),
          name: String(m.name ?? m.id ?? "").trim(),
          description: m.description ? String(m.description).trim() : undefined,
        }))
        .filter((m) => !!m.id);

      const enabledByCfg = !!p.enabled;
      const enabled =
        enabledByCfg && hasProviderKey(p.provider) && cleanModels.length > 0;

      return {
        provider: p.provider,
        enabled,
        models: cleanModels,
      };
    });

  return {
    providers: normalized,
    debug: {
      providersFile: file,
      providersFilePresent: filePresent,
      providersJsonPresent: !!rawEnvJson,
    },
  };
}

export function getEnabledProviders(): ProviderItem[] {
  return loadProviders().providers.filter(
    (p) => p.enabled && p.models.length > 0
  );
}

export function isModelAllowed(provider: Provider, modelId: string): boolean {
  const item = getEnabledProviders().find((p) => p.provider === provider);
  return !!item?.models.some((m) => m.id === modelId);
}

export function firstModelId(provider: Provider): string {
  const item = getEnabledProviders().find((p) => p.provider === provider);
  return item?.models?.[0]?.id ?? "";
}

export function defaultModelId(provider: Provider): string {
  // Prefer first allowed model from enabled providers
  const first = firstModelId(provider);
  if (first) return first;

  // Fallback defaults (only if config missing)
  const groqDefault = env("GROQ_DEFAULT_MODEL") || "llama-3.3-70b-versatile";
  const googleDefault = env("GOOGLE_DEFAULT_MODEL") || "gemini-2.5-flash";
  const openaiDefault = env("OPENAI_DEFAULT_MODEL") || "gpt-4o-mini";

  if (provider === "groq") return groqDefault;
  if (provider === "google") return googleDefault;
  return openaiDefault;
}
