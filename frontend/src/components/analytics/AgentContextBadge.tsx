import { Bot, Users } from 'lucide-react';
import { Agent } from '@/types';

interface AgentContextBadgeProps {
  agents: Agent[];
  selectedAgentId: string | null;
}

export function AgentContextBadge({ agents, selectedAgentId }: AgentContextBadgeProps) {
  const selectedAgent = selectedAgentId 
    ? agents.find((a) => a.id === selectedAgentId) 
    : null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-sm animate-fade-in">
      {selectedAgent ? (
        <>
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Viewing metrics for:</span>
          <span className="font-medium text-foreground">{selectedAgent.name}</span>
        </>
      ) : (
        <>
          <Users className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">
            Aggregated metrics across all agents
          </span>
        </>
      )}
    </div>
  );
}
