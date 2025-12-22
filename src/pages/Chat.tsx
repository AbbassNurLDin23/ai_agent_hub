import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ChatView } from '@/components/chat/ChatView';
import { useAgents } from '@/hooks/useAgents';
import { useChat } from '@/hooks/useChat';
import { Agent } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot } from 'lucide-react';

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { agents, isLoading: agentsLoading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const agentIdFromUrl = searchParams.get('agent');

  const {
    messages,
    conversations,
    activeConversation,
    setActiveConversation,
    isLoading: messagesLoading,
    isSending,
    sendMessage,
    startNewConversation,
  } = useChat(selectedAgent?.id || null);

  useEffect(() => {
    if (agentIdFromUrl && agents.length > 0) {
      const agent = agents.find((a) => a.id === agentIdFromUrl);
      if (agent) {
        setSelectedAgent(agent);
      }
    }
  }, [agentIdFromUrl, agents]);

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setSearchParams({ agent: agentId });
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Agent Selector */}
        <div className="flex items-center gap-4 glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Agent</p>
              <p className="font-semibold">
                {selectedAgent?.name || 'Select an agent'}
              </p>
            </div>
          </div>

          <Select
            value={selectedAgent?.id || ''}
            onValueChange={handleAgentChange}
          >
            <SelectTrigger className="w-[250px] bg-secondary/50">
              <SelectValue placeholder="Choose an agent..." />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {agents.length === 0 && !agentsLoading && (
            <button
              onClick={() => navigate('/')}
              className="text-sm text-primary hover:underline"
            >
              Create your first agent →
            </button>
          )}
        </div>

        {/* Chat View */}
        <ChatView
          agent={selectedAgent}
          messages={messages}
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          onNewConversation={startNewConversation}
          onSendMessage={sendMessage}
          isLoading={messagesLoading}
          isSending={isSending}
        />
      </div>
    </Layout>
  );
}
