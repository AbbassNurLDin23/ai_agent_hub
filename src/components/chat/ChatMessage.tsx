import { User, Bot, Clock, Zap } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary' : 'bg-secondary'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div className={cn('chat-bubble', isUser ? 'user' : 'assistant')}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        <div
          className={cn(
            'flex items-center gap-3 text-[10px] text-muted-foreground',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>

          {!isUser && message.tokens_used > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {message.tokens_used} tokens • {message.latency_ms}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
