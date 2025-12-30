import { useState, useEffect, useRef, useCallback } from "react";
import type { MetricsStreamData, MetricsSnapshot } from "@/types";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

/* ---------------- type guards (no any) ---------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number";
}

function isMetricsSnapshot(value: unknown): value is MetricsSnapshot {
  if (!isRecord(value)) return false;

  return (
    isString(value.agentId) &&
    isNumber(value.messagesCount) &&
    isNumber(value.tokensProcessed) &&
    isNumber(value.avgLatencyMs) &&
    isNumber(value.lastResponseLatencyMs) &&
    isString(value.updatedAt)
  );
}

function isMetricsStreamData(value: unknown): value is MetricsStreamData {
  if (!isRecord(value)) return false;
  const current = value.current;
  const history = value.history;

  if (!isMetricsSnapshot(current)) return false;
  if (!Array.isArray(history)) return false;
  return history.every(isMetricsSnapshot);
}

/* ---------------- helper: build base url ---------------- */

function getBaseUrl() {
  return import.meta.env.VITE_API_URL ?? "http://localhost:4000";
}

export function useMetricsStream(agentId: string | null) {
  const [metrics, setMetrics] = useState<MetricsStreamData | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  /**
   * ✅ IMPORTANT: Load current snapshot once via REST
   * because SSE might not push immediately.
   */
  const fetchSnapshot = useCallback(async () => {
    try {
      const baseUrl = getBaseUrl();
      const url = agentId
        ? `${baseUrl}/api/metrics?agentId=${encodeURIComponent(agentId)}`
        : `${baseUrl}/api/metrics`;

      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`GET /api/metrics failed (${res.status}): ${txt}`);
      }

      const payload: unknown = await res.json();

      // Backend currently returns a single snapshot (as in your Postman screenshot)
      if (isMetricsSnapshot(payload)) {
        setMetrics((prev) => {
          const prevHistory = prev?.history ?? [];
          const newHistory = [...prevHistory, payload].slice(-60);
          return { current: payload, history: newHistory };
        });
        setError(null);
        return;
      }

      // If later you change backend to return {current, history}
      if (isMetricsStreamData(payload)) {
        setMetrics(payload);
        setError(null);
        return;
      }

      console.warn("Unknown /api/metrics payload:", payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load metrics";
      setError(msg);
    }
  }, [agentId]);

  const connect = useCallback(() => {
    // close previous
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    const baseUrl = getBaseUrl();
    const sseUrl = agentId
      ? `${baseUrl}/api/metrics/stream?agentId=${encodeURIComponent(agentId)}`
      : `${baseUrl}/api/metrics/stream`;

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionStatus("connected");
      setError(null);
      // ✅ ensure UI is never empty even if SSE doesn't push immediately
      fetchSnapshot();
    };

    es.onmessage = (event) => {
      try {
        const parsed: unknown = JSON.parse(event.data);

        // backend could send { error: "..." }
        if (isRecord(parsed) && isString(parsed.error)) {
          setError(parsed.error);
          return;
        }

        // stream payload could be a snapshot
        if (isMetricsSnapshot(parsed)) {
          setMetrics((prev) => {
            const prevHistory = prev?.history ?? [];
            const newHistory = [...prevHistory, parsed].slice(-60);
            return { current: parsed, history: newHistory };
          });
          setError(null);
          return;
        }

        // or { current, history }
        if (isMetricsStreamData(parsed)) {
          setMetrics(parsed);
          setError(null);
          return;
        }

        console.warn("Unknown metrics SSE payload:", parsed);
      } catch (e) {
        console.error("Error parsing SSE metrics:", e);
      }
    };

    es.onerror = () => {
      es.close();
      setConnectionStatus("reconnecting");

      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [agentId, fetchSnapshot]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnectionStatus("disconnected");
  }, []);

  // When agent changes: reset and reconnect + fetch snapshot
  useEffect(() => {
    setMetrics(null);
    setError(null);
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    metrics,
    isConnected: connectionStatus === "connected",
    connectionStatus,
    error,
    reconnect: connect,
    refetchSnapshot: fetchSnapshot,
  };
}
