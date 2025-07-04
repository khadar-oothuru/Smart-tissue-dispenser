import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
import { getDeviceStatusConfig } from "../../utils/deviceStatusConfig";

const DeviceStatsCard = ({ device, index, onPress }) => {
  const { themeColors, isDarkMode } = useThemeContext();

  const getAlertConfig = (count, type) => {
    if (type === "low") {
      const statusConfig = getDeviceStatusConfig("low", null, isDarkMode);
      if (count === 0)
        return {
          color: "#10B981",
          label: "Excellent",
          icon: "checkmark-circle-outline",
        };
      if (count < 5)
        return {
          color: statusConfig.color,
          label: "Good",
          icon: statusConfig.icon,
        };
      return {
        color: "#EF4444",
        label: "Needs Attention",
        icon: statusConfig.icon,
      };
    }
    if (type === "tamper") {
      const statusConfig = getDeviceStatusConfig("tamper", null, isDarkMode);
      return count > 0
        ? {
            color: statusConfig.color,
            label: "Alert",
            icon: statusConfig.icon || "shield-off-outline", // Fallback icon
          }
        : {
            color: "#10B981",
            label: "Secure",
            icon: "shield-checkmark-outline",
          };
    }
    return {
      color: themeColors.primary,
      label: "",
      icon: "help-circle-outline",
    };
  };
  const getRankStyle = () => {
    if (index === 0) return { bg: "#FFD700", color: "#000" }; // Gold
    if (index === 1) return { bg: "#C0C0C0", color: "#000" }; // Silver
    if (index === 2) return { bg: "#CD7F32", color: "#FFF" }; // Bronze
    return { bg: themeColors.inputbg, color: themeColors.text };
  };
  // Get the most critical status to display as the main indicator
  const getMainStatusConfig = () => {
    if ((device.tamper_count || 0) > 0) {
      return getDeviceStatusConfig("tamper", null, isDarkMode);
    }

    // Check current status from real-time data
    const currentStatus = device.current_status?.toLowerCase();
    if (currentStatus === "empty") {
      return getDeviceStatusConfig("empty", null, isDarkMode);
    }

    if ((device.low_alert_count || 0) > 0 || currentStatus === "low") {
      return getDeviceStatusConfig("low", null, isDarkMode);
    }
    if (currentStatus === "full") {
      return getDeviceStatusConfig("full", null, isDarkMode);
    }

    // Default to full status if no specific tissue-level status
    return getDeviceStatusConfig(
      ["tamper", "empty", "low", "full"].includes(currentStatus)
        ? currentStatus
        : "full",
      device.is_active,
      isDarkMode
    );
  };

  const rankStyle = getRankStyle();
  const lowAlertConfig = getAlertConfig(device.low_alert_count || 0, "low");
  const tamperConfig = getAlertConfig(device.tamper_count || 0, "tamper");
  const mainStatusConfig = getMainStatusConfig();

  const formatDate = (dateString) => {
    if (!dateString) return "No alerts";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface || themeColors.inputbg,
          borderColor: isDarkMode ? themeColors.border : "transparent",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.deviceInfo}>
          <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
            <Text style={[styles.rankText, { color: rankStyle.color }]}>
              #{index + 1}
            </Text>
            {index < 3 && (
              <Ionicons
                name="trophy"
                size={12}
                color={rankStyle.color}
                style={styles.trophyIcon}
              />
            )}
          </View>

          <View style={styles.deviceDetails}>
            <Text style={[styles.deviceName, { color: themeColors.heading }]}>
              {device.name || `Device ${device.device_id}`}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={themeColors.text + "80"}
              />
              <Text
                style={[styles.location, { color: themeColors.text + "80" }]}
              >
                Room {device.room || "N/A"} • Floor {device.floor || "N/A"}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: mainStatusConfig.color + "20" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: mainStatusConfig.color },
            ]}
          />
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        {/* Low Alerts */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: lowAlertConfig.color + "10" },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons
              name={lowAlertConfig.icon}
              size={20}
              color={lowAlertConfig.color}
            />
            <Text style={[styles.statValue, { color: lowAlertConfig.color }]}>
              {device.low_alert_count || 0}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: themeColors.text + "80" }]}>
            Low Alerts
          </Text>
          <Text style={[styles.statStatus, { color: lowAlertConfig.color }]}>
            {lowAlertConfig.label}
          </Text>
        </View>
        {/* Total Entries */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: themeColors.primary + "10" },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color={themeColors.primary}
            />
            <Text style={[styles.statValue, { color: themeColors.primary }]}>
              {device.total_entries || 0}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: themeColors.text + "80" }]}>
            Total Entries
          </Text>
          <Text style={[styles.statStatus, { color: themeColors.primary }]}>
            All Time
          </Text>
        </View>
        {/* Tamper Count */}
        <View
          style={[
            styles.statCard,
            { backgroundColor: tamperConfig.color + "10" },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons
              name={tamperConfig.icon}
              size={20}
              color={tamperConfig.color}
            />
            <Text style={[styles.statValue, { color: tamperConfig.color }]}>
              {device.tamper_count || 0}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: themeColors.text + "80" }]}>
            Tamper
          </Text>
          <Text style={[styles.statStatus, { color: tamperConfig.color }]}>
            {tamperConfig.label}
          </Text>
        </View>
      </View>

      {/* Footer */}
      {device.last_alert_time && (
        <View
          style={[
            styles.footer,
            { borderTopColor: themeColors.border || themeColors.text + "10" },
          ]}
        >
          <View style={styles.footerContent}>
            <Ionicons
              name="time-outline"
              size={16}
              color={themeColors.text + "60"}
            />
            <Text
              style={[styles.lastAlert, { color: themeColors.text + "80" }]}
            >
              Last alert: {formatDate(device.last_alert_time)}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={themeColors.text + "40"}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0, // Prevents overflow
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    position: "relative",
    flexShrink: 0, // Prevents shrinking
  },
  rankText: {
    fontSize: 16,
    fontWeight: "700",
  },
  trophyIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  deviceDetails: {
    flex: 1,
    minWidth: 0, // Prevents overflow
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap", // Allow wrapping on small screens
  },
  location: {
    fontSize: 14,
    flexShrink: 1, // Allow text to shrink if needed
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0, // Prevents shrinking
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 0, // Ensures proper flex shrinking
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
    minHeight: 32, // Consistent height for alignment
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  statStatus: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0, // Prevents overflow
  },
  lastAlert: {
    fontSize: 14,
    flexShrink: 1, // Allow text to shrink if needed
  },
});

export default DeviceStatsCard;
