import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { agentId, conversationId, message } = await req.json();

    if (!agentId || !message) {
      return new Response(
        JSON.stringify({ error: "agentId and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      console.error("Agent not found:", agentError);
      return new Response(
        JSON.stringify({ error: "Agent not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle conversation - create if needed
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({ agent_id: agentId, title: message.substring(0, 50) })
        .select()
        .single();

      if (convError) {
        console.error("Failed to create conversation:", convError);
        return new Response(
          JSON.stringify({ error: "Failed to create conversation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      activeConversationId = newConversation.id;
    }

    // Get conversation history
    const { data: history, error: historyError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (historyError) {
      console.error("Failed to fetch history:", historyError);
    }

    // Store user message
    const { error: userMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeConversationId,
        role: "user",
        content: message,
      });

    if (userMsgError) {
      console.error("Failed to store user message:", userMsgError);
    }

    // Build messages for LLM
    const messages = [
      { role: "system", content: agent.system_prompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    console.log(`Calling LLM for agent ${agent.name} with model ${agent.model}`);

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "google/gemini-2.5-flash",
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    const assistantContent = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.";
    const tokensUsed = data.usage?.total_tokens || Math.ceil(assistantContent.length / 4);

    // Store assistant message with metrics
    const { error: assistantMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeConversationId,
        role: "assistant",
        content: assistantContent,
        tokens_used: tokensUsed,
        latency_ms: latencyMs,
      });

    if (assistantMsgError) {
      console.error("Failed to store assistant message:", assistantMsgError);
    }

    // Store metrics snapshot
    const { data: existingMetrics } = await supabase
      .from("metrics_snapshots")
      .select("messages_count, tokens_processed, avg_latency_ms")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const prevCount = existingMetrics?.messages_count || 0;
    const prevTokens = existingMetrics?.tokens_processed || 0;
    const prevAvgLatency = existingMetrics?.avg_latency_ms || 0;

    const newCount = prevCount + 2; // user + assistant
    const newTokens = prevTokens + tokensUsed;
    const newAvgLatency = ((prevAvgLatency * prevCount) + latencyMs) / (prevCount + 1);

    await supabase.from("metrics_snapshots").insert({
      agent_id: agentId,
      messages_count: newCount,
      tokens_processed: newTokens,
      avg_latency_ms: newAvgLatency,
      last_response_latency_ms: latencyMs,
    });

    console.log(`Response generated in ${latencyMs}ms, tokens: ${tokensUsed}`);

    return new Response(
      JSON.stringify({
        conversationId: activeConversationId,
        message: assistantContent,
        tokensUsed,
        latencyMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
