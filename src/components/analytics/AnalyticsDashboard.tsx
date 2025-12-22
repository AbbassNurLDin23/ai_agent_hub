import { MessageSquare, Zap, Clock, Activity, Wifi, WifiOff } from 'lucide-react';
import { MetricsStreamData, Agent } from '@/types';
import { StatCard } from './StatCard';
import { LatencyChart } from './LatencyChart';
import { TokensChart } from './TokensChart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsDashboardProps {
  metrics: MetricsStreamData | null;
  agents: Agent[];
  selectedAgentId: string | null;
  onAgentChange: (agentId: string | null) => void;
  isConnected: boolean;
}

export function AnalyticsDashboard({
  metrics,
  agents,
  selectedAgentId,
  onAgentChange,
  isConnected,
}: AnalyticsDashboardProps) {
  const current = metrics?.current || {
    messages_count: 0,
    tokens_processed: 0,
    avg_latency_ms: 0,
    last_response_latency_ms: 0,
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Analytics</h1>
          <p className="text-muted-foreground">
            Real-time performance metrics and insights
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-success" />
                <span className="text-xs text-success">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-destructive" />
                <span className="text-xs text-destructive">Disconnected</span>
              </>
            )}
          </div>

          <Select
            value={selectedAgentId || 'all'}
            onValueChange={(v) => onAgentChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[200px] bg-secondary/50">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Messages"
          value={formatNumber(current.messages_count)}
          icon={<MessageSquare className="w-6 h-6 text-primary" />}
          trendLabel="All time"
        />
        <StatCard
          title="Tokens Processed"
          value={formatNumber(current.tokens_processed)}
          icon={<Zap className="w-6 h-6 text-primary" />}
          trendLabel="All time"
        />
        <StatCard
          title="Avg Latency"
          value={`${Math.round(current.avg_latency_ms)}ms`}
          icon={<Clock className="w-6 h-6 text-primary" />}
          trendLabel="Rolling average"
        />
        <StatCard
          title="Last Response"
          value={`${current.last_response_latency_ms}ms`}
          icon={<Activity className="w-6 h-6 text-primary" />}
          trendLabel="Most recent"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LatencyChart data={metrics?.history || []} />
        <TokensChart data={metrics?.history || []} />
      </div>
    </div>
  );
}
