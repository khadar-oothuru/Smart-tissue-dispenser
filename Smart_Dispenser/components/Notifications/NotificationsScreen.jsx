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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";
import { formatDistanceToNow } from "date-fns";
import LoadingScreen from "../common/LoadingScreen";
import { useAdminNotifications } from "../../context/WebSocketContext";
import { CustomAlert, InfoAlert } from "../common/CustomAlert";
import { getDeviceStatusConfig } from "../../utils/deviceStatusConfig";

// Enhanced notification item component
const NotificationItem = React.memo(
  function NotificationItem({
    item,
    index,
    onMarkAsRead,
    onDelete,
    themeColors,
    isDark,
  }) {
    const itemSlideAnim = useRef(new Animated.Value(50)).current;
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      const animationDelay = index * 50;

      Animated.parallel([
        Animated.timing(itemSlideAnim, {
          toValue: 0,
          duration: 300,
          delay: animationDelay,
          useNativeDriver: true,
        }),
        Animated.timing(itemFadeAnim, {
          toValue: 1,
          duration: 300,
          delay: animationDelay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: animationDelay,
          useNativeDriver: true,
        }),
      ]).start();
    }, [index, itemSlideAnim, itemFadeAnim, scaleAnim]); // Fixed dependencies

    // Enhanced notification styling configuration using device status config
    const getNotificationConfig = useCallback(
      (type) => {
        let status = "unknown";

        if (type || item.type || item.notification_type) {
          status = (type || item.type || item.notification_type).toLowerCase();
        } else {
          const message = (item.message || "").toLowerCase();
          if (
            message.includes("tampering detected") ||
            message.includes("tamper") ||
            message.includes("security alert")
          ) {
            status = "tamper";
          } else if (
            message.includes("empty") ||
            message.includes("container is empty") ||
            message.includes("needs refill")
          ) {
            status = "empty";
          } else if (
            message.includes("low tissue detected") ||
            message.includes("low tissue") ||
            message.includes("low level") ||
            message.includes("refill soon")
          ) {
            status = "low";
          } else if (
            message.includes("full") ||
            message.includes("container is full")
          ) {
            status = "full";
          } else if (
            message.includes("success") ||
            message.includes("resolved") ||
            message.includes("normal") ||
            message.includes("active") ||
            message.includes("online")
          ) {
            status = "normal";
          } else if (
            message.includes("offline") ||
            message.includes("inactive") ||
            message.includes("disconnected")
          ) {
            status = "offline";
          }
        }

        const deviceConfig = getDeviceStatusConfig(status, null, isDark);

        return {
          icon: { name: deviceConfig.icon },
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
    // Fixed delete handler with proper item reference - Commented Out
    // const handleDeletePress = useCallback(() => {
    //   onDelete(item.id);
    // Prevent double-tap bug by disabling TouchableOpacity after first press until markAsRead completes
    const [isMarking, setIsMarking] = React.useState(false);

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
                zIndex: 1, // Lower z-index than unread indicator
              },
            ]}
          />
          {/* Unread indicator - moved outside TouchableOpacity */}
          {!item.is_read && (
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: notificationConfig.color,
                borderTopLeftRadius: 16,
                borderBottomLeftRadius: 16,
                zIndex: 10,
              }}
            />
          )}
          <TouchableOpacity
            style={[
              styles.notificationItem,
              {
                opacity: item.is_read ? 0.8 : 1, // Slightly dim read notifications
              },
            ]}
            onPress={handlePress}
            activeOpacity={item.is_read ? 0.8 : 0.7}
            disabled={item.is_read || isMarking}
          >
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
              <MaterialCommunityIcons
                name={notificationConfig.icon.name}
                size={24}
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

              {/* Message section removed */}

              {/* Enhanced Device Information Section */}
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
            </View>

            {/* Action Buttons Section - Delete and Read Status */}
            <View style={styles.actionButtonsSection}>
              {/* Read Status Indicator */}
              {item.is_read && (
                <View
                  style={[
                    styles.readIndicator,
                    {
                      backgroundColor: isDark
                        ? `${themeColors.success}15`
                        : `${themeColors.success}10`,
                      borderWidth: 1,
                      borderColor: isDark
                        ? `${themeColors.success}30`
                        : `${themeColors.success}20`,
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

              {/* Fixed Delete Button - Commented Out */}
              {/* <TouchableOpacity
                onPress={handleDeletePress}
                style={[
                  styles.deleteButton,
                  {
                    backgroundColor: isDark
                      ? `${themeColors.danger}20`
                      : `${themeColors.danger}10`,
                    borderColor: themeColors.danger,
                    borderWidth: 1,
                  },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={themeColors.danger}
                />
              </TouchableOpacity> */}
            </View>
          </TouchableOpacity>
          {/* Enhanced Timestamp Section - Bottom Right */}
          <View style={styles.timestampSection}>
            <View
              style={[
                styles.timestampContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.08)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.15)",
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={11}
                color={isDark ? "#B0B0B0" : "#555555"}
              />
              <Text
                style={[
                  styles.timestamp,
                  {
                    color: isDark ? "#B0B0B0" : "#555555",
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
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to ensure re-render when needed
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
  const router = useRouter();
  const { themeColors, isDark } = useThemeContext(); // Use admin notifications hook from WebSocketContext
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    // deleteNotification, // commented out delete functionality
    // clearAll, // commented out clear all functionality
  } = useAdminNotifications();
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [hasLoaded, setHasLoaded] = useState(false); // State for custom modals
  // const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  // const [showClearAllAlert, setShowClearAllAlert] = useState(false);
  const [showMarkAllAlert, setShowMarkAllAlert] = useState(false);
  const [showInfoAlert, setShowInfoAlert] = useState(false);
  // const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");
  // Get sorted notifications - directly access notifications array and sort them
  const sortedNotifications = React.useMemo(() => {
    return [...notifications].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifications]);
  // Load notifications only once on mount
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
  }, [fetchNotifications, hasLoaded]); // Fixed dependencies
  // Entrance animation - only run once
  useEffect(() => {
    if (hasLoaded) {
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
    }
  }, [hasLoaded, fadeAnim, slideAnim]); // Fixed dependencies

  const onRefresh = useCallback(async () => {
    try {
      await fetchNotifications({ isRefresh: true });
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  }, [fetchNotifications]);
  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      // Find the notification to check if it's already read
      const notification = sortedNotifications.find(
        (n) => n.id === notificationId
      );
      if (notification && notification.is_read) {
        // Already read, don't do anything
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

  // const handleDelete = useCallback((notificationId) => {
  //   setSelectedNotificationId(notificationId);
  //   setShowDeleteAlert(true);
  // }, []);
  // const confirmDelete = useCallback(async () => {
  //   if (selectedNotificationId) {
  //     try {
  //       await deleteNotification(selectedNotificationId);
  //       console.log(
  //         "Notification deleted successfully:",
  //         selectedNotificationId
  //       );
  //     } catch (error) {
  //       console.error("Error deleting notification:", error);
  //     }
  //   }
  //   setShowDeleteAlert(false);
  //   setSelectedNotificationId(null);
  // }, [selectedNotificationId, deleteNotification]);
  // const handleClearAll = useCallback(() => {
  //   if (sortedNotifications.length === 0) return;
  //   setShowClearAllAlert(true);
  // }, [sortedNotifications.length]);
  // const confirmClearAll = useCallback(async () => {
  //   try {
  //     await clearAll();
  //   } catch (error) {
  //     console.error("Error clearing all notifications:", error);
  //   }
  //   setShowClearAllAlert(false);
  // }, [clearAll]);

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
  const renderNotification = useCallback(
    ({ item, index }) => (
      <NotificationItem
        item={item}
        index={index}
        onMarkAsRead={handleMarkAsRead}
        onDelete={undefined} // handleDelete - commented out
        themeColors={themeColors}
        isDark={isDark}
      />
    ),
    [handleMarkAsRead, themeColors, isDark] // removed handleDelete
  );
  const keyExtractor = useCallback(
    (item) => `notification-${item.id}-${item.is_read ? "read" : "unread"}`,
    []
  );

  // Show loading only if we haven't loaded yet
  if (isLoading && !hasLoaded) {
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

  const unreadNotifications = sortedNotifications.filter((n) => !n.is_read);

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Modern Header with Gradient */}
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
                  ? `${themeColors.primary}30`
                  : `${themeColors.primary}15`,
                borderColor: isDark
                  ? `${themeColors.primary}50`
                  : "transparent",
                borderWidth: isDark ? 1 : 0,
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
          {/* Keep header icons */}
          {sortedNotifications.length > 0 && (
            <View style={styles.headerActions}>
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

              {/* Clear All Button - Commented Out */}
              {/* <TouchableOpacity
                onPress={handleClearAll}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: isDark
                      ? `${themeColors.danger}20`
                      : `${themeColors.danger}15`,
                    borderColor: isDark ? themeColors.danger : "transparent",
                    borderWidth: isDark ? 1 : 0,
                  },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="notification-clear-all"
                  size={20}
                  color={themeColors.danger}
                />
              </TouchableOpacity> */}
            </View>
          )}
        </View>

        {/* Separator Line */}
        <View
          style={[
            styles.headerSeparator,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          ]}
        />
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
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          data={sortedNotifications}
          renderItem={renderNotification}
          keyExtractor={keyExtractor}
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
          removeClippedSubviews={false} // Disable to ensure proper updates
          maxToRenderPerBatch={15}
          windowSize={15}
          initialNumToRender={10}
          getItemLayout={null} // Allow dynamic sizing
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
      {/* Custom Alert Modals */}
      {/* <CustomAlert
        visible={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        type="error"
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        primaryAction={{
          text: "Delete",
          onPress: confirmDelete,
        }}
        secondaryAction={{
          text: "Cancel",
          onPress: () => setShowDeleteAlert(false),
        }}
        themeColors={themeColors}
        isDark={isDark}      /> */}
      {/* <CustomAlert
        visible={showClearAllAlert}
        onClose={() => setShowClearAllAlert(false)}
        type="error"
        title="Clear All Notifications"
        message={`Are you sure you want to clear all ${sortedNotifications.length} notifications? This action cannot be undone.`}
        primaryAction={{
          text: "Clear All",
          onPress: confirmClearAll,
        }}
        secondaryAction={{
          text: "Cancel",
          onPress: () => setShowClearAllAlert(false),
        }}
        themeColors={themeColors}
        isDark={isDark}
      /> */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 44,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerSeparator: {
    height: 1,
    width: "100%",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  unreadCount: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    minWidth: 28,
    alignItems: "center",
  },
  unreadCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 32,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  // Enhanced notification styling
  statusGradientBar: {
    height: 5,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  notificationWrapper: {
    marginVertical: 6,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    paddingBottom: 32,
    position: "relative", // Add position relative for proper absolute positioning
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    paddingBottom: 6,
    paddingLeft: 16, // Add left padding to accommodate the unread indicator
    minHeight: 60,
    position: "relative",
  },
  unreadIndicator: {
    // Base style - most properties will be overridden inline
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  // Removed notificationMessage style since we're not using it anymore
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
  // Enhanced device section
  deviceSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    opacity: 0.8,
    lineHeight: 14,
    fontWeight: "500",
    flex: 1,
  },
  // Action buttons section
  actionButtonsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginLeft: 8,
  }, // Enhanced timestamp section
  timestampSection: {
    position: "absolute",
    bottom: 8,
    right: 12,
    alignItems: "flex-end",
    zIndex: 3, // Higher than unread indicator
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  // Read status indicator
  readIndicator: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  listFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  listFooterText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
