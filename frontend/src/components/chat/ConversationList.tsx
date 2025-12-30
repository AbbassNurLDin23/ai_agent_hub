import { Plus, MessageSquare } from "lucide-react";
import type { Conversation } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

function titleFor(convo: Conversation, indexFromTop: number) {
  const t = (convo.title ?? "").trim();
  if (t) return t;
  // fallback if backend still returns null title (before first message)
  return `Chat ${indexFromTop + 1}`;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  return (
    <div className="p-4 flex flex-col gap-3 h-full">
      <Button
        onClick={onNewConversation}
        className="w-full justify-start gap-2"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </Button>

      <div className="mt-2 flex-1 overflow-auto space-y-2">
        {conversations.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2 py-3">
            No conversations yet.
          </div>
        ) : (
          conversations.map((c, idx) => {
            const active = c.id === activeConversationId;
            return (
              <button
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={cn(
                  "w-full text-left rounded-xl px-3 py-3 transition-colors border",
                  active
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/20 border-border hover:bg-secondary/40"
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {titleFor(c, idx)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
