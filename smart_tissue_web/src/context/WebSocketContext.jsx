import React, { createContext, useContext, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import useNotificationStore from "../store/useNotificationStore";
import { useAuth } from "../hooks/useAuth";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  // Ensure Auth context is available before using useWebSocket
  const { user, accessToken } = useAuth();
  const { isConnected, disconnect } = useWebSocket();

  // Get all the actions and state from Zustand
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearError,
    getUnreadNotifications,
    getNotificationsByType,
    getNotificationsByDevice,
    getSortedNotifications,
    fetchUnreadCount,
  } = useNotificationStore();

  const isAdmin = user?.role === "admin";
  const userRole = user?.role || null;

  useEffect(() => {
    if (isConnected && accessToken) {
      fetchNotifications(accessToken, { showLoading: false });
    }
  }, [isConnected, accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    fetchUnreadCount(accessToken);

    const intervalTime = isAdmin ? 30000 : 60000;
    const interval = setInterval(() => {
      fetchUnreadCount(accessToken);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [accessToken, isAdmin, fetchUnreadCount]);

  const wrappedFetchNotifications = async (options) => {
    if (!accessToken) {
      return { success: false, error: "No authentication token" };
    }
    return fetchNotifications(accessToken, options);
  };

  const wrappedMarkAsRead = async (notificationId) => {
    if (!accessToken) {
      console.error("No authentication token for marking as read");
      return false;
    }
    return markAsRead(accessToken, notificationId);
  };

  const wrappedMarkAllAsRead = async () => {
    if (!accessToken) {
      console.error("No authentication token for marking all as read");
      return false;
    }
    return markAllAsRead(accessToken);
  };

  const wrappedDeleteNotification = async (notificationId) => {
    if (!accessToken || !isAdmin) {
      console.error("No authentication token or insufficient permissions");
      return false;
    }
    return deleteNotification(accessToken, notificationId);
  };

  const wrappedClearAll = async () => {
    if (!accessToken || !isAdmin) {
      console.error("No authentication token or insufficient permissions");
      return false;
    }
    return clearAll(accessToken);
  };

  const refreshNotifications = async () => {
    await wrappedFetchNotifications({ isRefresh: true });
  };

  const contextValue = {
    isConnected,

    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,

    isAdmin,
    userRole,

    fetchNotifications: wrappedFetchNotifications,
    markAsRead: wrappedMarkAsRead,
    markAllAsRead: wrappedMarkAllAsRead,
    deleteNotification: wrappedDeleteNotification,
    clearAll: wrappedClearAll,
    clearError,
    disconnect,

    getUnreadNotifications,
    getNotificationsByType,
    getNotificationsByDevice,
    getSortedNotifications,
    refreshNotifications,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider"
    );
  }
  return context;
};

export const useAdminNotifications = () => {
  const context = useWebSocketContext();

  if (!context.isAdmin) {
    console.warn("useAdminNotifications should only be used by admin users");
  }

  return {
    ...context,
    deleteNotification: context.isAdmin
      ? context.deleteNotification
      : async () => {
          console.error("Only admins can delete notifications");
          return false;
        },
    clearAll: context.isAdmin
      ? context.clearAll
      : async () => {
          console.error("Only admins can clear all notifications");
          return false;
        },
  };
};

export const useUserNotifications = () => {
  const context = useWebSocketContext();

  return {
    notifications: context.notifications,
    unreadCount: context.unreadCount,
    isLoading: context.isLoading,
    isRefreshing: context.isRefreshing,
    error: context.error,
    isConnected: context.isConnected,

    fetchNotifications: context.fetchNotifications,
    markAsRead: context.markAsRead,
    markAllAsRead: context.markAllAsRead,
    refreshNotifications: context.refreshNotifications,

    getUnreadNotifications: context.getUnreadNotifications,
    getSortedNotifications: context.getSortedNotifications,
    clearError: context.clearError,
  };
};
