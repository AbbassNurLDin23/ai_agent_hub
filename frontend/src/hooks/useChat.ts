import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Message, Conversation } from "@/types";

type SendMessageResponse = {
  conversationId: string;
  userMessage: Message;
  assistantMessage: Message;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

export function useChat(agentId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!agentId) return;

    try {
      const data = await api<Conversation[]>(
        `/api/agents/${agentId}/conversations`
      );

      const list = data ?? [];
      setConversations(list);

      // auto-select most recent conversation (only if none selected yet)
      setActiveConversation((prev) => prev ?? list[0] ?? null);
    } catch (err: unknown) {
      console.error("Error fetching conversations:", err);
      toast.error("Failed to load conversations");
    }
  }, [agentId]);

  const fetchMessages = useCallback(async () => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await api<Message[]>(
        `/api/conversations/${activeConversation.id}/messages`
      );
      setMessages(data ?? []);
    } catch (err: unknown) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation]);

  const createConversation = useCallback(
    async (title: string | null = null) => {
      if (!agentId) throw new Error("agentId is required");

      const conv = await api<Conversation>(
        `/api/agents/${agentId}/conversations`,
        {
          method: "POST",
          body: JSON.stringify({ title }),
        }
      );

      return conv;
    },
    [agentId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!agentId || !content.trim()) return;

      setIsSending(true);

      try {
        // ensure we have a conversation
        let conversation = activeConversation;

        if (!conversation) {
          conversation = await createConversation(null);

          setActiveConversation(conversation);
          setConversations((prev) => [conversation!, ...prev]);
          setMessages([]);
        }

        // optimistic user message
        const tempUserMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId: conversation.id,
          role: "user",
          content,
          tokensUsed: 0,
          latencyMs: 0,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempUserMessage]);

        const result = await api<SendMessageResponse>(
          `/api/conversations/${conversation.id}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ content }),
          }
        );

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
          return [...filtered, result.userMessage, result.assistantMessage];
        });

        // refresh conversations ordering (optional but useful if backend sorts by "last activity")
        // await fetchConversations();
      } catch (err: unknown) {
        console.error("Error sending message:", err);
        toast.error(getErrorMessage(err) || "Failed to send message");
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
      } finally {
        setIsSending(false);
      }
    },
    [agentId, activeConversation, createConversation]
  );

  const startNewConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  // When agent changes: reload conversations and reset selection/messages
  useEffect(() => {
    setActiveConversation(null);
    setMessages([]);
    setConversations([]);
    fetchConversations();
  }, [agentId, fetchConversations]);

  // When conversation changes: load messages
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    conversations,
    activeConversation,
    setActiveConversation,
    isLoading,
    isSending,
    sendMessage,
    startNewConversation,
    refetchConversations: fetchConversations,
  };
}
