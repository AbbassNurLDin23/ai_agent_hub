// backend/src/controllers/capabilities.controller.ts
import type { Request, Response } from "express";

type Provider = "groq" | "google" | "openai";

type ProviderEnvModel = {
  id: string;
  name: string;
  description?: string;
};

type ProviderEnvItem = {
  provider: Provider;
  enabled: boolean;
  models: ProviderEnvModel[];
};

type CapModel = {
  value: string; // "provider/modelId"
  label: string;
  description: string;
};

export type CapabilitiesResponse = {
  providers: Record<
    Provider,
    {
      enabled: boolean;
      models: CapModel[];
      reasonDisabled?: string;
    }
  >;

  // ✅ helpful debug (safe: no keys leaked)
  debug: {
    providersJsonPresent: boolean;
    providersJsonLength: number;
    keysPresent: Record<Provider, boolean>;
  };
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function hasKey(provider: Provider): boolean {
  if (provider === "groq") return !!env("GROQ_API_KEY");
  if (provider === "google") return !!env("GOOGLE_API_KEY");
  if (provider === "openai") return !!env("OPENAI_API_KEY");
  return false;
}

// ✅ supports single-line or multi-line env values
function parseProvidersJson(): ProviderEnvItem[] {
  const raw = env("PROVIDERS_JSON");
  if (!raw) return [];

  const cleaned = raw.replace(/\r?\n/g, "").trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed as ProviderEnvItem[];
  } catch (e) {
    console.error("[capabilities] Failed to parse PROVIDERS_JSON:", e);
    return [];
  }
}

const ALL_PROVIDERS: Provider[] = ["groq", "google", "openai"];

export async function getCapabilities(_req: Request, res: Response) {
  const raw = env("PROVIDERS_JSON");
  const config = parseProvidersJson();

  const keysPresent: Record<Provider, boolean> = {
    groq: hasKey("groq"),
    google: hasKey("google"),
    openai: hasKey("openai"),
  };

  const byProvider = new Map<Provider, ProviderEnvItem>();
  for (const item of config) {
    if (
      item &&
      (item.provider === "groq" ||
        item.provider === "google" ||
        item.provider === "openai")
    ) {
      byProvider.set(item.provider, item);
    }
  }

  const providers: CapabilitiesResponse["providers"] = {
    groq: { enabled: false, models: [], reasonDisabled: "Not configured" },
    google: { enabled: false, models: [], reasonDisabled: "Not configured" },
    openai: { enabled: false, models: [], reasonDisabled: "Not configured" },
  };

  for (const p of ALL_PROVIDERS) {
    const cfg = byProvider.get(p);

    if (!cfg) {
      providers[p] = {
        enabled: false,
        models: [],
        reasonDisabled: "Missing provider config in PROVIDERS_JSON",
      };
      continue;
    }

    if (!cfg.enabled) {
      providers[p] = {
        enabled: false,
        models: [],
        reasonDisabled: "Disabled by configuration",
      };
      continue;
    }

    if (!keysPresent[p]) {
      providers[p] = {
        enabled: false,
        models: [],
        reasonDisabled: "Missing API key for this provider",
      };
      continue;
    }

    const models: CapModel[] = (cfg.models ?? [])
      .filter(
        (m) =>
          typeof m?.id === "string" &&
          m.id.trim() &&
          typeof m?.name === "string" &&
          m.name.trim()
      )
      .map((m) => ({
        value: `${p}/${m.id}`.trim(),
        label: m.name.trim(),
        description: (m.description ?? "").trim(),
      }));

    if (models.length === 0) {
      providers[p] = {
        enabled: false,
        models: [],
        reasonDisabled: "No models configured for this provider",
      };
      continue;
    }

    providers[p] = { enabled: true, models };
  }

  return res.json({
    providers,
    debug: {
      providersJsonPresent: !!raw,
      providersJsonLength: raw.length,
      keysPresent,
    },
  } satisfies CapabilitiesResponse);
}
