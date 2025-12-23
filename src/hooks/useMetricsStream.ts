import { useState, useEffect, useRef, useCallback } from 'react';
import { MetricsStreamData } from '@/types';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export function useMetricsStream(agentId: string | null) {
  const [metrics, setMetrics] = useState<MetricsStreamData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = agentId
      ? `${baseUrl}/functions/v1/metrics-stream?agentId=${agentId}`
      : `${baseUrl}/functions/v1/metrics-stream`;

    console.log('Connecting to metrics stream:', url);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('Metrics stream connected');
      setConnectionStatus('connected');
      setError(null);
      reconnectAttemptRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
        } else {
          setMetrics(data);
          setError(null);
        }
      } catch (e) {
        console.error('Error parsing metrics:', e);
      }
    };

    eventSource.onerror = (e) => {
      console.error('Metrics stream error:', e);
      eventSource.close();
      
      reconnectAttemptRef.current += 1;
      setConnectionStatus('reconnecting');

      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Attempting to reconnect (attempt ${reconnectAttemptRef.current})...`);
        connect();
      }, 5000);
    };
  }, [agentId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnectionStatus('disconnected');
    reconnectAttemptRef.current = 0;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Legacy compatibility
  const isConnected = connectionStatus === 'connected';

  return {
    metrics,
    isConnected,
    connectionStatus,
    error,
    reconnect: connect,
  };
}
