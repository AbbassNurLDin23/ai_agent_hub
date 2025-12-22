-- Create agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create metrics_snapshots table for analytics
CREATE TABLE public.metrics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  messages_count INTEGER NOT NULL DEFAULT 0,
  tokens_processed INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms REAL NOT NULL DEFAULT 0,
  last_response_latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for demo purposes - no auth required)
CREATE POLICY "Allow public read access on agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on agents" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on agents" ON public.agents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on agents" ON public.agents FOR DELETE USING (true);

CREATE POLICY "Allow public read access on conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on conversations" ON public.conversations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on conversations" ON public.conversations FOR DELETE USING (true);

CREATE POLICY "Allow public read access on messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on messages" ON public.messages FOR DELETE USING (true);

CREATE POLICY "Allow public read access on metrics_snapshots" ON public.metrics_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on metrics_snapshots" ON public.metrics_snapshots FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages and metrics
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metrics_snapshots;

-- Create indexes for performance
CREATE INDEX idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_metrics_agent_id ON public.metrics_snapshots(agent_id);
CREATE INDEX idx_metrics_created_at ON public.metrics_snapshots(created_at);