import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import useNotificationStore from "../store/useNotificationStore";
import config from "../config/config";

const ws_web = config.ws_web;

export function useWebSocket() {
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const isConnecting = useRef(false);
  const isMounted = useRef(true);

  const { user, accessToken } = useAuth();

  const {
    isConnected,
    reconnectAttempts,
    addNotification,
    fetchNotifications,
    setConnectionStatus,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    setWebSocket,
  } = useNotificationStore();

  const disconnect = useCallback(() => {
    console.log("🔌 Disconnecting WebSocket...");
    isConnecting.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (ws.current) {
      ws.current.onclose = null; // Prevent reconnection on manual disconnect
      if (
        ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING
      ) {
        ws.current.close();
      }
      ws.current = null;
    }

    setConnectionStatus(false);
    setWebSocket(null);
    resetReconnectAttempts();
  }, [setConnectionStatus, setWebSocket, resetReconnectAttempts]);

  const connect = useCallback(() => {
    if (isConnecting.current || !isMounted.current) {
      console.log("Already connecting or component unmounted, skipping...");
      return;
    }

    if (!user || !accessToken) {
      console.log("No user or token, skipping WebSocket connection");
      return;
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn("🚫 Max WebSocket reconnect attempts reached. Giving up.");
      return;
    }

    if (ws.current) {
      if (
        ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING
      ) {
        console.log("Closing existing WebSocket connection...");
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
    }

    isConnecting.current = true;

    try {
      // Always use trailing slash to match backend route
      const WS_URL = `${ws_web}/ws/notifications/`;
      ws.current = new WebSocket(`${WS_URL}?token=${accessToken}`);
      setWebSocket(ws.current);

      ws.current.onopen = () => {
        if (!isMounted.current) return;

        isConnecting.current = false;
        setConnectionStatus(true);
        resetReconnectAttempts();

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        fetchNotifications(accessToken);
      };

      ws.current.onmessage = (e) => {
        if (!isMounted.current) return;

        try {
          const data = JSON.parse(e.data);

          if (data.type === "connection" || data.type === "pong") {
            return;
          }

          const notificationData = data.content || data;

          if (notificationData.id) {
            addNotification(notificationData);
            // No push notification for web
          }
        } catch (error) {
          console.error("WebSocket message parse error:", error);
        }
      };

      ws.current.onerror = (e) => {
        isConnecting.current = false;
        // Enhanced error logging
        console.error(
          "WebSocket error:",
          e,
          e.message,
          e.type,
          e.target,
          e.currentTarget
        );
        if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
          console.error("WebSocket readyState:", ws.current.readyState);
        }
      };

      ws.current.onclose = (e) => {
        if (!isMounted.current) return;

        isConnecting.current = false;
        setConnectionStatus(false);
        setWebSocket(null);

        // Enhanced error logging
        console.warn(
          `WebSocket closed. Code: ${e.code}, Reason: ${
            e.reason || "No reason provided"
          }, WasClean: ${e.wasClean}`,
          e
        );

        // Log more details if available
        if (e.target && e.target.url) {
          console.warn("WebSocket closed for URL:", e.target.url);
        }

        const currentWs = ws.current;
        ws.current = null;

        // Don't reconnect on manual close or if component is unmounted
        if (!currentWs || !isMounted.current) {
          return;
        }

        // Handle specific error codes
        if (
          e.code === 1006 &&
          (e.reason?.includes("403") || e.reason?.includes("401"))
        ) {
          console.error(
            "WebSocket closed with code 1006 and possible auth error. No reconnect."
          );
          return;
        }

        // Only reconnect if we haven't exceeded max attempts
        if (user && accessToken && reconnectAttempts < maxReconnectAttempts) {
          incrementReconnectAttempts();
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(
            `⏳ Reconnecting in ${delay / 1000}s (attempt ${
              reconnectAttempts + 1
            }/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              connect();
            }
          }, delay);
        } else {
          console.warn("❗ No more reconnect attempts will be made.");
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      isConnecting.current = false;

      if (
        user &&
        accessToken &&
        reconnectAttempts < maxReconnectAttempts &&
        isMounted.current
      ) {
        incrementReconnectAttempts();
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            connect();
          }
        }, delay);
      }
    }
  }, [
    user,
    accessToken,
    reconnectAttempts,
    addNotification,
    fetchNotifications,
    setConnectionStatus,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    setWebSocket,
  ]);

  useEffect(() => {
    isMounted.current = true;

    if (user && accessToken) {
      const connectionTimeout = setTimeout(() => {
        if (isMounted.current) {
          connect();
        }
      }, 100);

      return () => {
        clearTimeout(connectionTimeout);
        isMounted.current = false;
        disconnect();
      };
    } else {
      disconnect();
    }

    return () => {
      isMounted.current = false;
      disconnect();
    };
  }, [user, user?.id, accessToken, connect, disconnect]);

  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        try {
          ws.current.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          console.error("Error sending ping:", error);
        }
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, []);

  return {
    isConnected,
    disconnect,
    connect: () => {
      resetReconnectAttempts();
      connect();
    },
  };
}
