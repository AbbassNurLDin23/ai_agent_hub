import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useAgents } from '@/hooks/useAgents';
import { useMetricsStream } from '@/hooks/useMetricsStream';

export default function Analytics() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents } = useAgents();
  const { metrics, isConnected, connectionStatus } = useMetricsStream(selectedAgentId);

  return (
    <Layout>
      <AnalyticsDashboard
        metrics={metrics}
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={setSelectedAgentId}
        isConnected={isConnected}
        connectionStatus={connectionStatus}
      />
    </Layout>
  );
}
