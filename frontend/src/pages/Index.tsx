import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AgentList } from '@/components/agents/AgentList';
import { useAgents } from '@/hooks/useAgents';

const Index = () => {
  const navigate = useNavigate();
  const { agents, isLoading, createAgent, updateAgent, deleteAgent } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const handleChatWithAgent = (agentId: string) => {
    navigate(`/chat?agent=${agentId}`);
  };

  return (
    <Layout>
      <AgentList
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={setSelectedAgentId}
        onCreateAgent={createAgent}
        onUpdateAgent={updateAgent}
        onDeleteAgent={deleteAgent}
        onChatWithAgent={handleChatWithAgent}
        isLoading={isLoading}
      />
    </Layout>
  );
};

export default Index;
