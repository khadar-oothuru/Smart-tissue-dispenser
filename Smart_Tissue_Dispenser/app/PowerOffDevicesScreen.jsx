import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BatteryDeviceCard from "../components/AdminDash/BatteryDeviceCard";
import { useThemeContext } from "../context/ThemeContext";
import { useDeviceStore } from "../store/useDeviceStore";
import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import DeviceHeader from "../components/User/DeviceHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getBatteryDeviceStatus,
  getDeviceStatusConfig,
} from "../utils/deviceStatusConfig";

export default function PowerOffDevicesScreen() {
  const { themeColors, isDark } = useThemeContext();
  const navigation = useNavigation();
  const route = useRoute();
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
        // Power-related fields - Fixed to match backend logic
        power_status: status.power_status || analyticsData.power_status,
        power_off_count: analyticsData.power_off_count || 0,
        battery_percentage:
          status.battery_percentage || analyticsData.battery_percentage,
        // Battery alert fields - Fixed to match backend logic
        battery_low_count: analyticsData.battery_low_count || 0,
        battery_critical_count: analyticsData.battery_critical_count || 0,
        battery_alert_count: analyticsData.battery_alert_count || 0,
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

  // Sort devices by power status priority
  const sortedDevices = useMemo(() => {
    const getPowerPriority = (device) => {
      // Safely handle undefined/null status fields
      const powerStatus = device.power_status
        ? String(device.power_status).toLowerCase()
        : "";
      const currentStatus = device.current_status
        ? String(device.current_status).toLowerCase()
        : "";

      // Priority: Power Off > Offline > Disconnected > Inactive > Normal
      if (powerStatus === "off" || currentStatus === "power_off") return 100;
      if (currentStatus === "offline" || currentStatus === "disconnected")
        return 80;
      if (currentStatus === "inactive") return 60;
      if (device.power_off_count > 0) return 40;
      return 0;
    };

    return [...mergedDevices].sort((a, b) => {
      const aPriority = getPowerPriority(a);
      const bPriority = getPowerPriority(b);
      if (aPriority !== bPriority) return bPriority - aPriority;

      // Then by last activity time (most recent first)
      const aTime = a.minutes_since_update || 0;
      const bTime = b.minutes_since_update || 0;
      return aTime - bTime;
    });
  }, [mergedDevices]);

  // Filter devices for power off alerts - Improved logic
  const filteredDevices = useMemo(() => {
    if (!sortedDevices || sortedDevices.length === 0) return [];

    // Enhanced power off detection logic
    const isPowerOff = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return true;
      const status = String(powerStatus).trim().toLowerCase();
      return ["off", "no", "none", "", "0", "false"].includes(status);
    };

    // Only show devices where power_status indicates power-off
    let devices = sortedDevices.filter((device) => {
      const deviceIsPowerOff = isPowerOff(device.power_status);
      const currentStatus = (device.current_status || "").toLowerCase();
      const isNotOnline = !["online", "normal", "active"].includes(
        currentStatus
      );
      return deviceIsPowerOff && isNotOnline;
    });

    // Apply search filter
    if (!searchTerm.trim()) return devices;
    const term = searchTerm.toLowerCase().trim();
    return devices.filter((device) => {
      const name = (device.name || device.device_name || "").toLowerCase();
      const id = (device.device_id || "").toString().toLowerCase();
      const room = (device.room || "").toLowerCase();
      const status = (device.current_status || "").toLowerCase();
      const powerStatus = (device.power_status || "").toLowerCase();
      return (
        name.includes(term) ||
        id.includes(term) ||
        room.includes(term) ||
        status.includes(term) ||
        powerStatus.includes(term)
      );
    });
  }, [sortedDevices, searchTerm]);

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
              {/* <Ionicons
                name="power-plug-off"
                size={24}
                color="#FF3B30"
                style={{ marginRight: 8 }}
              /> */}
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "700",
                  color: themeColors.heading,
                  letterSpacing: 0.5,
                }}
              >
                Power Off Devices
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
                name="power-outline"
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
                No power off devices found.
              </Text>
              <Text
                style={{
                  color: themeColors.text + "66",
                  textAlign: "center",
                  fontSize: 14,
                  marginTop: 8,
                }}
              >
                All devices are powered on and connected
              </Text>
            </View>
          ) : (
            filteredDevices.map((device, idx) => {
              // Always use power_off config for this screen
              const statusConfig = getDeviceStatusConfig(
                "power_off",
                device.is_active,
                isDark
              );
              // Pass battery_percentage as number or null/undefined only
              let batteryValue = device.battery_percentage;
              if (
                batteryValue === undefined ||
                batteryValue === null ||
                isNaN(Number(batteryValue))
              ) {
                batteryValue = null;
              } else {
                batteryValue = Number(batteryValue);
              }
              return (
                <BatteryDeviceCard
                  key={device.device_id || device.id || idx}
                  device={{
                    ...device,
                    battery_percentage: batteryValue,
                    statusConfig,
                  }}
                  index={idx}
                  forceStatusConfig={statusConfig}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
