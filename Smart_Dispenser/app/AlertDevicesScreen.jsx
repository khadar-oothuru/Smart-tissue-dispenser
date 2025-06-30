import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DeviceCard from "../components/AdminDash/DeviceCard";
import { useThemeContext } from "../context/ThemeContext";
import useDeviceStore from "../store/useDeviceStore";
import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import DeviceHeader from "../components/User/DeviceHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getDeviceStatusConfig,
  isTissueAlert,
  isBatteryAlert,
} from "../utils/deviceStatusConfig";

const ALERT_TYPE_MAP = {
  empty: {
    title: "Empty Dispensers",
    noData: "No empty devices found.",
  },
  tamper: {
    title: "Tamper Alerts",
    noData: "No tamper alert devices found.",
  },
  low: {
    title: "Low Alerts",
    noData: "No low alert devices found.",
  },
  alerts: {
    title: "Device Alerts",
    noData: "No alert devices found.",
  },
  all: {
    title: "Total Dispensers",
    noData: "No dispensers found.",
  },
  active: {
    title: "Active Devices",
    noData: "No active devices found.",
  },
  offline: {
    title: "Offline Devices",
    noData: "No offline devices found.",
  },
  full: {
    title: "Full Devices",
    noData: "No full devices found.",
  },
};

export default function AlertDevicesScreen() {
  const { themeColors, isDark } = useThemeContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { alertType = "all" } = route.params || {}; // "empty", "tamper", "low", "all"
  const deviceStore = useDeviceStore() || {};
  const [searchTerm, setSearchTerm] = React.useState("");

  // Merge analytics, real-time status, and device info
  // Improved merge: start from devices, overlay analytics and realtimeStatus
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
        // Alert counts
        low_alert_count: analyticsData.low_alert_count || 0,
        tamper_count: analyticsData.tamper_count || 0,
        total_entries: analyticsData.total_entries || 0,
        last_alert_time: analyticsData.last_alert_time,
        // Real-time fields
        current_alert: status.current_alert,
        current_tamper: status.current_tamper || false,
        current_count: status.current_count || 0,
      };
    });
  }, [deviceStore.devices, deviceStore.analytics, deviceStore.realtimeStatus]);

  // Sort devices by priority
  const sortedDevices = useMemo(() => {
    const getDevicePriority = (device) => {
      const statusConfig = getDeviceStatusConfig(
        device.current_status,
        device.is_active,
        isDark
      );
      return statusConfig.priority;
    };
    return [...mergedDevices].sort((a, b) => {
      const aPriority = getDevicePriority(a);
      const bPriority = getDevicePriority(b);
      if (aPriority !== bPriority) return bPriority - aPriority;
      const aTime = a.minutes_since_update || 0;
      const bTime = b.minutes_since_update || 0;
      if (aTime !== bTime) return aTime - bTime;
      const totalAlertsA = (a.low_alert_count || 0) + (a.tamper_count || 0);
      const totalAlertsB = (b.low_alert_count || 0) + (b.tamper_count || 0);
      return totalAlertsB - totalAlertsA;
    });
  }, [mergedDevices, isDark]);

  // Filter devices for alert-only (low, tamper, empty)
  // (Removed unused alertOnlyDevices and totalDispenserDevices)

  // Main filteredDevices logic for AlertDevicesScreen
  const filteredDevices = useMemo(() => {
    if (!sortedDevices || sortedDevices.length === 0) return [];
    let devices = [];
    if (alertType === "empty") {
      devices = sortedDevices.filter(
        (device) => (device.current_status || "").toLowerCase() === "empty"
      );
    } else if (alertType === "tamper") {
      devices = sortedDevices.filter(
        (device) => device.current_tamper === true
      );
    } else if (alertType === "low") {
      devices = sortedDevices.filter(
        (device) => (device.current_status || "").toLowerCase() === "low"
      );
    } else if (alertType === "full") {
      devices = sortedDevices.filter(
        (device) => (device.current_status || "").toLowerCase() === "full"
      );
    } else if (alertType === "active") {
      // Active: is_active true, or status is one of the active states, but not offline
      devices = sortedDevices.filter((device) => {
        const status = (device.current_status || "").toLowerCase();
        const isActiveFlag = device.is_active === true;
        const hasActiveStatus = [
          "normal",
          "active",
          "online",
          "tamper",
          "empty",
          "low",
          "full",
        ].includes(status);
        const hasRecentActivity =
          device.minutes_since_update !== null &&
          device.minutes_since_update <= 30;
        const hasPositivePriority = device.status_priority > 0;
        // Exclude offline-like statuses
        const isOffline = [
          "offline",
          "disconnected",
          "inactive",
          "power off",
          "power_off",
        ].includes(status);
        return (
          (isActiveFlag ||
            hasActiveStatus ||
            hasRecentActivity ||
            hasPositivePriority) &&
          !isOffline
        );
      });
    } else if (alertType === "offline" || alertType === "Offline") {
      // Enhanced offline detection: includes power off and no recent updates
      const isPowerOff = (powerStatus) => {
        if (powerStatus === null || powerStatus === undefined) return true;
        const status = String(powerStatus).trim().toLowerCase();
        return ["off", "no", "none", "", "0", "false"].includes(status);
      };

      devices = sortedDevices.filter((device) => {
        const status = (device.current_status || "").toLowerCase();
        const deviceIsPowerOff = isPowerOff(device.power_status);
        const isOfflineStatus = [
          "offline",
          "disconnected",
          "inactive",
          "power off",
          "power_off",
        ].includes(status);
        const hasNoRecentUpdates =
          device.minutes_since_update === null ||
          device.minutes_since_update > 30;

        return isOfflineStatus || deviceIsPowerOff || hasNoRecentUpdates;
      });
    } else if (alertType === "alerts") {
      // Only show tissue alerts, but exclude devices with status 'full'
      devices = sortedDevices.filter(
        (device) =>
          isTissueAlert(device) &&
          (device.current_status || "").toLowerCase() !== "full"
      );
    } else if (alertType === "all") {
      // Show all devices, but exclude those that are only in a battery alert state
      devices = sortedDevices.filter(
        (device) => isTissueAlert(device) || !isBatteryAlert(device)
      );
    }
    if (!searchTerm.trim()) return devices;
    const term = searchTerm.toLowerCase().trim();
    return devices.filter((device) => {
      const name = (device.name || device.device_name || "").toLowerCase();
      const id = (device.device_id || "").toString().toLowerCase();
      const room = (device.room || "").toLowerCase();
      const status = (device.current_status || "").toLowerCase();
      return (
        name.includes(term) ||
        id.includes(term) ||
        room.includes(term) ||
        status.includes(term)
      );
    });
  }, [sortedDevices, searchTerm, alertType]);

  const { title, noData } = ALERT_TYPE_MAP[alertType] || ALERT_TYPE_MAP.all;

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
            <Text
              style={{
                color: themeColors.text + "99",
                textAlign: "center",
                marginTop: 24,
              }}
            >
              {noData}
            </Text>
          ) : (
            filteredDevices.map((device, idx) => (
              <DeviceCard
                key={device.device_id || device.id || idx}
                device={device}
                index={idx}
                tissueOnly
              />
            ))
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
