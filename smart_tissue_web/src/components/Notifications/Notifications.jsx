// NotificationsScreen.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Shield,
  Archive,
  Wrench,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Spinner from "../common/Spinner";
import { useAdminNotifications } from "../../context/WebSocketContext";
import { CustomAlert, InfoAlert } from "../common/CustomAlert";
import { getDeviceStatusConfig } from "../../utils/deviceStatusConfig";
import { useTheme } from "../../hooks/useThemeContext";

// Enhanced notification item component
const NotificationItem = React.memo(
  function NotificationItem({
    item,
    index,
    onMarkAsRead,
    // onDelete, // not used in web
    isDark,
    themeColors,
  }) {
    const [isAnimated, setIsAnimated] = useState(false);
    const [isMarking, setIsMarking] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, index * 50);
      return () => clearTimeout(timer);
    }, [index]);

    // Get icon component based on type
    const getIconComponent = (iconName) => {
      const iconMap = {
        "shield-alert-outline": Shield,
        "archive-cancel-outline": Archive,
        "archive-outline": Archive,
        archive: Archive,
        wrench: Wrench,
        bell: Bell,
      };
      return iconMap[iconName] || Bell;
    };

    // Enhanced notification styling configuration
    const getNotificationConfig = useCallback(
      (type) => {
        let status = "unknown";

        if (type || item.type || item.notification_type) {
          status = (type || item.type || item.notification_type).toLowerCase();
        } else {
          const message = (item.message || "").toLowerCase();
          if (
            message.includes("tamper") ||
            message.includes("security alert")
          ) {
            status = "tamper";
          } else if (
            message.includes("empty") ||
            message.includes("needs refill")
          ) {
            status = "empty";
          } else if (
            message.includes("low tissue") ||
            message.includes("low level")
          ) {
            status = "low";
          } else if (message.includes("full")) {
            status = "full";
          } else if (
            message.includes("success") ||
            message.includes("normal") ||
            message.includes("online")
          ) {
            status = "normal";
          } else if (
            message.includes("offline") ||
            message.includes("disconnected")
          ) {
            status = "offline";
          }
        }

        const deviceConfig = getDeviceStatusConfig(status, null, isDark);
        const IconComponent = getIconComponent(deviceConfig.icon);

        return {
          icon: IconComponent,
          color: deviceConfig.color,
          bgLight: deviceConfig.bgLight,
          bgDark: deviceConfig.bgDark,
          borderColor: deviceConfig.color,
          gradient: deviceConfig.gradient,
          priority: deviceConfig.priority,
          badge: deviceConfig.text.toUpperCase(),
          shadowColor: deviceConfig.shadowColor,
        };
      },
      [item.type, item.notification_type, item.message, isDark]
    );

    const notificationConfig = getNotificationConfig(
      item.type || item.notification_type
    );
    const IconComponent = notificationConfig.icon;

    const handlePress = async () => {
      if (!item.is_read && !isMarking) {
        setIsMarking(true);
        try {
          await onMarkAsRead(item.id);
        } finally {
          setIsMarking(false);
        }
      }
    };

    return (
      <div
        className={`transform transition-all duration-300 ${
          isAnimated
            ? "translate-x-0 scale-100 opacity-100"
            : "translate-x-12 scale-95 opacity-0"
        }`}
      >
        <div
          className={`relative rounded-2xl border-2 shadow-lg overflow-hidden transition-all cursor-pointer
            border-${
              item.is_read
                ? isDark
                  ? "gray-800"
                  : "gray-200"
                : notificationConfig.borderColor
            }
            ${item.is_read ? "opacity-80" : "opacity-100"}
            hover:shadow-xl hover:scale-[1.02]
          `}
          style={{
            backgroundColor: themeColors.surface,
            borderColor: item.is_read
              ? isDark
                ? "#1f2937" // gray-800
                : "#e5e7eb" // gray-200
              : notificationConfig.borderColor,
          }}
          onClick={handlePress}
        >
          {/* Status gradient bar */}
          <div
            className={`h-1 w-full ${
              item.is_read ? "opacity-60" : "opacity-100"
            }`}
            style={{
              background: `linear-gradient(to right, ${notificationConfig.gradient[0]}, ${notificationConfig.gradient[1]})`,
            }}
          />

          {/* Unread indicator */}
          {!item.is_read && (
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-10"
              style={{ backgroundColor: notificationConfig.color }}
            />
          )}

          <div className="p-4 pl-6">
            <div className="flex items-start">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mr-3 
                  ${isDark ? "shadow-md" : "shadow-sm"}`}
                style={{
                  backgroundColor: `${notificationConfig.color}20`,
                  borderColor: isDark
                    ? `${notificationConfig.color}30`
                    : "transparent",
                  borderWidth: isDark ? "1px" : "0",
                }}
              >
                <IconComponent size={24} color={notificationConfig.color} />
              </div>

              <div className="flex-1 mr-2">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-base text-white line-clamp-2">
                    {item.title || "Device Alert"}
                  </h3>
                  {!item.is_read && (
                    <span
                      className="px-2 py-1 text-xs font-bold text-white rounded-full ml-2"
                      style={{ backgroundColor: notificationConfig.color }}
                    >
                      {notificationConfig.badge}
                    </span>
                  )}
                </div>

                {/* Device Information */}
                {item.device && (
                  <div
                    className={`pt-2 mt-2 border-t ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {item.device.name ||
                        `Device ${item.device.device_id || item.device.id}`}
                    </p>
                    <div className="flex items-center mt-1">
                      <MapPin size={12} className="text-green-500 mr-1" />
                      <span className="text-xs text-white">
                        Room {item.device.room_number || "N/A"} • Floor{" "}
                        {item.device.floor_number || "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {item.is_read && (
                  <div
                    className={`p-2 rounded-lg ${
                      isDark ? "bg-green-900/30" : "bg-green-100"
                    } border ${
                      isDark ? "border-green-800" : "border-green-200"
                    }`}
                  >
                    <CheckCircle2 size={18} className="text-green-600" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="absolute bottom-2 right-3">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-400"
                  : "bg-gray-100 border-gray-200 text-gray-600"
              } border`}
            >
              <Clock size={11} />
              <span className="font-medium">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.is_read === nextProps.item.is_read &&
      prevProps.item.created_at === nextProps.item.created_at &&
      prevProps.isDark === nextProps.isDark &&
      prevProps.index === nextProps.index
    );
  }
);

export default function NotificationsScreen() {
  const { themeColors, isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useAdminNotifications();

  const [hasLoaded, setHasLoaded] = useState(false);
  const [showMarkAllAlert, setShowMarkAllAlert] = useState(false);
  const [showInfoAlert, setShowInfoAlert] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  // Get sorted notifications
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifications]);

  // Load notifications on mount
  useEffect(() => {
    let isMounted = true;

    const loadInitialNotifications = async () => {
      if (!hasLoaded && isMounted) {
        try {
          await fetchNotifications();
          setHasLoaded(true);
        } catch (error) {
          console.error("Error loading notifications:", error);
        }
      }
    };

    loadInitialNotifications();

    return () => {
      isMounted = false;
    };
  }, [fetchNotifications, hasLoaded]);

  const onRefresh = useCallback(async () => {
    try {
      await fetchNotifications({ isRefresh: true });
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      const notification = sortedNotifications.find(
        (n) => n.id === notificationId
      );
      if (notification && notification.is_read) {
        return;
      }

      try {
        await markAsRead(notificationId);
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    },
    [markAsRead, sortedNotifications]
  );

  const handleMarkAllAsRead = useCallback(() => {
    const unreadNotifications = sortedNotifications.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) {
      setInfoMessage("All notifications are already read");
      setShowInfoAlert(true);
      return;
    }
    setShowMarkAllAlert(true);
  }, [sortedNotifications]);

  const confirmMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
    setShowMarkAllAlert(false);
  }, [markAllAsRead]);

  if (isLoading && !hasLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <Spinner color={themeColors.primary} />
        <div
          className="mt-6 text-lg font-semibold"
          style={{ color: themeColors.primary }}
        >
          Loading Notifications
        </div>
        <div
          className="text-sm mt-1"
          style={{ color: themeColors.textSecondary }}
        >
          Fetching your latest updates...
        </div>
      </div>
    );
  }

  const unreadNotifications = sortedNotifications.filter((n) => !n.is_read);

  return (
    <div
      className="min-h-screen w-full flex flex-col relative bg-transparent"
      style={{
        background: themeColors.background,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        className="w-full flex flex-col items-start justify-start px-0 md:px-0"
        style={{ marginTop: 48, maxWidth: "100vw" }}
      >
        <div className="flex items-center justify-between w-full px-8 mb-6">
          <div className="flex items-center">
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: themeColors.primary, letterSpacing: 1 }}
            >
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {sortedNotifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-2 rounded-xl transition-colors border"
              style={{
                borderColor: themeColors.primary,
                background: themeColors.primary + "20",
              }}
              title="Mark all as read"
            >
              <CheckCircle2 size={22} style={{ color: themeColors.primary }} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="w-full flex-1 px-0 md:px-0 pb-8">
          {sortedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
              <div
                className={`w-36 h-36 flex items-center justify-center mb-6 ${
                  isDark
                    ? "bg-blue-900/20 border border-blue-800"
                    : "bg-blue-50"
                }`}
              >
                <BellOff size={80} className="text-blue-600" />
              </div>
              <h2
                className="text-2xl font-bold mb-3"
                style={{
                  color: themeColors.text || (isDark ? "#fff" : "#111"),
                }}
              >
                No notifications yet
              </h2>
              <p
                className="text-center mb-8"
                style={{
                  color:
                    themeColors.textSecondary || (isDark ? "#aaa" : "#444"),
                }}
              >
                You'll receive notifications about your devices here
              </p>
              <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={20} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 w-full px-0">
              {isRefreshing && (
                <div className="flex justify-center mb-4">
                  <RefreshCw className="animate-spin text-blue-600" size={24} />
                </div>
              )}
              {sortedNotifications.map((item, index) => (
                <NotificationItem
                  key={`notification-${item.id}-${
                    item.is_read ? "read" : "unread"
                  }`}
                  item={item}
                  index={index}
                  onMarkAsRead={handleMarkAsRead}
                  isDark={isDark}
                  themeColors={themeColors}
                />
              ))}
              <div className="text-center mt-8">
                <p
                  className="text-sm"
                  style={{
                    color:
                      themeColors.textSecondary || (isDark ? "#888" : "#444"),
                  }}
                >
                  {sortedNotifications.length}{" "}
                  {sortedNotifications.length === 1
                    ? "notification"
                    : "notifications"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CustomAlert
        visible={showMarkAllAlert}
        onClose={() => setShowMarkAllAlert(false)}
        type="info"
        title="Mark All as Read"
        message={`Mark ${unreadNotifications.length} notifications as read?`}
        primaryAction={{
          text: "Mark as Read",
          onPress: confirmMarkAllAsRead,
        }}
        secondaryAction={{
          text: "Cancel",
          onPress: () => setShowMarkAllAlert(false),
        }}
        themeColors={themeColors}
        isDark={isDark}
      />

      <InfoAlert
        visible={showInfoAlert}
        onClose={() => setShowInfoAlert(false)}
        title="Info"
        message={infoMessage}
        themeColors={themeColors}
        isDark={isDark}
      />
    </div>
  );
}
// ...removed duplicate/old JSX code after main export...
