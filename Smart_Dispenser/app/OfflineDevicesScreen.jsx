import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DeviceCard from "../components/AdminDash/DeviceCard";
import BatteryDeviceCard from "../components/AdminDash/BatteryDeviceCard";
import { useThemeContext } from "../context/ThemeContext";
import useDeviceStore from "../store/useDeviceStore";
import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import DeviceHeader from "../components/User/DeviceHeader";
import { useNavigation } from "@react-navigation/native";
import { getDeviceStatusConfig } from "../utils/deviceStatusConfig";

export default function OfflineDevicesScreen() {
  const { themeColors, isDark } = useThemeContext();
  const navigation = useNavigation();
  const {
    analytics = [],
    realtimeStatus = [],
    devices = [],
  } = useDeviceStore();
  const [searchTerm, setSearchTerm] = useState("");

  // Merge analytics, real-time status, and device info (PowerOffDevicesScreen logic)
  const mergedDevices = useMemo(() => {
    const devicesArr = Array.isArray(devices) ? devices : [];
    const analyticsArr = Array.isArray(analytics) ? analytics : [];
    const realtimeArr = Array.isArray(realtimeStatus) ? realtimeStatus : [];

    // Map for fast lookup
    const analyticsMap = new Map(
      analyticsArr.map((a) => [a.device_id || a.id, a])
    );
    const statusMap = new Map(realtimeArr.map((s) => [s.device_id, s]));

    // Merge all devices (including new ones)
    return devicesArr.map((device) => {
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
        // Power-related fields
        power_status: status.power_status || analyticsData.power_status,
        pwrstatus: status.pwrstatus || analyticsData.pwrstatus,
        power_off_count: analyticsData.power_off_count || 0,
        battery_percentage:
          status.battery_percentage || analyticsData.battery_percentage,
        // Battery alert fields
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
  }, [devices, analytics, realtimeStatus]);

  // Filter for offline devices: current_status 'offline' or power_status/pwrstatus off/no/none/0/false
  const offlineDevices = useMemo(() => {
    const isPowerOff = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return false;
      const status = String(powerStatus).trim().toLowerCase();
      return ["off", "no", "none", "", "0", "false"].includes(status);
    };
    return mergedDevices.filter((device) => {
      const status = (device.current_status || "").toLowerCase();
      const pwr = (device.pwrstatus || device.power_status || "").toLowerCase();
      return status === "offline" || isPowerOff(pwr);
    });
  }, [mergedDevices]);

  // Sort and filter by search term
  const sortedDevices = useMemo(() => {
    const getDevicePriority = (device) => {
      // Power off devices get highest priority
      const powerStatus = (
        device.power_status ||
        device.pwrstatus ||
        ""
      ).toLowerCase();
      const currentStatus = (device.current_status || "").toLowerCase();
      if (
        ["off", "no", "none", "", "0", "false"].includes(powerStatus) ||
        currentStatus === "power_off"
      )
        return 100;
      if (currentStatus === "offline" || currentStatus === "disconnected")
        return 80;
      if (currentStatus === "inactive") return 60;
      if (device.power_off_count > 0) return 40;
      // fallback to status config
      const statusConfig = getDeviceStatusConfig(
        device.current_status,
        device.is_active,
        isDark
      );
      return statusConfig.priority;
    };
    return [...offlineDevices].sort((a, b) => {
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
  }, [offlineDevices, isDark]);

  const filteredDevices = useMemo(() => {
    if (!sortedDevices || sortedDevices.length === 0) return [];
    if (!searchTerm.trim()) return sortedDevices;
    const term = searchTerm.toLowerCase().trim();
    return sortedDevices.filter((device) => {
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
  }, [sortedDevices, searchTerm]);

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
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
                Offline Dispensers
              </Text>
            </View>
            <View style={{ width: 40, height: 40 }} />
          </View>
        </LinearGradient>
        <View
          style={{
            height: 2,
            backgroundColor: themeColors.surface,
            width: "100%",
            marginBottom: 4,
          }}
        />
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
              No offline devices found.
            </Text>
          ) : (
            filteredDevices.map((device, idx) => {
              // If device has a battery or power status, use BatteryDeviceCard, else DeviceCard
              const hasBatteryOrPower =
                device.battery_percentage !== undefined ||
                device.power_status !== undefined ||
                device.pwrstatus !== undefined;
              if (hasBatteryOrPower) {
                return (
                  <BatteryDeviceCard
                    key={device.device_id || device.id || idx}
                    device={device}
                    index={idx}
                  />
                );
              }
              return (
                <DeviceCard
                  key={device.device_id || device.id || idx}
                  device={device}
                  index={idx}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
