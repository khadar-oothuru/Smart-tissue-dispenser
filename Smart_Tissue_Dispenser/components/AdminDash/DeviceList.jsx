import React from "react";
import { StyleSheet, Text, View } from "react-native";
import DeviceCard from "./DeviceCard";

export default function DevicesList({
  analytics,
  realtimeStatus,
  themeColors,
  summaryData,
  devices,
}) {
  const styles = getStyles(themeColors); // Merge analytics data with real-time status and device info
  const mergedDevices = analytics.map((device) => {
    const status =
      realtimeStatus?.find((s) => s.device_id === device.device_id) || {};
    const deviceInfo = devices?.find((d) => d.id === device.device_id) || {};

    return {
      ...device,
      // Device information with enhanced fallback handling for new devices
      device_name:
        device.device_name ||
        device.name ||
        deviceInfo.name ||
        status.device_name ||
        `Device ${device.device_id}`,
      name:
        device.name ||
        device.device_name ||
        deviceInfo.name ||
        status.device_name ||
        `Device ${device.device_id}`,
      // Enhanced room and floor fallback logic
      room_number:
        device.room_number !== undefined
          ? device.room_number
          : deviceInfo.room_number !== undefined
          ? deviceInfo.room_number
          : status.room_number !== undefined
          ? status.room_number
          : "",
      floor_number:
        device.floor_number !== undefined
          ? device.floor_number
          : deviceInfo.floor_number !== undefined
          ? deviceInfo.floor_number
          : status.floor_number !== undefined
          ? status.floor_number
          : 0,
      // Additional device properties
      location: device.location || deviceInfo.location || status.location || "",
      description:
        device.description ||
        deviceInfo.description ||
        status.description ||
        "",
      device_type:
        device.device_type ||
        deviceInfo.device_type ||
        status.device_type ||
        "dispenser",
      tissue_type:
        device.tissue_type ||
        deviceInfo.tissue_type ||
        status.tissue_type ||
        "hand_towel",
      meter_capacity:
        device.meter_capacity ||
        deviceInfo.meter_capacity ||
        status.meter_capacity ||
        500,
      // Real-time status data
      is_active:
        status.is_active !== undefined
          ? status.is_active
          : device.is_active || false,
      current_status:
        status.current_status || device.current_status || "unknown",
      current_alert: status.current_alert || device.current_alert,
      current_tamper: status.current_tamper || device.current_tamper || false,
      current_count: status.current_count || device.current_count || 0,
      minutes_since_update:
        status.minutes_since_update !== undefined
          ? status.minutes_since_update
          : device.minutes_since_update,
      status_priority:
        status.status_priority !== undefined
          ? status.status_priority
          : device.status_priority !== undefined
          ? device.status_priority
          : -1,
      // Keep existing analytics data
      low_alert_count: device.low_alert_count || 0,
      tamper_count: device.tamper_count || 0,
      total_entries: device.total_entries || 0,
      last_alert_time: device.last_alert_time,
      // Include creation/update timestamps
      created_at: device.created_at || deviceInfo.created_at,
      updated_at: device.updated_at || deviceInfo.updated_at,
    };
  }); // Sort devices by priority: tamper > empty > low > full > active > inactive
  const sortedDevices = React.useMemo(() => {
    // Helper function to get priority for sorting
    const getDevicePriority = (device) => {
      const status = device.current_status?.toLowerCase() || "unknown";

      switch (status) {
        case "tamper":
          return 100;
        case "empty":
          return 90;
        case "low":
          return 80;
        case "full":
          return 70;
        case "normal":
        case "active":
        case "online":
          return 30;
        case "inactive":
        case "offline":
        case "disconnected":
          return 10;
        default:
          if (device.is_active === true) return 25;
          if (device.is_active === false) return 5;
          return 1;
      }
    };

    return [...mergedDevices].sort((a, b) => {
      // First sort by our custom priority
      const aPriority = getDevicePriority(a);
      const bPriority = getDevicePriority(b);

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // Then by last activity time (most recent first) for same priority levels
      const aTime = a.minutes_since_update || 0;
      const bTime = b.minutes_since_update || 0;
      if (aTime !== bTime) {
        return aTime - bTime; // Lower minutes = more recent = higher priority
      }

      // Then by total alerts (for consistency)
      const totalAlertsA = (a.low_alert_count || 0) + (a.tamper_count || 0);
      const totalAlertsB = (b.low_alert_count || 0) + (b.tamper_count || 0);
      return totalAlertsB - totalAlertsA;
    });
  }, [mergedDevices]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Device Overview</Text>
        {summaryData?.summary?.total_devices && (
          <Text style={styles.deviceCount}>
            {summaryData.summary.total_devices} Total
          </Text>
        )}
      </View>

      {sortedDevices.length > 0 ? (
        sortedDevices.map((device, index) => (
          <DeviceCard key={device.device_id} device={device} index={index} />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No devices found</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    deviceCount: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.6,
    },
    emptyState: {
      padding: 40,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.5,
    },
  });
