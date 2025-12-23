import { useEffect, useRef } from 'react';
import { Bot, MessageSquare, RotateCcw } from 'lucide-react';
import { Agent, Message, Conversation } from '@/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ConversationList } from './ConversationList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AVAILABLE_MODELS } from '@/types';

interface ChatViewProps {
  agent: Agent | null;
  messages: Message[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  isSending?: boolean;
}

export function ChatView({
  agent,
  messages,
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onSendMessage,
  isLoading,
  isSending,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const modelInfo = agent
    ? AVAILABLE_MODELS.find((m) => m.value === agent.model)
    : null;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation Sidebar */}
      <div className="w-72 glass-panel hidden md:flex flex-col">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={onSelectConversation}
          onNewConversation={onNewConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col glass-panel">
        {/* Chat Header */}
        {agent && (
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">{agent.name}</h2>
              <p className="text-xs text-muted-foreground">
                {modelInfo?.label || agent.model}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNewConversation}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Starts a new conversation while keeping the same agent.</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {!agent ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select an Agent</h3>
              <p className="text-muted-foreground max-w-sm">
                Choose an agent from the Agents page to start a conversation
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-secondary" />
                  <div className="flex-1">
                    <div className="h-16 bg-secondary rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 pulse-glow">
                <Bot className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
              <p className="text-muted-foreground max-w-sm">
                Send a message to begin chatting with {agent.name}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isSending && <TypingIndicator />}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <ChatInput
            onSend={onSendMessage}
            isLoading={isSending}
            disabled={!agent}
          />
        </div>
      </div>
    </div>
  );
}
