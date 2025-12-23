import { useState } from 'react';
import { Plus, Bot, Search } from 'lucide-react';
import { Agent } from '@/types';
import { AgentCard } from './AgentCard';
import { AgentForm } from './AgentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AgentListProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onCreateAgent: (data: { name: string; system_prompt: string; model: string }) => Promise<unknown>;
  onUpdateAgent: (id: string, data: Partial<Agent>) => Promise<unknown>;
  onDeleteAgent: (id: string) => Promise<void>;
  onChatWithAgent: (id: string) => void;
  isLoading?: boolean;
}

export function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onChatWithAgent,
  isLoading,
}: AgentListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.system_prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (data: { name: string; system_prompt: string; model: string }) => {
    setIsSubmitting(true);
    try {
      if (editingAgent) {
        await onUpdateAgent(editingAgent.id, data);
      } else {
        await onCreateAgent(data);
      }
      setShowForm(false);
      setEditingAgent(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deletingAgent) {
      await onDeleteAgent(deletingAgent.id);
      setDeletingAgent(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">AI Agents</h1>
          <p className="text-muted-foreground">
            Manage and deploy your AI assistants
          </p>
        </div>

        <Button variant="glow" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50"
        />
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel p-5 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary" />
                <div className="flex-1">
                  <div className="h-5 bg-secondary rounded w-3/4 mb-2" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-secondary rounded mb-4" />
              <div className="h-4 bg-secondary rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No agents found' : 'No agents yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first AI agent to get started'}
          </p>
          {!searchQuery && (
            <Button variant="glow" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Create Agent
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={agent.id === selectedAgentId}
              onSelect={() => onSelectAgent(agent.id)}
              onEdit={() => {
                setEditingAgent(agent);
                setShowForm(true);
              }}
              onDelete={() => setDeletingAgent(agent)}
              onChat={() => onChatWithAgent(agent.id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <AgentForm
          agent={editingAgent}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAgent(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAgent} onOpenChange={() => setDeletingAgent(null)}>
        <AlertDialogContent className="glass-panel border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAgent?.name}"? This action cannot
              be undone and will remove all associated conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
