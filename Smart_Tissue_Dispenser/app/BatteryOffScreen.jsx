import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BatteryDeviceCard from "../components/AdminDash/BatteryDeviceCard";
import { useThemeContext } from "../context/ThemeContext";
import { useDeviceStore } from "../store/useDeviceStore";
import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import DeviceHeader from "../components/User/DeviceHeader";
import { useNavigation } from "@react-navigation/native";
import { getDeviceStatusConfig } from "../utils/deviceStatusConfig";

export default function BatteryOffScreen() {
  const { themeColors, isDark } = useThemeContext();
  const navigation = useNavigation();
  const deviceStore = useDeviceStore();
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
        // Battery-related fields
        battery_percentage:
          status.battery_percentage ?? analyticsData.battery_percentage,
        battery_off_count: analyticsData.battery_off_count || 0,
        battery_low_count: analyticsData.battery_low_count || 0,
        battery_critical_count: analyticsData.battery_critical_count || 0,
        battery_alert_count: analyticsData.battery_alert_count || 0,
        power_status: status.power_status || analyticsData.power_status,
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

  // Filter devices with battery percentage = 0
  const batteryOffDevices = useMemo(() => {
    return mergedDevices.filter((device) => {
      // Use the same logic as in alertCounts.js for consistency
      const batteryOff = device.battery_off === 1;
      const batteryPercentage =
        typeof device.battery_percentage === "number"
          ? device.battery_percentage
          : null;
      const currentStatus = device.current_status
        ? String(device.current_status).toLowerCase()
        : "";

      // Battery off: percentage is exactly 0 (not null) or battery_off flag is set
      const isBatteryOff = batteryOff || batteryPercentage === 0;

      // Show devices with battery off or current_status = "battery_off"
      return (
        isBatteryOff ||
        currentStatus === "battery_off" ||
        device.battery_off_count > 0
      );
    });
  }, [mergedDevices]);

  // Sort devices by battery priority
  const sortedDevices = useMemo(() => {
    const getBatteryPriority = (device) => {
      const batteryPercentage = device.battery_percentage;
      // Safely handle undefined/null status fields
      const currentStatus = device.current_status
        ? String(device.current_status).toLowerCase()
        : "";

      // Priority: Battery Off (0%) > Recently detected
      if (batteryPercentage === 0 || currentStatus === "battery_off")
        return 100;
      if (device.battery_off_count > 0) return 80;
      return 0;
    };

    return [...batteryOffDevices].sort((a, b) => {
      const priorityDiff = getBatteryPriority(b) - getBatteryPriority(a);
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort by last update (most recent first)
      const aTime = new Date(a.last_alert_time || 0).getTime();
      const bTime = new Date(b.last_alert_time || 0).getTime();
      return bTime - aTime;
    });
  }, [batteryOffDevices]);

  // Filter by search term
  const filteredDevices = useMemo(() => {
    if (!searchTerm.trim()) return sortedDevices;

    const term = searchTerm.toLowerCase();
    return sortedDevices.filter((device) => {
      const searchableText = [
        device.device_name,
        device.name,
        device.room,
        device.floor,
        `room ${device.room}`,
        `floor ${device.floor}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [sortedDevices, searchTerm]);

  const handleDevicePress = (device) => {
    navigation.navigate("UserDeviceDetailScreen", { deviceId: device.id });
  };

  const renderDeviceCard = (device) => {
    const batteryPercentage = device.battery_percentage ?? 0;
    const statusConfig = getDeviceStatusConfig(device);

    return (
      <BatteryDeviceCard
        key={device.id}
        device={device}
        onPress={() => handleDevicePress(device)}
        statusConfig={statusConfig}
        batteryStatus={{
          percentage: batteryPercentage,
          status: batteryPercentage === 0 ? "Battery Off" : "Low Battery",
          isCharging: false,
          timeRemaining: batteryPercentage === 0 ? "No Power" : "Critical",
        }}
        showBatteryDetails={true}
      />
    );
  };

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
                Battery Off Devices
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

        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {filteredDevices.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 60,
              }}
            >
              <Ionicons
                name="battery-charging-outline"
                size={64}
                color={themeColors.success}
                style={{ marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: themeColors.text,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                All Batteries Charged! 🔋
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: themeColors.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {searchTerm.trim()
                  ? `No battery off devices found for "${searchTerm}"`
                  : "No devices currently have depleted batteries"}
              </Text>
            </View>
          ) : (
            <>
              {/* Device List */}
              {filteredDevices.map(renderDeviceCard)}
            </>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
