import { useEffect, useRef, useCallback, useState } from 'react';
import type { WsMessage } from './types';

const ts = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

type OnConnectionChange = (connected: boolean) => void;

export function useWebSocket(onMessage: (msg: WsMessage) => void, onConnectionChange?: OnConnectionChange) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const attemptRef = useRef(0);
  const wasConnectedRef = useRef(false);

  const connect = useCallback(() => {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      const wasConnected = wasConnectedRef.current;
      wasConnectedRef.current = true;
      attemptRef.current = 0;
      if (wasConnected) {
        onMessage({ type: 'log', message: `${ts()} [system] Reconnected to server` } as WsMessage);
      } else {
        onMessage({ type: 'log', message: `${ts()} [system] Connected to server` } as WsMessage);
      }
      onConnectionChange?.(true);
    };
    ws.onclose = () => {
      setConnected(false);
      attemptRef.current++;
      onMessage({ type: 'log', message: `${ts()} [system] Disconnected from server (attempt #${attemptRef.current}), reconnecting in 2s...` } as WsMessage);
      onConnectionChange?.(false);
      reconnectTimer.current = setTimeout(connect, 2000);
    };
    ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch { /* ignore malformed */ }
    };
    ws.onerror = () => ws.close();
  }, [onMessage, onConnectionChange]);

  useEffect(() => {
    const t = setTimeout(() => {
      onMessage({ type: 'log', message: `${ts()} [system] Connecting to server...` } as WsMessage);
      connect();
    }, 100);
    return () => {
      clearTimeout(t);
      wsRef.current?.close();
      clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify(data));
  }, []);

  return { connected, send };
}
