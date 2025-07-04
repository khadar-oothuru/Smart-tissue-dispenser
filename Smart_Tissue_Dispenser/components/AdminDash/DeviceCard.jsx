import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { getDeviceStatusConfig } from "../../utils/deviceStatusConfig";

export default function DeviceCard({ device, index = 0, tissueOnly = false }) {
  const { themeColors, isDark } = useThemeContext();
  const router = useRouter();
  const styles = getStyles(themeColors, isDark); // Navigation handler
  const handleCardPress = () => {
    router.push({
      pathname: "/device-details",
      params: {
        deviceId: device.device_id || device.id,
        deviceName:
          device.device_name ||
          device.name ||
          `Device ${device.device_id || device.id}`,
        deviceStatus: device.current_status || "unknown",
        isActive: device.is_active?.toString() || "false",
        room: device.room_number || device.room || "Unknown",
        floor:
          device.floor_number !== undefined
            ? device.floor_number.toString()
            : device.floor || "N/A",
      },
    });
  };

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, scaleAnim]);

  // Get status configuration using utility function
  let statusConfig;
  if (tissueOnly) {
    // Only use tissue-related statuses for the badge and color
    const status = (device.current_status || "").toLowerCase();
    if (device.current_tamper === true) {
      statusConfig = getDeviceStatusConfig("tamper", device.is_active, isDark);
    } else if (status === "empty") {
      statusConfig = getDeviceStatusConfig("empty", device.is_active, isDark);
    } else if (status === "low") {
      statusConfig = getDeviceStatusConfig("low", device.is_active, isDark);
    } else if (status === "full") {
      statusConfig = getDeviceStatusConfig("full", device.is_active, isDark);
    } else if (["offline", "disconnected", "inactive"].includes(status)) {
      statusConfig = getDeviceStatusConfig("offline", device.is_active, isDark);
    } else if (["normal", "active", "online"].includes(status)) {
      statusConfig = getDeviceStatusConfig("active", device.is_active, isDark);
    } else {
      statusConfig = getDeviceStatusConfig("unknown", device.is_active, isDark);
    }
  } else {
    statusConfig = getDeviceStatusConfig(
      device.current_status,
      device.is_active,
      isDark
    );
  }
  // Navigation function for admin device details
  const handleViewDetails = () => {
    try {
      router.push({
        pathname: "/device-details",
        params: {
          deviceId: device.device_id,
          deviceName:
            device.device_name || device.name || `Device ${device.device_id}`,
          deviceStatus: device.current_status || "unknown",
          isActive: String(device.is_active),
          room: device.room_number || device.room || "Unknown",
          floor:
            device.floor_number !== undefined
              ? device.floor_number.toString()
              : device.floor || "N/A",
        },
      });
    } catch (_error) {
      // Fallback: show alert with device info
      Alert.alert(
        "Admin Device Details",
        `Device: ${
          device.device_name || device.name || `Device ${device.device_id}`
        }\nStatus: ${device.current_status || "Unknown"}\nRoom: ${
          device.room_number || device.room || "Unknown"
        }\nFloor: ${
          device.floor_number !== undefined
            ? device.floor_number
            : device.floor || "N/A"
        }`,
        [{ text: "OK" }]
      );
    }
  };

  const lastAlertTime = device.last_alert_time
    ? new Date(device.last_alert_time).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Show real-time activity indicator
  const showActivityIndicator =
    device.is_active &&
    device.minutes_since_update !== null &&
    device.minutes_since_update <= 5;
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.95} onPress={handleCardPress}>
        <View
          style={[
            styles.card,
            {
              borderColor: statusConfig.color + "30",
              borderLeftWidth: 4, // Add a colored left border for status indication
              borderLeftColor: statusConfig.color,
            },
          ]}
        >
          {/* Status Gradient Bar */}
          <LinearGradient
            colors={statusConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusGradientBar}
          />
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark
                      ? statusConfig.bgDark
                      : statusConfig.bgLight,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="router-wireless"
                  size={24}
                  color={statusConfig.color}
                />
                {/* Connection status dot */}
                {/* 
                <View
                  style={[
                    styles.connectionDot,
                    {
                      backgroundColor: getConnectionStatusColor(device.minutes_since_update) || statusConfig.color,
                      borderColor: isDark ? themeColors.surface : "#FFFFFF",
                    },
                  ]}
                />
                */}
              </View>

              {/* 
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceId}>Device {device.device_id}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color={themeColors.text} />
                  <Text style={styles.deviceLocation}>
                    {device.room || "Unknown Room"} • Floor {device.floor || "N/A"}
                  </Text>
                </View>
              </View>
              */}

              <View style={styles.deviceInfo}>
                <Text style={styles.deviceId}>
                  {device.device_name ||
                    device.name ||
                    `Device ${device.device_id}`}
                </Text>
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={themeColors.text}
                  />
                  <Text style={styles.deviceLocation}>
                    Room {device.room_number || device.room || "Unknown"} •
                    Floor
                    {device.floor_number !== undefined
                      ? device.floor_number
                      : device.floor || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark
                    ? statusConfig.bgDark
                    : statusConfig.bgLight,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={statusConfig.icon}
                size={16}
                color={statusConfig.color}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
          </View>
          {/* Enhanced Real-time Activity Indicator */}
          {showActivityIndicator && (
            <View
              style={[
                styles.activityIndicator,
                {
                  backgroundColor: isDark
                    ? statusConfig.color + "25"
                    : statusConfig.color + "15",
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.activityDot,
                  {
                    backgroundColor: statusConfig.color,
                  },
                ]}
              />
              <Text
                style={[
                  styles.activityText,
                  {
                    color: isDark ? "#FFFFFF" : statusConfig.color,
                    fontWeight: "600",
                  },
                ]}
              >
                {device.current_status === "tamper"
                  ? "Tamper Alert • "
                  : device.current_status === "empty"
                  ? "Empty Alert • "
                  : device.current_status === "low"
                  ? "Low Level Alert • "
                  : device.current_status === "full"
                  ? "Full Level • "
                  : "Live • "}
                Updated {device.minutes_since_update || 0}m ago
              </Text>
              <View style={styles.signalStrength}>
                <MaterialCommunityIcons
                  name={
                    ["tamper", "empty"].includes(device.current_status)
                      ? "alert"
                      : "signal"
                  }
                  size={12}
                  color={isDark ? "#FFFFFF" : statusConfig.color}
                />
              </View>
            </View>
          )}
          {/* Enhanced Last Activity Section */}
          {lastAlertTime && (
            <View
              style={[
                styles.lastAlertContainer,
                {
                  backgroundColor: isDark
                    ? statusConfig.color + "20"
                    : statusConfig.color + "12",
                  borderColor: isDark
                    ? statusConfig.color + "30"
                    : statusConfig.color + "20",
                },
              ]}
            >
              <View
                style={[
                  styles.alertIcon,
                  {
                    backgroundColor: isDark
                      ? statusConfig.color + "25"
                      : statusConfig.color + "15",
                    borderColor: isDark
                      ? statusConfig.color + "35"
                      : statusConfig.color + "25",
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={isDark ? "#B0B0B0" : themeColors.text}
                />
              </View>
              <View style={styles.alertInfo}>
                <Text
                  style={[
                    styles.lastAlertLabel,
                    { color: isDark ? "#888888" : themeColors.text },
                  ]}
                >
                  Last Update
                </Text>
                <Text
                  style={[
                    styles.lastAlertTime,
                    { color: isDark ? "#FFFFFF" : themeColors.heading },
                  ]}
                >
                  {lastAlertTime}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewAnalyticsButton}
                onPress={handleViewDetails}
              >
                <Text
                  style={[
                    styles.viewAnalyticsText,
                    { color: isDark ? "#FFFFFF" : statusConfig.color },
                  ]}
                >
                  View Details
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? "#FFFFFF" : statusConfig.color}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? colors.surface : "#FFFFFF",
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
    },
    statusGradientBar: {
      height: 4,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingBottom: 12,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      position: "relative",
    },
    connectionDot: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 2,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceId: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.heading,
      marginBottom: 4,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    deviceLocation: {
      fontSize: 13,
      color: colors.text,
      marginLeft: 4,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 4,
    },
    statusText: {
      fontSize: 13,
      fontWeight: "600",
    },
    activityIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 8,
    },
    activityDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 8,
    },
    pulsingDot: {
      // Add pulsing animation for live indicator
    },
    activityText: {
      fontSize: 12,
      fontWeight: "600",
      flex: 1,
    },
    recentActivityText: {
      fontSize: 11,
      fontWeight: "500",
      flex: 1,
    },
    signalStrength: {
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    currentStatusContainer: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: isDark ? colors.surface : colors.inputbg,
    },
    currentStatusLabel: {
      fontSize: 11,
      color: colors.text,
      opacity: 0.6,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    currentStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    currentStatusText: {
      fontSize: 14,
      fontWeight: "600",
    },
    tamperBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tamperText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    lastAlertContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? colors.inputbg : colors.inputbg,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.text + "10",
    },
    alertIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? colors.background : "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    alertInfo: {
      flex: 1,
    },
    lastAlertLabel: {
      fontSize: 11,
      color: colors.text,
      marginBottom: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    lastAlertTime: { fontSize: 14, color: colors.heading, fontWeight: "500" },
    viewAnalyticsButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    viewAnalyticsText: {
      fontSize: 13,
      fontWeight: "500",
    },
  });
