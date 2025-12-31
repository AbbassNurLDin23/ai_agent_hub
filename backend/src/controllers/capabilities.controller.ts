// backend/src/controllers/capabilities.controller.ts
import type { Request, Response } from "express";
import {
  type Provider,
  type ProviderItem,
  loadProviders,
  hasProviderKey,
} from "../config/providers";

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
    providersFile: string;
    providersFilePresent: boolean;
    providersJsonPresent: boolean;
    keysPresent: Record<Provider, boolean>;
  };
};

const ALL_PROVIDERS: Provider[] = ["groq", "google", "openai"];

function toCapModels(provider: Provider, item: ProviderItem): CapModel[] {
  return (item.models ?? [])
    .filter((m) => typeof m?.id === "string" && m.id.trim())
    .map((m) => ({
      value: `${provider}/${m.id}`.trim(),
      label: (m.name ?? m.id).trim(),
      description: (m.description ?? "").trim(),
    }));
}

export async function getCapabilities(_req: Request, res: Response) {
  const { providers: cfgList, debug: cfgDebug } = loadProviders();

  const keysPresent: Record<Provider, boolean> = {
    groq: hasProviderKey("groq"),
    google: hasProviderKey("google"),
    openai: hasProviderKey("openai"),
  };

  // Map config by provider
  const byProvider = new Map<Provider, ProviderItem>();
  for (const item of cfgList) {
    byProvider.set(item.provider, item);
  }

  const out: CapabilitiesResponse["providers"] = {
    groq: { enabled: false, models: [], reasonDisabled: "Not configured" },
    google: { enabled: false, models: [], reasonDisabled: "Not configured" },
    openai: { enabled: false, models: [], reasonDisabled: "Not configured" },
  };

  for (const p of ALL_PROVIDERS) {
    const item = byProvider.get(p);

    if (!item) {
      out[p] = {
        enabled: false,
        models: [],
        reasonDisabled:
          "Missing provider config (check providers.json / PROVIDERS_FILE)",
      };
      continue;
    }

    if (!keysPresent[p]) {
      out[p] = {
        enabled: false,
        models: [],
        reasonDisabled: "Missing API key for this provider",
      };
      continue;
    }

    // item.enabled here already includes: enabled by cfg + key present + models not empty
    if (!item.enabled) {
      out[p] = {
        enabled: false,
        models: [],
        reasonDisabled: "Disabled by configuration or no models configured",
      };
      continue;
    }

    const models = toCapModels(p, item);

    if (models.length === 0) {
      out[p] = {
        enabled: false,
        models: [],
        reasonDisabled: "No models configured for this provider",
      };
      continue;
    }

    out[p] = { enabled: true, models };
  }

  return res.json({
    providers: out,
    debug: {
      providersFile: cfgDebug.providersFile,
      providersFilePresent: cfgDebug.providersFilePresent,
      providersJsonPresent: cfgDebug.providersJsonPresent,
      keysPresent,
    },
  } satisfies CapabilitiesResponse);
}
