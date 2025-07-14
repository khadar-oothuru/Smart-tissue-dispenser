// BatteryAlertsScreen.jsx
import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import BatteryDeviceCard from "./BatteryDeviceCard";
import { useTheme } from "../../hooks/useThemeContext";
import { useDeviceStore } from "../../store/useDeviceStore";
import DeviceHeader from "./DeviceHeader";
import { useNavigate, useParams } from "react-router-dom";
import { getDeviceStatusConfig } from "../../utils/deviceStatusConfig";

const BATTERY_ALERT_TYPE_MAP = {
  "critical-battery": {
    title: "Critical Battery",
    noData: "No critical battery devices found.",
  },
  "battery-off": {
    title: "Battery Off",
    noData: "No battery off devices found.",
  },
  "low-battery": {
    title: "Low Battery",
    noData: "No low battery devices found.",
  },
  "good-battery": {
    title: "Good Battery",
    noData: "No devices with good battery found.",
  },
  "all-battery": {
    title: "Battery Alerts",
    noData: "No battery alert devices found.",
  },
};

export default function BatteryAlertsScreen() {
  const { themeColors, isDark } = useTheme();
  const navigate = useNavigate();
  const { alertType = "all-battery" } = useParams();
  const deviceStore = useDeviceStore();
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

    // Create maps for efficient lookup
    const analyticsMap = new Map(
      analytics.map((a) => [a.device_id || a.id, a])
    );
    const statusMap = new Map(realtimeStatus.map((s) => [s.device_id, s]));

    return devices.map((device) => {
      const analyticsData = analyticsMap.get(device.id) || {};
      const status = statusMap.get(device.id) || {};

      // Ensure we have all necessary fields for BatteryDeviceCard
      return {
        ...device,
        ...analyticsData,
        ...status,
        // Essential fields
        id: device.id,
        device_id: device.id || device.device_id,
        name:
          device.name ||
          analyticsData.device_name ||
          status.device_name ||
          `Device ${device.id}`,
        device_name:
          device.name ||
          analyticsData.device_name ||
          status.device_name ||
          `Device ${device.id}`,
        room: device.room || analyticsData.room || status.room || "",
        floor: device.floor || analyticsData.floor || status.floor || "",

        // Status information
        is_active:
          status.is_active ??
          analyticsData.is_active ??
          device.is_active ??
          true,
        current_status:
          status.current_status ||
          analyticsData.current_status ||
          device.current_status ||
          "unknown",
        status_priority:
          status.status_priority ??
          analyticsData.status_priority ??
          device.status_priority ??
          0,

        // Battery-specific fields
        battery_percentage:
          status.battery_percentage ??
          analyticsData.battery_percentage ??
          device.battery_percentage,
        battery_low: status.battery_low ?? device.battery_low ?? 0,
        battery_critical:
          status.battery_critical ?? device.battery_critical ?? 0,
        battery_off: status.battery_off ?? device.battery_off ?? 0,

        // Battery alert counts
        battery_low_count:
          analyticsData.battery_low_count || status.battery_low_count || 0,
        battery_critical_count:
          analyticsData.battery_critical_count ||
          status.battery_critical_count ||
          0,
        battery_off_count:
          analyticsData.battery_off_count || status.battery_off_count || 0,
        battery_alert_count:
          analyticsData.battery_alert_count || status.battery_alert_count || 0,

        // Timing information
        minutes_since_update:
          status.minutes_since_update ??
          analyticsData.minutes_since_update ??
          null,
        last_alert_time:
          status.last_alert_time ||
          analyticsData.last_alert_time ||
          device.last_alert_time,
        last_update:
          status.last_update || analyticsData.last_update || device.last_update,

        // Power status (exclude power off from battery alerts)
        power_status:
          device.power_status ??
          status.power_status ??
          analyticsData.power_status ??
          "on",
      };
    });
  }, [deviceStore.devices, deviceStore.analytics, deviceStore.realtimeStatus]);

  // Sort devices by battery priority
  const sortedDevices = useMemo(() => {
    const getBatteryPriority = (device) => {
      const batteryPercentage = device.battery_percentage;

      // Critical battery (0-10%)
      if (
        device.battery_critical === 1 ||
        device.battery_critical_count > 0 ||
        (batteryPercentage !== null && batteryPercentage <= 10)
      ) {
        return 100;
      }

      // Battery off (0%)
      if (
        device.battery_off === 1 ||
        device.battery_off_count > 0 ||
        batteryPercentage === 0
      ) {
        return 90;
      }

      // Low battery (11-20%)
      if (
        device.battery_low === 1 ||
        device.battery_low_count > 0 ||
        (batteryPercentage !== null &&
          batteryPercentage > 10 &&
          batteryPercentage <= 20)
      ) {
        return 80;
      }

      // Good battery (>20%)
      if (batteryPercentage !== null && batteryPercentage > 20) {
        return 20;
      }

      return 0;
    };

    return [...mergedDevices].sort((a, b) => {
      const aPriority = getBatteryPriority(a);
      const bPriority = getBatteryPriority(b);
      if (aPriority !== bPriority) return bPriority - aPriority;

      // Then sort by battery percentage (lower first)
      const aBattery = a.battery_percentage ?? 100;
      const bBattery = b.battery_percentage ?? 100;
      if (aBattery !== bBattery) return aBattery - bBattery;

      // Finally by last update time
      const aTime = a.minutes_since_update || 0;
      const bTime = b.minutes_since_update || 0;
      return aTime - bTime;
    });
  }, [mergedDevices]);

  // Filter devices based on alert type
  const filteredDevices = useMemo(() => {
    if (!sortedDevices || sortedDevices.length === 0) return [];

    let devices = [];
    switch (alertType) {
      case "critical-battery":
        devices = sortedDevices.filter((device) => {
          const batteryPercentage = device.battery_percentage;
          return (
            batteryPercentage !== null &&
            batteryPercentage >= 1 &&
            batteryPercentage <= 10
          );
        });
        break;
      case "battery-off":
        devices = sortedDevices.filter((device) => {
          const batteryPercentage = device.battery_percentage;
          return (
            device.battery_off === 1 ||
            device.battery_off_count > 0 ||
            batteryPercentage === 0
          );
        });
        break;
      case "low-battery":
        devices = sortedDevices.filter((device) => {
          const batteryPercentage = device.battery_percentage;
          // Only include if battery is >10 and <=20
          return (
            batteryPercentage !== null &&
            batteryPercentage > 10 &&
            batteryPercentage <= 20
          );
        });
        break;
      case "good-battery":
        devices = sortedDevices.filter((device) => {
          const batteryPercentage = device.battery_percentage;
          return batteryPercentage !== null && batteryPercentage > 20;
        });
        break;
      case "all-battery":
        devices = sortedDevices.filter((device) => {
          const batteryPercentage = device.battery_percentage;
          // critical
          if (
            (device.battery_critical === 1 ||
              device.battery_critical_count > 0 ||
              (batteryPercentage !== null &&
                batteryPercentage > 0 &&
                batteryPercentage <= 10)) &&
            !(
              device.battery_off === 1 ||
              device.battery_off_count > 0 ||
              batteryPercentage === 0
            )
          )
            return true;
          // battery off
          if (
            device.battery_off === 1 ||
            device.battery_off_count > 0 ||
            batteryPercentage === 0
          )
            return true;
          // low
          if (
            batteryPercentage !== null &&
            batteryPercentage > 10 &&
            batteryPercentage <= 20 &&
            !(
              device.battery_critical === 1 ||
              device.battery_critical_count > 0 ||
              batteryPercentage <= 10
            ) &&
            !(
              device.battery_off === 1 ||
              device.battery_off_count > 0 ||
              batteryPercentage === 0
            )
          )
            return true;
          // good
          if (batteryPercentage !== null && batteryPercentage > 20) return true;
          return false;
        });
        break;
      default:
        devices = [];
        break;
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      devices = devices.filter((device) => {
        const name = (device.name || device.device_name || "").toLowerCase();
        const id = (device.device_id || device.id || "")
          .toString()
          .toLowerCase();
        const room = (device.room || "").toLowerCase();
        const batteryLevel = device.battery_percentage?.toString() || "";

        return (
          name.includes(term) ||
          id.includes(term) ||
          room.includes(term) ||
          batteryLevel.includes(term)
        );
      });
    }

    return devices;
  }, [sortedDevices, searchTerm, alertType]);

  const { title, noData } =
    BATTERY_ALERT_TYPE_MAP[alertType] || BATTERY_ALERT_TYPE_MAP["all-battery"];

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
            <ArrowLeft size={24} style={{ color: themeColors.primary }} />
          </button>

          <h1
            className="text-2xl font-bold tracking-wide text-center flex-shrink-0"
            style={{ color: themeColors.heading, minWidth: "180px" }}
          >
            {title}
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
          <p
            className="text-center mt-6 opacity-60"
            style={{ color: themeColors.text }}
          >
            {noData}
          </p>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {filteredDevices.map((device, idx) => {
              // Pass battery percentage correctly
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
                  }}
                  index={idx}
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
