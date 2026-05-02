import { useEffect, useRef, useState, useCallback } from "react";
import { BotMessage, GameState } from "./types";

interface UseWebSocketProps {
  sessionId: string;
  onMessage?: (message: BotMessage) => void;
  onGameStateUpdate?: (gameState: GameState) => void;
}

export function useWebSocket({
  sessionId,
  onMessage,
  onGameStateUpdate,
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  
  const onMessageRef = useRef(onMessage);
  const onGameStateUpdateRef = useRef(onGameStateUpdate);
  
  useEffect(() => {
    onMessageRef.current = onMessage;
    onGameStateUpdateRef.current = onGameStateUpdate;
  }, [onMessage, onGameStateUpdate]);

  useEffect(() => {
    isMountedRef.current = true;
    
    const connect = () => {
      if (!isMountedRef.current) {
        return;
      }

      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:7860";
        console.log("🔌 Connecting to WebSocket:", wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          setIsConnected(true);
          setError(null);

          ws.send(
            JSON.stringify({
              type: "init",
              sessionId,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const message: BotMessage = JSON.parse(event.data);
            console.log("📨 Received:", message.type);

            if (message.gameState && onGameStateUpdateRef.current) {
              onGameStateUpdateRef.current(message.gameState);
            }

            if (onMessageRef.current) {
              onMessageRef.current(message);
            }
          } catch (err) {
            console.error("Error parsing message:", err);
          }
        };

        ws.onerror = () => {
          console.error("WebSocket error");
          setError("Connection error");
        };

        ws.onclose = (event) => {
          console.log("🔌 WebSocket closed", event.code);
          setIsConnected(false);
          wsRef.current = null;

          if (isMountedRef.current && event.code !== 1000) {
            console.log("⏳ Will reconnect in 3 seconds...");
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("🔄 Reconnecting...");
              connect();
            }, 3000);
          }
        };
      } catch (err) {
        console.error("Error creating WebSocket:", err);
        setError("Failed to connect");
      }
    };

    connect();

    return () => {
      console.log("🧹 Cleaning up WebSocket");
      isMountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [sessionId]); 

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  return {
    isConnected,
    error,
    sendMessage,
  };
}
