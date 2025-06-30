// components/Analytics/DevicesTab.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import DeviceStatsCard from "../AdminAnalytics/DeviceStatsCard";
import ActiveDevicesList from "./ActiveDevicesList";

const DevicesTab = ({ analytics, summaryData }) => {
  const { themeColors } = useThemeContext();
  // Sort analytics data by priority score (similar to device list sorting)
  const sortedAnalytics = React.useMemo(() => {
    if (!analytics || !Array.isArray(analytics)) return [];

    return [...analytics].sort((a, b) => {
      const getDevicePriorityScore = (device) => {
        // Tamper status gets highest priority (100+)
        if ((device.tamper_count || 0) > 0) {
          return (
            100 + (device.tamper_count || 0) + (device.low_alert_count || 0)
          );
        }

        // If device has current_status from real-time data
        const status = device.current_status?.toLowerCase();
        if (status === "empty") {
          return 90 + (device.low_alert_count || 0);
        }

        // Low alerts get medium priority (80+)
        if ((device.low_alert_count || 0) > 0 || status === "low") {
          return 80 + (device.low_alert_count || 0);
        } // Full level status gets good priority (70+)
        if (status === "full") {
          return 70;
        }

        // Active devices with usage get priority (30-50)
        if ((device.total_entries || 0) > 0 || device.is_active === true) {
          return 30 + Math.floor((device.total_entries || 0) / 10); // Bonus for usage
        }

        // Inactive devices get lowest priority (0-10)
        if (
          device.is_active === false ||
          status === "inactive" ||
          status === "offline"
        ) {
          return status === "inactive" ? 5 : 10;
        }

        // Unknown status gets minimal priority
        return 1;
      };

      // Get priority scores for both devices
      const scoreA = getDevicePriorityScore(a);
      const scoreB = getDevicePriorityScore(b);

      // Sort by priority score (highest first)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // For devices with same priority, sort by total entries
      return (b.total_entries || 0) - (a.total_entries || 0);
    });
  }, [analytics]);

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
        Device Performance Rankings
      </Text>
      {sortedAnalytics.map((device, index) => (
        <DeviceStatsCard key={device.device_id} device={device} index={index} />
      ))}

      {summaryData && summaryData.most_active_devices && (
        <ActiveDevicesList devices={summaryData.most_active_devices} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
});

export default DevicesTab;
