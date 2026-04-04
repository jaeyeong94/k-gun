"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage<T = unknown> {
  type: string;
  stock_code: string;
  timestamp: string;
  data: T;
}

export interface UseWebSocketReturn<T> {
  data: T | null;
  isConnected: boolean;
  error: string | null;
  messagesPerSecond: number;
}

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;
const MPS_WINDOW = 3_000; // 3-second sliding window for messages/sec

export function useWebSocket<T = unknown>(
  stockCode: string | null,
): UseWebSocketReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesPerSecond, setMessagesPerSecond] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const messageTimestampsRef = useRef<number[]>([]);
  const mpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (mpsIntervalRef.current) {
      clearInterval(mpsIntervalRef.current);
      mpsIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(
    (code: string) => {
      if (!mountedRef.current) return;

      cleanup();

      const url = `${WS_BASE_URL}/ws/${code}`;
      let ws: WebSocket;

      try {
        ws = new WebSocket(url);
      } catch {
        setError("WebSocket 연결 생성 실패");
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setError(null);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string) as WebSocketMessage<T>;
          if (msg.type === "orderbook" && msg.data) {
            setData(msg.data);
            messageTimestampsRef.current.push(Date.now());
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);

        // schedule reconnect with exponential backoff
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(
          delay * 2,
          MAX_RECONNECT_DELAY,
        );
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect(code);
          }
        }, delay);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setError("WebSocket 연결 오류");
        // onclose will fire after onerror, handling reconnect
      };

      // Start MPS calculation interval
      mpsIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const cutoff = now - MPS_WINDOW;
        messageTimestampsRef.current =
          messageTimestampsRef.current.filter((t) => t > cutoff);
        const mps =
          messageTimestampsRef.current.length / (MPS_WINDOW / 1_000);
        setMessagesPerSecond(Math.round(mps * 10) / 10);
      }, 1_000);
    },
    [cleanup],
  );

  useEffect(() => {
    mountedRef.current = true;

    if (stockCode) {
      setData(null);
      setError(null);
      setMessagesPerSecond(0);
      messageTimestampsRef.current = [];
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      connect(stockCode);
    } else {
      cleanup();
      setData(null);
      setIsConnected(false);
      setError(null);
      setMessagesPerSecond(0);
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [stockCode, connect, cleanup]);

  return { data, isConnected, error, messagesPerSecond };
}
