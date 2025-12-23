import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Conversation } from '@/types';
import { toast } from 'sonner';

export function useChat(agentId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!agentId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);

      // Auto-select most recent conversation
      if (data && data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [agentId, activeConversation]);

  const fetchMessages = useCallback(async () => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map((m) => ({
        ...m,
        role: m.role as 'user' | 'assistant' | 'system',
        latency_ms: m.latency_ms ?? 0,
        tokens_used: m.tokens_used ?? 0,
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation]);

  const sendMessage = async (content: string) => {
    if (!agentId || !content.trim()) return;

    setIsSending(true);

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation?.id || '',
      role: 'user',
      content,
      tokens_used: 0,
      latency_ms: 0,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          agentId,
          conversationId: activeConversation?.id,
          message: content,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        return;
      }

      // If new conversation was created, update state
      if (!activeConversation && data.conversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', data.conversationId)
          .single();

        if (newConv) {
          setActiveConversation(newConv);
          setConversations((prev) => [newConv, ...prev]);
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        conversation_id: data.conversationId,
        role: 'assistant',
        content: data.message,
        tokens_used: data.tokensUsed || 0,
        latency_ms: data.latencyMs || 0,
        created_at: new Date().toISOString(),
      };

      // Replace temp message with actual message from DB
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          { ...tempUserMessage, id: `user-${Date.now()}`, conversation_id: data.conversationId },
          assistantMessage,
        ];
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const startNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  useEffect(() => {
    fetchConversations();
    setActiveConversation(null);
    setMessages([]);
  }, [agentId]);

  useEffect(() => {
    fetchMessages();
  }, [activeConversation, fetchMessages]);

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
