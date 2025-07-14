import React, { useMemo, useState } from "react";
import { ArrowLeft, Battery, BatteryLow, Power, Zap } from "lucide-react";
import { useThemeContext } from "../context/ThemeContext";
import { useDeviceStore } from "../store/useDeviceStore";
import { useNavigate, useParams } from "react-router-dom";

// Component imports - you'll need to create web versions of these
import BatteryDeviceCard from "../components/AdminDash/BatteryDeviceCard";
import DeviceHeader from "../components/User/DeviceHeader";

const BATTERY_ALERT_TYPE_MAP = {
  low: {
    title: "Low Battery",
    noData: "No low battery devices found.",
    icon: BatteryLow,
    color: "text-orange-500",
  },
  critical: {
    title: "Critical Battery",
    noData: "No critical battery devices found.",
    icon: Battery,
    color: "text-red-500",
  },
  power_off: {
    title: "Power Off Devices",
    noData: "No power off devices found.",
    icon: Power,
    color: "text-purple-500",
  },
  all_battery: {
    title: "Battery Alert Devices",
    noData: "No battery alert devices found.",
    icon: Zap,
    color: "text-yellow-500",
  },
};

export default function LowBatteryScreen() {
  const { themeColors, isDark } = useThemeContext();
  const navigate = useNavigate();
  const { alertType = "all_battery" } = useParams();
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
        // Battery-specific fields
        battery_percentage:
          status.battery_percentage || analyticsData.battery_percentage,
        battery_low_count: analyticsData.battery_low_count || 0,
        battery_critical_count: analyticsData.battery_critical_count || 0,
        battery_alert_count: analyticsData.battery_alert_count || 0,
        power_off_count: analyticsData.power_off_count || 0,
        // Real-time battery status
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

  // Sort devices by battery priority
  const sortedDevices = useMemo(() => {
    const getBatteryPriority = (device) => {
      if (device.battery_critical === 1 || device.battery_critical_count > 0)
        return 100;
      if (device.battery_low === 1 || device.battery_low_count > 0) return 80;
      if (
        (device.power_status &&
          String(device.power_status).toLowerCase() === "off") ||
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

      const aBattery = a.battery_percentage || 100;
      const bBattery = b.battery_percentage || 100;
      if (aBattery !== bBattery) return aBattery - bBattery;

      const aTime = a.minutes_since_update || 0;
      const bTime = b.minutes_since_update || 0;
      return aTime - bTime;
    });
  }, [mergedDevices]);

  // Filter devices for battery alerts
  const filteredDevices = useMemo(() => {
    if (!sortedDevices || sortedDevices.length === 0) return [];

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
          return (
            !deviceIsPowerOff &&
            (batteryLow ||
              (batteryPercentage !== null &&
                batteryPercentage > 10 &&
                batteryPercentage <= 20))
          );
        } else if (alertType === "critical") {
          return (
            !deviceIsPowerOff &&
            (batteryCritical ||
              (batteryPercentage !== null &&
                batteryPercentage > 0 &&
                batteryPercentage <= 10))
          );
        } else if (alertType === "power_off") {
          return deviceIsPowerOff;
        } else if (alertType === "all_battery") {
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

  const { title, noData, icon: IconComponent, color } =
    BATTERY_ALERT_TYPE_MAP[alertType] || BATTERY_ALERT_TYPE_MAP.all_battery;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with gradient */}
      <div 
        className={`${isDark ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-white to-gray-50'}`}
      >
        <div className="flex items-center justify-between px-4 pt-11 pb-3">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${isDark 
                ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50' 
                : 'bg-blue-500/10 hover:bg-blue-500/20'
              }
            `}
          >
            <ArrowLeft className="w-6 h-6 text-blue-500" />
          </button>

          {/* Title */}
          <div className="flex-1 flex items-center justify-center mx-4">
            <h1 className={`text-2xl font-bold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h1>
          </div>

          {/* Placeholder for right side */}
          <div className="w-10 h-10" />
        </div>
      </div>

      {/* Divider */}
      <div className={`h-0.5 w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} mb-1`} />

      {/* Search bar */}
      <DeviceHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Content */}
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <IconComponent className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-center text-base font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {noData}
            </p>
            <p className={`text-center text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              All devices have healthy battery levels
            </p>
          </div>
        ) : (
          <div className="space-y-2 px-4 pb-4">
            {filteredDevices.map((device, idx) => (
              <BatteryDeviceCard
                key={device.device_id || device.id || idx}
                device={device}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}