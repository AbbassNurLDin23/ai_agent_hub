import { useState } from "react";
import { Bot, Pencil, Trash2, MessageSquare, Clock, Cpu } from "lucide-react";
import type { Agent } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  modelLabel?: string; // ✅ new
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChat: () => void;
}

export function AgentCard({
  agent,
  isSelected,
  modelLabel,
  onSelect,
  onEdit,
  onDelete,
  onChat,
}: AgentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "glass-panel p-5 cursor-pointer transition-all duration-300 glow-border group",
        isSelected
          ? "border-primary/50 bg-primary/5"
          : "hover:border-primary/30 hover:bg-card/90"
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              isSelected
                ? "bg-gradient-primary shadow-glow"
                : "bg-secondary group-hover:bg-primary/20"
            )}
          >
            <Bot
              className={cn(
                "w-6 h-6 transition-colors",
                isSelected ? "text-primary-foreground" : "text-primary"
              )}
            />
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cpu className="w-3 h-3" />
              <span>{modelLabel ?? "Unknown Model"}</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex gap-1 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onChat}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {agent.systemPrompt}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            Updated{" "}
            {formatDistanceToNow(new Date(agent.updatedAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {isSelected && (
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] uppercase tracking-wider font-medium">
            Active
          </span>
        )}
      </div>
    </div>
  );
}
