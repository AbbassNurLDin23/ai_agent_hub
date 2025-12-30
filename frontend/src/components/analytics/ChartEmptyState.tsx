import { BarChart3, MessageSquare } from 'lucide-react';

interface ChartEmptyStateProps {
  type?: 'latency' | 'tokens';
}

export function ChartEmptyState({ type = 'latency' }: ChartEmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-3">
        {type === 'latency' ? (
          <BarChart3 className="w-6 h-6 text-muted-foreground" />
        ) : (
          <MessageSquare className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm text-muted-foreground max-w-[200px]">
        Metrics will appear after sending messages to an agent.
      </p>
    </div>
  );
}
