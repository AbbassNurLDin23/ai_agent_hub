import { useEffect, useMemo, useState } from "react";
import { X, Save, Bot } from "lucide-react";
import type { Agent, CapabilitiesResponse, CapModel } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentFormProps {
  agent?: Agent | null;
  onSubmit: (data: {
    name: string;
    systemPrompt: string;
    model: string; // "provider/modelId"
  }) => Promise<unknown>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AgentForm({
  agent,
  onSubmit,
  onCancel,
  isLoading,
}: AgentFormProps) {
  const [cap, setCap] = useState<CapabilitiesResponse | null>(null);

  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("");

  // load capabilities
  useEffect(() => {
    (async () => {
      const c = await api<CapabilitiesResponse>("/api/capabilities");
      setCap(c);
    })();
  }, []);

  const allEnabledModels: CapModel[] = useMemo(() => {
    if (!cap) return [];
    const providers = ["groq", "google", "openai"] as const;

    const list: CapModel[] = [];
    for (const p of providers) {
      const prov = cap.providers[p];
      if (prov?.enabled) {
        list.push(...(prov.models ?? []));
      }
    }
    return list;
  }, [cap]);

  const noModelsAvailable = cap ? allEnabledModels.length === 0 : false;

  // initialize when editing or first load
  useEffect(() => {
    if (!cap) return;

    if (agent) {
      setName(agent.name);
      setSystemPrompt(agent.systemPrompt);

      // keep model if still available, otherwise fallback
      const stillExists = allEnabledModels.some((m) => m.value === agent.model);
      setModel(stillExists ? agent.model : allEnabledModels[0]?.value ?? "");
      return;
    }

    setName("");
    setSystemPrompt("");
    setModel(allEnabledModels[0]?.value ?? "");
  }, [agent, cap, allEnabledModels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, systemPrompt, model });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-scale-in">
      <div className="glass-panel w-full max-w-lg p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold">
              {agent ? "Edit Agent" : "Create Agent"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="e.g., Customer Support Assistant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-secondary/50"
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={model}
              onValueChange={setModel}
              disabled={!cap || noModelsAvailable}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {allEnabledModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex flex-col">
                      <span>{m.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {noModelsAvailable && (
              <p className="text-xs text-destructive">
                No models available. Check PROVIDERS_JSON + API keys in .env.
              </p>
            )}
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              placeholder="Define the agent's behavior and personality..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              required
              rows={6}
              className="bg-secondary/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="glow"
              className="flex-1"
              disabled={
                isLoading ||
                !name ||
                !systemPrompt ||
                !model ||
                noModelsAvailable
              }
            >
              <Save className="w-4 h-4" />
              {agent ? "Update Agent" : "Create Agent"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
