import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Agent } from "@/types";

type CreateAgentInput = {
  name: string;
  systemPrompt: string;
  model: string;
};

type UpdateAgentInput = Partial<Pick<Agent, "name" | "systemPrompt" | "model">>;

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const data = await api<Agent[]>("/api/agents");
      setAgents(data ?? []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (agent: CreateAgentInput) => {
    try {
      const data = await api<Agent>("/api/agents", {
        method: "POST",
        body: JSON.stringify(agent),
      });

      setAgents((prev) => [data, ...prev]);
      toast.success("Agent created successfully");
      return data;
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
      throw error;
    }
  };

  const updateAgent = async (id: string, updates: UpdateAgentInput) => {
    try {
      // ✅ Guard: no empty payload
      if (!updates || Object.keys(updates).length === 0) {
        toast.error("Nothing to update");
        throw new Error("No fields provided to update");
      }

      let updated: Agent;

      // ✅ Prefer PATCH (matches your new backend)
      try {
        updated = await api<Agent>(`/api/agents/${id}`, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
      } catch (e) {
        // ✅ Fallback to PUT if server doesn't support PATCH for any reason
        updated = await api<Agent>(`/api/agents/${id}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        });
      }

      setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));

      toast.success("Agent updated successfully");
      return updated;
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Failed to update agent");
      throw error;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      await api<void>(`/api/agents/${id}`, { method: "DELETE" });

      setAgents((prev) => prev.filter((a) => a.id !== id));

      toast.success("Agent deleted successfully");
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
      throw error;
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    refetch: fetchAgents,
  };
}
