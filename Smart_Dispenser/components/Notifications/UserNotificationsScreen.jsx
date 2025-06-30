import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";
import { formatDistanceToNow } from "date-fns";
import LoadingScreen from "../common/LoadingScreen";
import { useUserNotifications } from "../../context/WebSocketContext";
import { CustomAlert } from "../common/CustomAlert";
import { getDeviceStatusConfig } from "../../utils/deviceStatusConfig";

// Enhanced Notification Item Component with improved styling
const UserNotificationItem = ({
  item,
  index,
  onMarkAsRead,
  themeColors,
  isDark,
}) => {
  const itemSlideAnim = useRef(new Animated.Value(50)).current;
  const itemFadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(itemSlideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(itemFadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, itemSlideAnim, itemFadeAnim, scaleAnim]);
  // Enhanced notification styling configuration using device status colors
  const getNotificationConfig = (type) => {
    let notificationType = "normal"; // default

    if (type || item.type || item.notification_type) {
      notificationType = (
        type ||
        item.type ||
        item.notification_type
      ).toLowerCase();
    } else {
      const message = (item.message || "").toLowerCase();
      if (
        message.includes("tampering detected") ||
        message.includes("tamper") ||
        message.includes("security alert")
      ) {
        notificationType = "tamper";
      } else if (
        message.includes("empty") ||
        message.includes("container is empty") ||
        message.includes("needs refill")
      ) {
        notificationType = "empty";
      } else if (
        message.includes("low tissue detected") ||
        message.includes("low tissue") ||
        message.includes("low level") ||
        message.includes("refill soon")
      ) {
        notificationType = "low";
      } else if (
        message.includes("full") ||
        message.includes("container is full")
      ) {
        notificationType = "full";
      } else if (
        message.includes("success") ||
        message.includes("resolved") ||
        message.includes("normal") ||
        message.includes("active") ||
        message.includes("online")
      ) {
        notificationType = "active";
      } else if (
        message.includes("offline") ||
        message.includes("inactive") ||
        message.includes("disconnected")
      ) {
        notificationType = "offline";
      }
    }

    // Map notification types to appropriate Ionicons
    const getIconForType = (type) => {
      switch (type) {
        case "tamper":
          return "shield-checkmark";
        case "empty":
          return "close-circle";
        case "low":
          return "archive-outline";
        case "full":
          return "archive";
        case "active":
        case "normal":
          return "checkmark-circle";
        case "offline":
        case "inactive":
          return "wifi-off";
        default:
          return "information-circle";
      }
    };

    // Get the device status configuration for consistent colors
    const statusConfig = getDeviceStatusConfig(notificationType, null, isDark);

    // Create appropriate badge text for notifications
    const getBadgeText = (type) => {
      switch (type) {
        case "tamper":
          return "TAMPER";
        case "empty":
          return "EMPTY";
        case "low":
          return "LOW";
        case "full":
          return "FULL";
        case "active":
        case "normal":
          return "ACTIVE";
        case "offline":
        case "inactive":
          return "OFFLINE";
        default:
          return "INFO";
      }
    };

    return {
      icon: { name: getIconForType(notificationType) },
      color: statusConfig.color,
      bgLight: statusConfig.bgLight,
      bgDark: statusConfig.bgDark,
      borderColor: statusConfig.color,
      gradient: statusConfig.gradient,
      priority: statusConfig.priority,
      badge: getBadgeText(notificationType),
      shadowColor: statusConfig.shadowColor,
    };
  };

  const notificationConfig = getNotificationConfig(
    item.type || item.notification_type
  );

  // Prevent double-tap bug by disabling TouchableOpacity after first press until markAsRead completes
  const [isMarking, setIsMarking] = useState(false);

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
    <Animated.View
      style={{
        transform: [{ translateX: itemSlideAnim }, { scale: scaleAnim }],
        opacity: itemFadeAnim,
      }}
    >
      <View
        style={[
          styles.notificationWrapper,
          {
            backgroundColor: isDark
              ? item.is_read
                ? "#1E1E1E"
                : notificationConfig.bgDark
              : item.is_read
              ? "#FFFFFF"
              : notificationConfig.bgLight,
            borderColor: item.is_read
              ? isDark
                ? "#2A2A2A"
                : "#F0F0F0"
              : notificationConfig.borderColor,
            borderWidth: isDark ? 2 : 1.5,
            shadowColor: isDark ? "#000000" : notificationConfig.shadowColor,
            shadowOpacity: item.is_read
              ? isDark
                ? 0.3
                : 0.08
              : isDark
              ? 0.5
              : 0.15,
            shadowOffset: {
              width: 0,
              height: isDark ? 8 : item.is_read ? 3 : 6,
            },
            shadowRadius: isDark ? 16 : item.is_read ? 6 : 12,
            elevation: item.is_read ? 3 : isDark ? 10 : 6,
          },
        ]}
      >
        {/* Status gradient bar at top */}
        <LinearGradient
          colors={notificationConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.statusGradientBar,
            {
              opacity: item.is_read ? 0.6 : 1,
              height: isDark ? 5 : 4,
            },
          ]}
        />

        <TouchableOpacity
          style={styles.notificationItem}
          onPress={handlePress}
          activeOpacity={item.is_read ? 1 : 0.7}
          disabled={item.is_read || isMarking}
        >
          {!item.is_read && (
            <View
              style={[
                styles.unreadIndicator,
                { backgroundColor: notificationConfig.color },
              ]}
            />
          )}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark
                  ? `${notificationConfig.color}20`
                  : `${notificationConfig.color}12`,
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark
                  ? `${notificationConfig.color}30`
                  : "transparent",
                shadowColor: isDark ? "#000000" : notificationConfig.color,
                shadowOffset: { width: 0, height: isDark ? 2 : 1 },
                shadowOpacity: isDark ? 0.25 : 0.1,
                shadowRadius: isDark ? 4 : 2,
                elevation: isDark ? 3 : 2,
              },
            ]}
          >
            <Ionicons
              name={notificationConfig.icon.name}
              size={20}
              color={notificationConfig.color}
            />
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  { color: isDark ? "#FFFFFF" : themeColors.heading },
                ]}
                numberOfLines={2}
              >
                {item.title || "Device Alert"}
              </Text>
              {!item.is_read && (
                <View
                  style={[
                    styles.unreadBadge,
                    {
                      backgroundColor: notificationConfig.color,
                      borderWidth: isDark ? 1 : 0,
                      borderColor: isDark
                        ? `${notificationConfig.color}60`
                        : "transparent",
                    },
                  ]}
                >
                  <Text style={styles.unreadBadgeText}>
                    {notificationConfig.badge}
                  </Text>
                </View>
              )}
            </View>
            {/* Device Information Section - Compact */}
            {item.device && (
              <View
                style={[
                  styles.deviceSection,
                  {
                    borderTopColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.06)",
                  },
                ]}
              >
                <View style={styles.deviceInfo}>
                  <Text
                    style={[
                      styles.deviceName,
                      { color: isDark ? "#B0B0B0" : themeColors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {item.device.name ||
                      `Device ${item.device.device_id || item.device.id}`}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location"
                      size={12}
                      color={isDark ? "#66BB6A" : "#4CAF50"}
                    />
                    <Text
                      style={[
                        styles.locationText,
                        { color: isDark ? "#888888" : themeColors.text },
                      ]}
                      numberOfLines={1}
                    >
                      Room {item.device.room_number || "N/A"} • Floor
                      {item.device.floor_number || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            {/* Timestamp at bottom right */}
            <View style={styles.timestampSection}>
              <View
                style={[
                  styles.timestampContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={isDark ? "#B0B0B0" : "#666666"}
                />
                <Text
                  style={[
                    styles.timestamp,
                    {
                      color: isDark ? "#B0B0B0" : "#666666",
                    },
                  ]}
                >
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                  })}
                </Text>
              </View>
            </View>
          </View>
          {/* Read status indicator */}
          {item.is_read && (
            <View
              style={[
                styles.readIndicator,
                {
                  backgroundColor: isDark
                    ? `${themeColors.success}20`
                    : `${themeColors.success}15`,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark
                    ? `${themeColors.success}40`
                    : "transparent",
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={themeColors.success}
              />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function UserNotificationsScreen() {
  const router = useRouter();
  const { themeColors, isDark } = useThemeContext();

  // Custom Alert States
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  // Use user notifications hook from WebSocketContext
  const {
    unreadCount,
    isLoading,
    isRefreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getSortedNotifications,
    refreshNotifications,
  } = useUserNotifications();

  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get sorted notifications with enhanced priority logic
  const sortedNotifications = React.useMemo(() => {
    const rawNotifications = getSortedNotifications();

    return [...rawNotifications].sort((a, b) => {
      // First, sort by read status (unread first)
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1;
      }

      // Then sort by notification type priority
      const getTypePriority = (notification) => {
        const message = (notification.message || "").toLowerCase();
        const type = notification.type || notification.notification_type;
        if (type) {
          const typeStr = type.toLowerCase();
          switch (typeStr) {
            case "tamper":
              return 100;
            case "empty":
              return 90;
            case "low":
              return 80;
            case "full":
              return 70;
            case "success":
              return 50;
            case "offline":
              return 10;
            default:
              return 20;
          }
        }

        // Fallback to message-based detection
        if (
          message.includes("tampering detected") ||
          message.includes("tamper") ||
          message.includes("security alert")
        )
          return 90;
        if (
          message.includes("low tissue detected") ||
          message.includes("low tissue") ||
          message.includes("low level")
        )
          return 100;
        if (
          message.includes("empty") ||
          message.includes("container is empty") ||
          message.includes("needs refill")
        )
          return 90;
        if (
          message.includes("low tissue detected") ||
          message.includes("low tissue") ||
          message.includes("low level") ||
          message.includes("refill soon")
        )
          return 80;
        if (message.includes("full") || message.includes("container is full"))
          return 70;
        if (
          message.includes("success") ||
          message.includes("resolved") ||
          message.includes("normal") ||
          message.includes("active") ||
          message.includes("online")
        )
          return 50;
        if (
          message.includes("offline") ||
          message.includes("inactive") ||
          message.includes("disconnected")
        )
          return 10;
        return 20; // default info
      };

      const priorityA = getTypePriority(a);
      const priorityB = getTypePriority(b);

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }

      // Finally, sort by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [getSortedNotifications]);

  useEffect(() => {
    loadNotifications();

    // Entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loadNotifications, slideAnim, fadeAnim]);

  // Custom Alert Functions
  const showCustomAlert = (title, message, type = "info") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowInfoModal(true);
  };

  const showConfirmAlert = (title, message, onConfirm) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setConfirmAction(() => onConfirm);
    setShowConfirmModal(true);
  };

  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleConfirmAction = () => {
    setShowConfirmModal(false);
    if (confirmAction) {
      confirmAction();
    }
    setConfirmAction(null);
  };

  const loadNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    await refreshNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    const unreadNotifications = sortedNotifications.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) {
      showCustomAlert("Info", "All notifications are already read");
      return;
    }

    showConfirmAlert(
      "Mark All as Read",
      `Mark ${unreadNotifications.length} notifications as read?`,
      () => markAllAsRead()
    );
  };

  const renderNotification = ({ item, index }) => (
    <UserNotificationItem
      item={item}
      index={index}
      onMarkAsRead={handleMarkAsRead}
      themeColors={themeColors}
      isDark={isDark}
    />
  );

  if (isLoading) {
    return (
      <LoadingScreen
        message="Loading Notifications"
        submessage="Fetching your latest updates..."
        iconName="notifications"
        variant="fullscreen"
        customIcon={
          <Ionicons
            name="notifications"
            size={50}
            color={themeColors.primary}
          />
        }
      />
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Simple Header with gradient */}
      <LinearGradient
        colors={
          isDark
            ? [themeColors.surface, themeColors.background]
            : ["#ffffff", themeColors.background]
        }
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark
                  ? `${themeColors.primary}25`
                  : `${themeColors.primary}12`,
                borderWidth: 0,
                shadowOpacity: isDark ? 0.06 : 0,
                elevation: isDark ? 2 : 0,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.unreadCount,
                  { backgroundColor: themeColors.primary },
                ]}
              >
                <Text style={styles.unreadCountText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {sortedNotifications.length > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark
                    ? `${themeColors.primary}20`
                    : `${themeColors.primary}15`,
                  borderColor: isDark ? themeColors.primary : "transparent",
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="checkmark-done"
                size={20}
                color={themeColors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        {/* Status Bar - Only show when there are unread notifications */}
        {sortedNotifications.length > 0 && unreadCount > 0 && (
          <View
            style={[
              styles.statusBar,
              {
                borderTopColor: isDark ? `${themeColors.border}50` : "#e0e0e0",
                backgroundColor: isDark ? themeColors.surface : "#f5f5f5",
              },
            ]}
          >
            <View style={styles.statusInfo}>
              <Text style={[styles.statusText, { color: themeColors.text }]}>
                {`${unreadCount} unread ${
                  unreadCount === 1 ? "notification" : "notifications"
                }`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.markAllButton,
                {
                  backgroundColor: isDark
                    ? `${themeColors.primary}12`
                    : `${themeColors.primary}08`,
                  borderColor: isDark
                    ? `${themeColors.primary}40`
                    : `${themeColors.primary}30`,
                },
              ]}
              onPress={handleMarkAllAsRead}
            >
              <Ionicons
                name="checkmark-done"
                size={16}
                color={themeColors.primary}
              />
              <Text
                style={[styles.markAllText, { color: themeColors.primary }]}
              >
                Mark All Read
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
      {sortedNotifications.length === 0 ? (
        <Animated.View
          style={[
            styles.emptyContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.emptyIconContainer,
              {
                backgroundColor: isDark
                  ? `${themeColors.primary}20`
                  : `${themeColors.primary}10`,
                borderColor: isDark
                  ? `${themeColors.primary}40`
                  : "transparent",
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <Ionicons
              name="notifications-off-outline"
              size={80}
              color={themeColors.primary}
            />
          </View>
          <Text style={[styles.emptyText, { color: themeColors.heading }]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptySubtext, { color: themeColors.text }]}>
            You&apos;ll receive notifications about your devices here
          </Text>

          <TouchableOpacity
            style={[
              styles.refreshButton,
              { backgroundColor: themeColors.primary },
            ]}
            onPress={loadNotifications}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          data={sortedNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
              progressBackgroundColor={isDark ? themeColors.surface : "#ffffff"}
            />
          }
          ListHeaderComponent={
            unreadCount > 0 && (
              <View style={styles.listHeader}>
                <Text
                  style={[styles.listHeaderText, { color: themeColors.text }]}
                >
                  Tap on unread notifications to mark them as read
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <View style={styles.listFooter}>
              <Text
                style={[styles.listFooterText, { color: themeColors.text }]}
              >
                {sortedNotifications.length}
                {sortedNotifications.length === 1
                  ? "notification"
                  : "notifications"}
              </Text>
            </View>
          }
        />
      )}
      {/* Custom Alert Modal */}
      <CustomAlert
        visible={showInfoModal}
        onClose={handleCloseInfoModal}
        title={alertTitle}
        message={alertMessage}
        type="info"
        primaryAction={{
          text: "OK",
          onPress: () => {},
        }}
        themeColors={themeColors}
        isDark={isDark}
      />
      {/* Confirm Modal */}
      <CustomAlert
        visible={showConfirmModal}
        onClose={handleCloseConfirmModal}
        title={alertTitle}
        message={alertMessage}
        type="warning"
        primaryAction={{
          text: "Mark as Read",
          onPress: handleConfirmAction,
        }}
        secondaryAction={{
          text: "Cancel",
          onPress: () => {},
        }}
        themeColors={themeColors}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  unreadCount: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadCountText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 17,
    textAlign: "center",
    lineHeight: 26,
    opacity: 0.8,
    marginBottom: 40,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
  },
  statusGradientBar: {
    height: 5,
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  notificationWrapper: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    minHeight: 60,
  },
  unreadIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    paddingRight: 6,
    paddingBottom: 20,
    position: "relative",
    minHeight: 40,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    lineHeight: 20,
    marginRight: 10,
    letterSpacing: 0.1,
  },
  unreadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  deviceSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 16,
    fontWeight: "500",
    flex: 1,
  },
  timestampSection: {
    position: "absolute",
    bottom: 22,
    right: -55,
    alignItems: "flex-end",
    zIndex: 1,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  readIndicator: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  listFooter: {
    paddingVertical: 24,
    alignItems: "center",
  },
  listFooterText: {
    fontSize: 13,
    opacity: 0.6,
    fontWeight: "500",
  },
});
