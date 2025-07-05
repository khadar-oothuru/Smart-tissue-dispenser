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
import {
  getDeviceStatusConfig,
  getBatteryAlertConfig,
} from "../../utils/deviceStatusConfig";

export default function BatteryDeviceCard({ device, index = 0 }) {
  const { themeColors, isDark } = useThemeContext();
  const router = useRouter();
  const styles = getStyles(themeColors, isDark);

  // Navigation handler
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

  // Get battery-specific device status using the new utility function
  // Compose an array of statuses for combo logic (e.g., critical + power_off)
  const batteryStatusList = [];
  // Power off always takes priority if present
  if (
    device.power_off_count > 0 ||
    device.power_status === null ||
    device.power_status === undefined ||
    ["off", "no", "none", "", "0", "false"].includes(
      String(device.power_status).trim().toLowerCase()
    )
  ) {
    batteryStatusList.push("power_off");
  }
  // Battery percentage takes precedence over flags - Updated: 0% = battery off, 1-10% = critical, 11-20% = low
  if (
    device.battery_percentage !== null &&
    device.battery_percentage !== undefined
  ) {
    if (device.battery_percentage === 0) {
      batteryStatusList.push("battery_off");
    } else if (
      device.battery_percentage > 0 &&
      device.battery_percentage <= 10
    ) {
      batteryStatusList.push("battery_critical");
    } else if (
      device.battery_percentage > 10 &&
      device.battery_percentage <= 20
    ) {
      batteryStatusList.push("battery_low");
    }
  } else if (
    device.battery_critical === 1 ||
    device.battery_critical_count > 0
  ) {
    batteryStatusList.push("battery_critical");
  } else if (device.battery_low === 1 || device.battery_low_count > 0) {
    batteryStatusList.push("battery_low");
  }
  // Fallback to inactive if not active
  if (!device.is_active) {
    batteryStatusList.push("inactive");
  }
  // Fallback to normal if active and no other status
  if (batteryStatusList.length === 0 && device.is_active === true) {
    batteryStatusList.push("normal");
  }
  // If still empty, use unknown
  if (batteryStatusList.length === 0) {
    batteryStatusList.push("unknown");
  }
  // Use the updated getDeviceStatusConfig with array support
  const batteryConfig = getDeviceStatusConfig(
    batteryStatusList,
    device.is_active,
    isDark
  );

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
        "Battery Device Details",
        `Device: ${
          device.device_name || device.name || `Device ${device.device_id}`
        }\nBattery: ${device.battery_percentage || "N/A"}%\nStatus: ${
          device.current_status || "Unknown"
        }\nRoom: ${device.room_number || device.room || "Unknown"}\nFloor: ${
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
              borderColor: batteryConfig.color + "30",
              borderLeftWidth: 4,
              borderLeftColor: batteryConfig.color,
            },
          ]}
        >
          {/* Status Gradient Bar */}
          <LinearGradient
            colors={batteryConfig.gradient}
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
                      ? batteryConfig.bgDark
                      : batteryConfig.bgLight,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={batteryConfig.icon}
                  size={24}
                  color={batteryConfig.color}
                />
              </View>

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

            {/* Battery Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark
                    ? batteryConfig.bgDark
                    : batteryConfig.bgLight,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={batteryConfig.icon}
                size={16}
                color={batteryConfig.color}
              />
              <Text style={[styles.statusText, { color: batteryConfig.color }]}>
                {batteryConfig.text}
              </Text>
            </View>
          </View>

          {/* Battery Level Display */}
          <View
            style={[
              styles.batteryContainer,
              {
                backgroundColor: isDark
                  ? batteryConfig.color + "15"
                  : batteryConfig.color + "08",
                borderColor: isDark
                  ? batteryConfig.color + "25"
                  : batteryConfig.color + "20",
              },
            ]}
          >
            <View style={styles.batteryInfo}>
              <MaterialCommunityIcons
                name={batteryConfig.icon}
                size={20}
                color={batteryConfig.color}
              />
              <Text
                style={[styles.batteryLevel, { color: batteryConfig.color }]}
              >
                {device.battery_percentage !== null
                  ? `${device.battery_percentage}%`
                  : "N/A"}
              </Text>
            </View>
            {device.battery_percentage !== null && (
              <View style={styles.batteryProgress}>
                <View
                  style={[
                    styles.batteryFill,
                    {
                      width: `${Math.min(100, device.battery_percentage)}%`,
                      backgroundColor: batteryConfig.color,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Enhanced Real-time Activity Indicator */}
          {showActivityIndicator && (
            <View
              style={[
                styles.activityIndicator,
                {
                  backgroundColor: isDark
                    ? batteryConfig.color + "25"
                    : batteryConfig.color + "15",
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.activityDot,
                  {
                    backgroundColor: batteryConfig.color,
                  },
                ]}
              />
              <Text
                style={[
                  styles.activityText,
                  {
                    color: isDark ? "#FFFFFF" : batteryConfig.color,
                    fontWeight: "600",
                  },
                ]}
              >
                {batteryConfig.text === "Power Off"
                  ? "Power Off • "
                  : batteryConfig.text === "Critical Battery"
                  ? "Critical Battery • "
                  : batteryConfig.text === "Low Battery"
                  ? "Low Battery • "
                  : "Live • "}
                Updated {device.minutes_since_update || 0}m ago
              </Text>
              <View style={styles.signalStrength}>
                <MaterialCommunityIcons
                  name={batteryConfig.text === "Power Off" ? "power" : "signal"}
                  size={12}
                  color={isDark ? "#FFFFFF" : batteryConfig.color}
                />
              </View>
            </View>
          )}

          {/* Battery Alert Counts (using config) */}
          {(device.battery_low_count > 0 || device.power_off_count > 0) && (
            <View
              style={[
                styles.alertContainer,
                {
                  backgroundColor: isDark
                    ? batteryConfig.color + "20"
                    : batteryConfig.color + "12",
                  borderColor: isDark
                    ? batteryConfig.color + "30"
                    : batteryConfig.color + "20",
                },
              ]}
            >
              <View style={styles.alertStats}>
                {/* Battery Low Alert */}
                {device.battery_low_count > 0 &&
                  (() => {
                    const alertCfg = getBatteryAlertConfig("low", isDark);
                    return (
                      <View style={styles.alertItem}>
                        <MaterialCommunityIcons
                          name={alertCfg.icon}
                          size={14}
                          color={alertCfg.color}
                        />
                        <Text style={styles.alertText}>
                          {device.battery_low_count} {alertCfg.label}
                        </Text>
                      </View>
                    );
                  })()}
                {/* Power Off Alert */}
                {device.power_off_count > 0 &&
                  (() => {
                    const alertCfg = getBatteryAlertConfig("power_off", isDark);
                    return (
                      <View style={styles.alertItem}>
                        <MaterialCommunityIcons
                          name={alertCfg.icon}
                          size={14}
                          color={alertCfg.color}
                        />
                        <Text style={styles.alertText}>
                          {device.power_off_count} {alertCfg.label}
                        </Text>
                      </View>
                    );
                  })()}
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
                    ? batteryConfig.color + "20"
                    : batteryConfig.color + "12",
                  borderColor: isDark
                    ? batteryConfig.color + "30"
                    : batteryConfig.color + "20",
                },
              ]}
            >
              <View
                style={[
                  styles.alertIcon,
                  {
                    backgroundColor: isDark
                      ? batteryConfig.color + "25"
                      : batteryConfig.color + "15",
                    borderColor: isDark
                      ? batteryConfig.color + "35"
                      : batteryConfig.color + "25",
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
                  Last update
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
                    { color: isDark ? "#FFFFFF" : batteryConfig.color },
                  ]}
                >
                  View Details
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? "#FFFFFF" : batteryConfig.color}
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
    batteryContainer: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    batteryInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    batteryLevel: {
      fontSize: 16,
      fontWeight: "700",
      marginLeft: 8,
    },
    batteryProgress: {
      height: 6,
      backgroundColor: isDark ? colors.surface : "#E5E7EB",
      borderRadius: 3,
      overflow: "hidden",
    },
    batteryFill: {
      height: "100%",
      borderRadius: 3,
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
    activityText: {
      fontSize: 12,
      fontWeight: "600",
      flex: 1,
    },
    signalStrength: {
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    alertContainer: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    alertStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    alertItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    alertText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
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
    lastAlertTime: {
      fontSize: 14,
      color: colors.heading,
      fontWeight: "500",
    },
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
