import React, { useMemo, useState } from "react";
import { IoArrowBack, IoPowerOutline } from "react-icons/io5";
import BatteryDeviceCard from "./BatteryDeviceCard";
import { useTheme } from "../../hooks/useThemeContext";
import { useDeviceStore } from "../../store/useDeviceStore";
import DeviceHeader from "./DeviceHeader";
import { useNavigate } from "react-router-dom";
import { getDeviceStatusConfig } from "../../utils/deviceStatusConfig";

export default function PowerOffDevicesScreen() {
  const { themeColors, isDark } = useTheme();
  const navigate = useNavigate();
  // const location = useLocation();
  const deviceStore = useDeviceStore() || {};
  const [searchTerm, setSearchTerm] = useState("");

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
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Header with solid background color and search bar in the same row */}
      <div className="pt-2" style={{ backgroundColor: themeColors.background }}>
        <div className="flex items-center gap-4 px-4 pb-3">
          <button
            onClick={() => navigate(-1)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${
              isDark
                ? "bg-primary/20 border border-primary/30"
                : "bg-primary/10"
            }`}
            style={{
              backgroundColor: isDark
                ? `${themeColors.primary}30`
                : `${themeColors.primary}15`,
              borderColor: isDark ? `${themeColors.primary}50` : "transparent",
            }}
          >
            <IoArrowBack size={24} style={{ color: themeColors.primary }} />
          </button>

          <h1
            className="text-2xl font-bold tracking-wide text-center flex-shrink-0"
            style={{ color: themeColors.heading, minWidth: "180px" }}
          >
            Power Off Devices
          </h1>

          <div className="flex-1 min-w-0">
            <DeviceHeader
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              bgColor={themeColors.surface}
              borderColor={themeColors.border}
            />
          </div>
        </div>
      </div>

      {/* Horizontal line */}
      <div
        className="h-0.5 w-full mb-1"
        style={{ backgroundColor: themeColors.surface }}
      />

      {/* Scrollable content with single column layout, full width cards */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <IoPowerOutline
              size={64}
              className="mb-4 opacity-25"
              style={{ color: themeColors.text }}
            />
            <p
              className="text-center text-base font-medium opacity-60"
              style={{ color: themeColors.text }}
            >
              No power off devices found.
            </p>
            <p
              className="text-center text-sm mt-2 opacity-40"
              style={{ color: themeColors.text }}
            >
              All devices are powered on and connected
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {filteredDevices.map((device, idx) => {
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
                  className="w-full"
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
