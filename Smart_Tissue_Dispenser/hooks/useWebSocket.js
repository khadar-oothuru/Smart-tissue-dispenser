
import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { schedulePushNotification } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import useNotificationStore from '../store/useNotificationStore';
import config from "../config/config"

const ws_web = config.ws_web;
const wss = config.ws;

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

  const showLocalNotification = async (data) => {
    if (Platform.OS === 'web') {
      // For web, we can use the browser's Notification API as a fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title || '🚨 Device Alert', {
          body: data.message || 'New notification',
          icon: '/favicon.png', // You might want to add an icon
        });
      } else if (document.hasFocus()) {
        // If the document is focused, don't show notification
        return;
      }
      return;
    }

    await schedulePushNotification(
      data.title || '🚨 Device Alert',
      data.message || 'New notification',
      data
    );
  };

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');
    isConnecting.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (ws.current) {
      ws.current.onclose = null; // Prevent reconnection on manual disconnect
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close();
      }
      ws.current = null;
    }
    
    setConnectionStatus(false);
    setWebSocket(null);
    resetReconnectAttempts();
  }, [setConnectionStatus, setWebSocket, resetReconnectAttempts]);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting.current || !isMounted.current) {
      console.log('Already connecting or component unmounted, skipping...');
      return;
    }

    if (!user || !accessToken) {
      console.log('No user or token, skipping WebSocket connection');
      return;
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn('🚫 Max WebSocket reconnect attempts reached. Giving up.');
      return;
    }

    // Close existing connection if any
    if (ws.current) {
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        console.log('Closing existing WebSocket connection...');
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
    }

    isConnecting.current = true;

    try {
      const WS_URL = Platform.select({
        web: `wss://${ws_web}/ws/notifications`,
        default: `wss://${wss}/ws/notifications/`,
      });

      

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
          

          if (data.type === 'connection' || data.type === 'pong') {
            return;
          }

          const notificationData = data.content || data;

          if (notificationData.id) {
            addNotification(notificationData);
            showLocalNotification(notificationData);
          }
        } catch (error) {
          
        }
      };

      ws.current.onerror = (e) => {
     
        isConnecting.current = false;
      };

      ws.current.onclose = (e) => {
        if (!isMounted.current) return;
        
       
        isConnecting.current = false;
        setConnectionStatus(false);
        setWebSocket(null);
        
        const currentWs = ws.current;
        ws.current = null;

        // Don't reconnect on manual close or if component is unmounted
        if (!currentWs || !isMounted.current) {
          return;
        }

        // Handle specific error codes
        if (e.code === 1006 && (e.reason?.includes('403') || e.reason?.includes('401'))) {
         
          return;
        }

        // Only reconnect if we haven't exceeded max attempts
        if (user && accessToken && reconnectAttempts < maxReconnectAttempts) {
          incrementReconnectAttempts();
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`⏳ Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              connect();
            }
          }, delay);
        } else {
          console.warn('❗ No more reconnect attempts will be made.');
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      isConnecting.current = false;

      if (user && accessToken && reconnectAttempts < maxReconnectAttempts && isMounted.current) {
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

  // Main connection effect
  useEffect(() => {
    isMounted.current = true;

    if (user && accessToken) {
      // Small delay to prevent immediate connection on mount
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
  }, [user?.id, accessToken]); // Only depend on user.id and accessToken to prevent unnecessary reconnects

  // Ping interval effect
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        try {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Error sending ping:', error);
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