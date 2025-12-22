import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-cache",
  "Content-Type": "text/event-stream",
  "Connection": "keep-alive",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  console.log(`Starting metrics stream for agent: ${agentId || "all"}`);

  const encoder = new TextEncoder();
  let intervalId: number;

  const stream = new ReadableStream({
    start(controller) {
      const sendMetrics = async () => {
        try {
          let query = supabase
            .from("metrics_snapshots")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1);

          if (agentId) {
            query = query.eq("agent_id", agentId);
          }

          const { data: latestMetrics } = await query.single();

          // Get metrics history for charts (last 20 snapshots)
          let historyQuery = supabase
            .from("metrics_snapshots")
            .select("created_at, avg_latency_ms, tokens_processed, messages_count, last_response_latency_ms")
            .order("created_at", { ascending: false })
            .limit(20);

          if (agentId) {
            historyQuery = historyQuery.eq("agent_id", agentId);
          }

          const { data: metricsHistory } = await historyQuery;

          // Calculate global metrics if no agent specified
          let globalMetrics = null;
          if (!agentId) {
            const { data: allMetrics } = await supabase
              .from("metrics_snapshots")
              .select("messages_count, tokens_processed, avg_latency_ms")
              .order("created_at", { ascending: false });

            if (allMetrics && allMetrics.length > 0) {
              const agentLatest = new Map();
              allMetrics.forEach((m: any) => {
                if (!agentLatest.has(m.agent_id)) {
                  agentLatest.set(m.agent_id, m);
                }
              });

              const latest = Array.from(agentLatest.values());
              globalMetrics = {
                totalMessages: latest.reduce((sum: number, m: any) => sum + (m.messages_count || 0), 0),
                totalTokens: latest.reduce((sum: number, m: any) => sum + (m.tokens_processed || 0), 0),
                avgLatency: latest.length > 0
                  ? latest.reduce((sum: number, m: any) => sum + (m.avg_latency_ms || 0), 0) / latest.length
                  : 0,
              };
            }
          }

          const payload = {
            timestamp: new Date().toISOString(),
            agentId,
            current: latestMetrics || {
              messages_count: 0,
              tokens_processed: 0,
              avg_latency_ms: 0,
              last_response_latency_ms: 0,
            },
            history: (metricsHistory || []).reverse(),
            global: globalMetrics,
          };

          const data = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error("Error fetching metrics:", error);
          const errorData = `data: ${JSON.stringify({ error: "Failed to fetch metrics" })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      };

      // Send immediately then every 3 seconds
      sendMetrics();
      intervalId = setInterval(sendMetrics, 3000);
    },
    cancel() {
      console.log("Client disconnected from metrics stream");
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, { headers: corsHeaders });
});
