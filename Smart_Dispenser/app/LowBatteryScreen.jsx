import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BatteryDeviceCard from "../components/AdminDash/BatteryDeviceCard";
import { useThemeContext } from "../context/ThemeContext";
import useDeviceStore from "../store/useDeviceStore";
import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import DeviceHeader from "../components/User/DeviceHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getDeviceStatusConfig,
  getBatteryDeviceStatus,
} from "../utils/deviceStatusConfig";
import { getBatteryAndPowerAlertCounts } from "../utils/alertCounts";

const BATTERY_ALERT_TYPE_MAP = {
  low: {
    title: "Low Battery ",
    noData: "No low battery devices found.",
    icon: "battery-low",
    color: "#FF9F00",
  },
  critical: {
    title: "Critical Battery ",
    noData: "No critical battery devices found.",
    icon: "battery-dead",
    color: "#FF3B30",
  },
  power_off: {
    title: "Power Off Devices",
    noData: "No power off devices found.",
    icon: "power-plug-off",
    color: "#8B5CF6",
  },
  all_battery: {
    title: "Battery Alert Devices",
    noData: "No battery alert devices found.",
    icon: "battery-charging",
    color: "#FACC15",
  },
};

export default function LowBatteryScreen() {
  const { themeColors, isDark } = useThemeContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { alertType = "all_battery" } = route.params || {}; // "low", "critical", "power_off", "all_battery"
  const deviceStore = useDeviceStore() || {};
  const [searchTerm, setSearchTerm] = React.useState("");

  // Merge analytics, real-time status, and device info
  const mergedDevices = useMemo(() => {
    const devices = Array.isArray(deviceStore.devices)
      ? deviceStore.devices
      : [];
    const analytics = Array.isArray(deviceStore.analytics)
      ? deviceStore.analytics
      : [];
    const realtimeStatus = Array.isArray(deviceStore.realtimeStatus)
      ? deviceStore.realtimeStatus
      : [];

    // Map for fast lookup
    const analyticsMap = new Map(
      analytics.map((a) => [a.device_id || a.id, a])
    );
    const statusMap = new Map(realtimeStatus.map((s) => [s.device_id, s]));

    // Merge all devices (including new ones)
    return devices.map((device) => {
      const analyticsData = analyticsMap.get(device.id) || {};
      const status = statusMap.get(device.id) || {};

      return {
        ...device,
        ...analyticsData,
        // Prefer real-time status for live fields
        is_active:
          status.is_active !== undefined
            ? status.is_active
            : analyticsData.is_active !== undefined
            ? analyticsData.is_active
            : false,
        current_status:
          status.current_status || analyticsData.current_status || "unknown",
        minutes_since_update:
          status.minutes_since_update ??
          analyticsData.minutes_since_update ??
          null,
        status_priority:
          status.status_priority ?? analyticsData.status_priority ?? -1,
        device_name:
          device.name || analyticsData.device_name || `Device ${device.id}`,
        name: device.name || analyticsData.device_name || `Device ${device.id}`,
        room: device.room || analyticsData.room || "",
        floor: device.floor || analyticsData.floor || "",
        // Battery-specific fields - Fixed to match backend logic
        battery_percentage:
          status.battery_percentage || analyticsData.battery_percentage,
        battery_low_count: analyticsData.battery_low_count || 0,
        battery_critical_count: analyticsData.battery_critical_count || 0,
        battery_alert_count: analyticsData.battery_alert_count || 0,
        power_off_count: analyticsData.power_off_count || 0,
        // Real-time battery status - Fixed to match backend logic
        battery_critical: status.battery_critical || 0,
        battery_low: status.battery_low || 0,
        power_status: status.power_status,
        // Other fields
        low_alert_count: analyticsData.low_alert_count || 0,
        tamper_count: analyticsData.tamper_count || 0,
        total_entries: analyticsData.total_entries || 0,
        last_alert_time: analyticsData.last_alert_time,
        current_alert: status.current_alert,
        current_tamper: status.current_tamper || false,
        current_count: status.current_count || 0,
      };
    });
  }, [deviceStore.devices, deviceStore.analytics, deviceStore.realtimeStatus]);

  // Sort devices by battery priority - Fixed logic
  const sortedDevices = useMemo(() => {
    const getBatteryPriority = (device) => {
      // Priority: Critical Battery > Low Battery > Power Off > Normal
      if (device.battery_critical === 1 || device.battery_critical_count > 0)
        return 100;
      if (device.battery_low === 1 || device.battery_low_count > 0) return 80;
      if (
        device.power_status?.toLowerCase() === "off" ||
        device.power_off_count > 0
      )
        return 60;
      if (device.battery_percentage !== null && device.battery_percentage <= 20)
        return 40;
      return 0;
    };

    return [...mergedDevices].sort((a, b) => {
      const aPriority = getBatteryPriority(a);
      const bPriority = getBatteryPriority(b);
      if (aPriority !== bPriority) return bPriority - aPriority;

      // Then by battery percentage (lower first)
      const aBattery = a.battery_percentage || 100;
      const bBattery = b.battery_percentage || 100;
      if (aBattery !== bBattery) return aBattery - bBattery;

      // Then by last activity time
      const aTime = a.minutes_since_update || 0;
      const bTime = b.minutes_since_update || 0;
      return aTime - bTime;
    });
  }, [mergedDevices]);

  // Filter devices for battery alerts - Refactored to use utility logic
  const filteredDevices = useMemo(() => {
    if (!sortedDevices || sortedDevices.length === 0) return [];

    // Enhanced power off detection logic
    const isPowerOff = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return true;
      const status = String(powerStatus).trim().toLowerCase();
      return ["off", "no", "none", "", "0", "false"].includes(status);
    };

    return sortedDevices
      .filter((device) => {
        const deviceIsPowerOff = isPowerOff(device.power_status);
        const batteryCritical = device.battery_critical === 1;
        const batteryLow = device.battery_low === 1;
        const batteryPercentage =
          typeof device.battery_percentage === "number"
            ? device.battery_percentage
            : null;

        if (alertType === "low") {
          // Low battery: > 10% and <= 20%, not power off
          return (
            !deviceIsPowerOff &&
            (batteryLow ||
              (batteryPercentage !== null &&
                batteryPercentage > 10 &&
                batteryPercentage <= 20))
          );
        } else if (alertType === "critical") {
          // Critical battery: <= 10%, not power off
          return (
            !deviceIsPowerOff &&
            (batteryCritical ||
              (batteryPercentage !== null && batteryPercentage <= 10))
          );
        } else if (alertType === "power_off") {
          // Power off devices
          return deviceIsPowerOff;
        } else if (alertType === "all_battery") {
          // All battery alerts: critical, low, or power off
          return (
            (!deviceIsPowerOff &&
              (batteryCritical ||
                batteryLow ||
                (batteryPercentage !== null && batteryPercentage <= 20))) ||
            deviceIsPowerOff
          );
        }
        return false;
      })
      .filter((device) => {
        // Apply search filter
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase().trim();
        const name = (device.name || device.device_name || "").toLowerCase();
        const id = (device.device_id || "").toString().toLowerCase();
        const room = (device.room || "").toLowerCase();
        const batteryLevel = device.battery_percentage?.toString() || "";
        return (
          name.includes(term) ||
          id.includes(term) ||
          room.includes(term) ||
          batteryLevel.includes(term)
        );
      });
  }, [sortedDevices, searchTerm, alertType]);

  const { title, noData, icon, color } =
    BATTERY_ALERT_TYPE_MAP[alertType] || BATTERY_ALERT_TYPE_MAP.all_battery;

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        {/* Modern Header with back button and styled title */}
        <LinearGradient
          colors={
            isDark
              ? [themeColors.surface, themeColors.background]
              : ["#ffffff", themeColors.background]
          }
          style={{ paddingTop: 44 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark
                  ? `${themeColors.primary}30`
                  : `${themeColors.primary}15`,
                borderColor: isDark
                  ? `${themeColors.primary}50`
                  : "transparent",
                borderWidth: isDark ? 1 : 0,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={themeColors.primary}
              />
            </TouchableOpacity>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginHorizontal: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "700",
                  color: themeColors.heading,
                  letterSpacing: 0.5,
                }}
              >
                {title}
              </Text>
            </View>
            {/* Placeholder for right side, to keep title centered */}
            <View style={{ width: 40, height: 40 }} />
          </View>
        </LinearGradient>

        {/* Horizontal line between header and search filter */}
        <View
          style={{
            height: 2,
            backgroundColor: themeColors.surface,
            width: "100%",
            marginBottom: 4,
          }}
        />

        {/* Search bar below header */}
        <DeviceHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        <ScrollView>
          {filteredDevices.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Ionicons
                name="battery-charging-outline"
                size={64}
                color={themeColors.text + "40"}
                style={{ marginBottom: 16 }}
              />
              <Text
                style={{
                  color: themeColors.text + "99",
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "500",
                }}
              >
                {noData}
              </Text>
              <Text
                style={{
                  color: themeColors.text + "66",
                  textAlign: "center",
                  fontSize: 14,
                  marginTop: 8,
                }}
              >
                All devices have healthy battery levels
              </Text>
            </View>
          ) : (
            filteredDevices.map((device, idx) => (
              <BatteryDeviceCard
                key={device.device_id || device.id || idx}
                device={device}
                index={idx}
              />
            ))
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
