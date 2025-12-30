import { User, Bot, Clock, Zap, Timer } from "lucide-react";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  message: Message;
}

function safeDistance(dateStr: string | undefined) {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Just now";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const formatLatency = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary" : "bg-secondary"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className={cn("chat-bubble", isUser ? "user" : "assistant")}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        <div
          className={cn(
            "flex items-center gap-3 text-[10px] text-muted-foreground",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {safeDistance(message.createdAt)}
          </span>

          {/* ✅ Assistant message metadata */}
          {!isUser && (message.latencyMs ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground/70">
              <Timer className="w-3 h-3" />
              {formatLatency(message.latencyMs!)}
            </span>
          )}

          {!isUser && (message.tokensUsed ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground/70">
              <Zap className="w-3 h-3" />
              {message.tokensUsed} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
