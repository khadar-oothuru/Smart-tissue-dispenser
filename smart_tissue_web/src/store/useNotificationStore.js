// stores/notificationStore.js
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  fetchNotifications as apiFetchNotifications,
  markNotificationAsRead as apiMarkNotificationAsRead,
  deleteNotification as apiDeleteNotification,
  clearAllNotifications as apiClearAllNotifications,
  fetchUnreadNotificationCount as apiFetchUnreadCount,
} from "../services/api"

const useNotificationStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastFetchTime: null,
        
        // WebSocket state
        isConnected: false,
        reconnectAttempts: 0,
        ws: null,
        
        // Actions
        setNotifications: (notifications) =>
          set((state) => {
            state.notifications = notifications;
            state.unreadCount = notifications.filter(n => !n.is_read).length;
            state.lastFetchTime = Date.now();
          }),

        addNotification: (notification) =>
          set((state) => {
            // Avoid duplicates
            const exists = state.notifications.some(n => n.id === notification.id);
            if (!exists) {
              state.notifications.unshift(notification);
              if (!notification.is_read) {
                state.unreadCount += 1;
              }
            }
          }),

        updateNotification: (notificationId, updates) =>
          set((state) => {
            const index = state.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
              const wasUnread = !state.notifications[index].is_read;
              state.notifications[index] = { ...state.notifications[index], ...updates };
              
              // Update unread count if read status changed
              if (wasUnread && updates.is_read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              } else if (!wasUnread && updates.is_read === false) {
                state.unreadCount += 1;
              }
            }
          }),

        removeNotification: (notificationId) =>
          set((state) => {
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification) {
              state.notifications = state.notifications.filter(n => n.id !== notificationId);
              if (!notification.is_read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
            }
          }),

        setUnreadCount: (count) =>
          set((state) => {
            state.unreadCount = count;
          }),

        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }),

        setRefreshing: (isRefreshing) =>
          set((state) => {
            state.isRefreshing = isRefreshing;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        setConnectionStatus: (isConnected) =>
          set((state) => {
            state.isConnected = isConnected;
            if (isConnected) {
              state.reconnectAttempts = 0;
            }
          }),

        incrementReconnectAttempts: () =>
          set((state) => {
            state.reconnectAttempts += 1;
          }),

        resetReconnectAttempts: () =>
          set((state) => {
            state.reconnectAttempts = 0;
          }),

        setWebSocket: (ws) =>
          set((state) => {
            state.ws = ws;
          }),

        // Async actions
        fetchNotifications: async (accessToken, options = {}) => {
          const { showLoading = true, isRefresh = false } = options;
          
          if (!accessToken) {
            console.warn('No auth token provided for fetching notifications');
            return { success: false, error: 'No auth token' };
          }

          try {
            if (showLoading && !isRefresh) {
              set((state) => { state.isLoading = true; });
            } else if (isRefresh) {
              set((state) => { state.isRefreshing = true; });
            }
            
            set((state) => { state.error = null; });

            const data = await apiFetchNotifications(accessToken);
            
            get().setNotifications(data);
            
            return { success: true, data };
          } catch (error) {
            console.error('Error fetching notifications:', error);
            set((state) => { 
              state.error = error.message || 'Failed to fetch notifications';
            });
            return { success: false, error: error.message };
          } finally {
            set((state) => { 
              state.isLoading = false;
              state.isRefreshing = false;
            });
          }
        },

        fetchUnreadCount: async (accessToken) => {
          if (!accessToken) return;
          
          try {
            const data = await apiFetchUnreadCount(accessToken);
            set((state) => {
              state.unreadCount = data.count || 0;
            });
          } catch (error) {
            console.error('Error fetching unread count:', error);
          }
        },

        markAsRead: async (accessToken, notificationId) => {
          if (!accessToken) {
            console.warn('No auth token provided for marking notification as read');
            return false;
          }

          // Check if already read
          const notification = get().notifications.find(n => n.id === notificationId);
          if (!notification || notification.is_read) return true;

          // Optimistic update
          get().updateNotification(notificationId, { is_read: true });

          try {
            await apiMarkNotificationAsRead(accessToken, notificationId);
            return true;
          } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert optimistic update
            get().updateNotification(notificationId, { is_read: false });
            return false;
          }
        },

        markAllAsRead: async (accessToken) => {
          if (!accessToken) return false;

          const unreadNotifications = get().notifications.filter(n => !n.is_read);
          if (unreadNotifications.length === 0) return true;

          // Optimistic update
          set((state) => {
            state.notifications.forEach(n => {
              if (!n.is_read) n.is_read = true;
            });
            state.unreadCount = 0;
          });

          try {
            // Call API for each unread notification
            await Promise.all(
              unreadNotifications.map(n => 
                apiMarkNotificationAsRead(accessToken, n.id).catch(e => {
                  console.error(`Failed to mark notification ${n.id} as read:`, e);
                })
              )
            );
            return true;
          } catch (error) {
            console.error('Error marking all as read:', error);
            // Revert on failure
            await get().fetchNotifications(accessToken, { showLoading: false });
            return false;
          }
        },

        deleteNotification: async (accessToken, notificationId) => {
          if (!accessToken) {
            console.warn('No auth token provided for deleting notification');
            return false;
          }

          // Store notification for potential rollback
          const notification = get().notifications.find(n => n.id === notificationId);
          if (!notification) return false;
          const notificationIndex = get().notifications.findIndex(n => n.id === notificationId);

          // Optimistic update
          get().removeNotification(notificationId);

          try {
            const success = await apiDeleteNotification(accessToken, notificationId);
            if (success) {
              return true;
            } else {
              // Rollback on API failure
              set((state) => {
                state.notifications.splice(notificationIndex, 0, notification);
                if (!notification.is_read) {
                  state.unreadCount += 1;
                }
              });
              return false;
            }
          } catch (error) {
            console.error('Error deleting notification:', error);
            // Rollback
            set((state) => {
              state.notifications.splice(notificationIndex, 0, notification);
              if (!notification.is_read) {
                state.unreadCount += 1;
              }
            });
            return false;
          }
        },

        clearAll: async (accessToken) => {
          if (!accessToken) {
            console.warn('No auth token provided for clearing notifications');
            return false;
          }

          // Store current state for rollback
          const currentNotifications = [...get().notifications];
          const currentUnreadCount = get().unreadCount;

          // Optimistic update
          set((state) => {
            state.notifications = [];
            state.unreadCount = 0;
          });

          try {
            await apiClearAllNotifications(accessToken);
            return true;
          } catch (error) {
            console.error('Error clearing all notifications:', error);
            // Rollback
            set((state) => {
              state.notifications = currentNotifications;
              state.unreadCount = currentUnreadCount;
            });
            return false;
          }
        },

        // Utility functions
        getNotificationById: (notificationId) => {
          return get().notifications.find(n => n.id === notificationId);
        },

        getUnreadNotifications: () => {
          return get().notifications.filter(n => !n.is_read);
        },

        getNotificationsByType: (type) => {
          return get().notifications.filter(n => n.type === type);
        },

        getNotificationsByDevice: (deviceId) => {
          return get().notifications.filter(n => n.device?.id === deviceId);
        },

        getSortedNotifications: () => {
          return [...get().notifications].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        },

        clearError: () =>
          set((state) => {
            state.error = null;
          }),

        reset: () =>
          set((state) => {
            state.notifications = [];
            state.unreadCount = 0;
            state.isLoading = false;
            state.isRefreshing = false;
            state.error = null;
            state.lastFetchTime = null;
            state.isConnected = false;
            state.reconnectAttempts = 0;
            if (state.ws) {
              state.ws.close();
              state.ws = null;
            }
          }),
      })),
      {
        name: 'notification-storage',
        // Use localStorage for web
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
          lastFetchTime: state.lastFetchTime,
        }),
      }
    ),
    {
      name: 'notification-store',
    }
  )
);

export default useNotificationStore;