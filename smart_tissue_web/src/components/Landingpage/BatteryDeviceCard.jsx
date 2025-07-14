import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiClock,
  FiChevronRight,
  FiPower,
  FiWifi,
} from "react-icons/fi";
import {
  MdBattery0Bar,
  MdBattery20,
  MdBattery30,
  MdBattery50,
  MdBattery60,
  MdBattery80,
  MdBatteryFull,
  MdBatteryAlert,
  MdPowerOff,
} from "react-icons/md";
import { useTheme } from "../../hooks/useThemeContext";
import {
  getDeviceStatusConfig,
  getBatteryAlertConfig,
} from "../../utils/deviceStatusConfig";
import "react-day-picker/style.css";
import "./styles/BatteryDeviceCard.css";

const getBatteryIcon = (percentage, status) => {
  if (status.includes("power_off")) return MdPowerOff;
  if (status.includes("battery_off") || percentage === 0) return MdBattery0Bar;
  if (status.includes("battery_critical") || percentage <= 10)
    return MdBatteryAlert;
  if (percentage <= 20) return MdBattery20;
  if (percentage <= 30) return MdBattery30;
  if (percentage <= 50) return MdBattery50;
  if (percentage <= 60) return MdBattery60;
  if (percentage <= 80) return MdBattery80;
  return MdBatteryFull;
};

export default function BatteryDeviceCard({ device, index = 0 }) {
  const { themeColors, isDark } = useTheme();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Navigation handler
  const handleCardPress = () => {
    // Always use a valid device id (string), fallback to device.id or device.device_id
    const id = device.device_id || device.id;
    if (!id) {
      alert("Device ID is missing. Cannot show details.");
      return;
    }
    navigate("/admin/device-details", {
      state: {
        deviceId: String(id),
        deviceName: device.device_name || device.name || `Device ${id}`,
        deviceStatus: device.current_status || "unknown",
        isActive: device.is_active?.toString() || "false",
        room: device.room_number || device.room || "Unknown",
        floor:
          device.floor_number !== undefined
            ? device.floor_number.toString()
            : device.floor || "N/A",
      },
    });
  };

  // Animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, index * 50);

    return () => clearTimeout(timer);
  }, [index]);

  // Get battery-specific device status
  const batteryStatusList = [];

  if (
    device.power_off_count > 0 ||
    device.power_status === null ||
    device.power_status === undefined ||
    ["off", "no", "none", "", "0", "false"].includes(
      String(device.power_status).trim().toLowerCase()
    )
  ) {
    batteryStatusList.push("power_off");
  }

  if (
    device.battery_percentage !== null &&
    device.battery_percentage !== undefined
  ) {
    if (device.battery_percentage === 0) {
      batteryStatusList.push("battery_off");
    } else if (
      device.battery_percentage > 0 &&
      device.battery_percentage <= 10
    ) {
      batteryStatusList.push("battery_critical");
    } else if (
      device.battery_percentage > 10 &&
      device.battery_percentage <= 20
    ) {
      batteryStatusList.push("battery_low");
    }
  } else if (
    device.battery_critical === 1 ||
    device.battery_critical_count > 0
  ) {
    batteryStatusList.push("battery_critical");
  } else if (device.battery_low === 1 || device.battery_low_count > 0) {
    batteryStatusList.push("battery_low");
  }

  if (!device.is_active) {
    batteryStatusList.push("inactive");
  }

  if (batteryStatusList.length === 0 && device.is_active === true) {
    batteryStatusList.push("normal");
  }

  if (batteryStatusList.length === 0) {
    batteryStatusList.push("unknown");
  }

  const batteryConfig = getDeviceStatusConfig(
    batteryStatusList,
    device.is_active,
    isDark
  );

  const handleViewDetails = () => {
    try {
      const id = device.device_id || device.id;
      if (!id) {
        alert("Device ID is missing. Cannot show details.");
        return;
      }
      navigate("/admin/device-details", {
        state: {
          deviceId: String(id),
          deviceName: device.device_name || device.name || `Device ${id}`,
          deviceStatus: device.current_status || "unknown",
          isActive: device.is_active?.toString() || "false",
          room: device.room_number || device.room || "Unknown",
          floor:
            device.floor_number !== undefined
              ? device.floor_number.toString()
              : device.floor || "N/A",
        },
      });
    } catch (_error) {
      alert(
        `Battery Device Details\n\nDevice: ${
          device.device_name ||
          device.name ||
          `Device ${device.device_id || device.id}`
        }\nBattery: ${device.battery_percentage || "N/A"}%\nStatus: ${
          device.current_status || "Unknown"
        }\nRoom: ${device.room_number || device.room || "Unknown"}\nFloor: ${
          device.floor_number !== undefined
            ? device.floor_number
            : device.floor || "N/A"
        }`
      );
    }
  };

  const lastAlertTime = device.last_alert_time
    ? new Date(device.last_alert_time).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const showActivityIndicator =
    device.is_active &&
    device.minutes_since_update !== null &&
    device.minutes_since_update <= 5;

  const BatteryIcon = getBatteryIcon(
    device.battery_percentage,
    batteryStatusList
  );

  return (
    <div
      ref={cardRef}
      className={`
        mx-4 mb-4 transform transition-all duration-[400ms]
        ${isAnimated ? "opacity-100 scale-100" : "opacity-0 scale-95"}
      `}
      style={{
        transitionDelay: `${index * 50}ms`,
      }}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl border-l-4 border cursor-pointer
          shadow-lg hover:shadow-xl transition-shadow duration-300
          ${isDark ? "shadow-black/30" : "shadow-black/8"}
        `}
        onClick={handleCardPress}
        style={{
          borderColor: `${batteryConfig.color}30`,
          borderLeftColor: batteryConfig.color,
          backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
        }}
      >
        {/* Status Gradient Bar */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${batteryConfig.gradient[0]}, ${batteryConfig.gradient[1]})`,
          }}
        />

        {/* Header Section */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center flex-1">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mr-3"
              style={{
                backgroundColor: isDark
                  ? batteryConfig.bgDark
                  : batteryConfig.bgLight,
              }}
            >
              <BatteryIcon size={24} color={batteryConfig.color} />
            </div>

            <div className="flex-1">
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: themeColors.heading }}
              >
                {device.device_name ||
                  device.name ||
                  `Device ${device.device_id}`}
              </h3>
              <div className="flex items-center">
                <FiMapPin size={12} color={themeColors.text} />
                <span
                  className="text-sm ml-1"
                  style={{ color: themeColors.text }}
                >
                  Room {device.room_number || device.room || "Unknown"} • Floor{" "}
                  {device.floor_number !== undefined
                    ? device.floor_number
                    : device.floor || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Battery Status Badge */}
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: isDark
                ? batteryConfig.bgDark
                : batteryConfig.bgLight,
            }}
          >
            <BatteryIcon size={16} color={batteryConfig.color} />
            <span
              className="text-sm font-semibold"
              style={{ color: batteryConfig.color }}
            >
              {batteryConfig.text}
            </span>
          </div>
        </div>

        {/* Battery Level Display */}
        <div
          className="mx-4 mb-2 p-3 rounded-xl border"
          style={{
            backgroundColor: isDark
              ? `${batteryConfig.color}26`
              : `${batteryConfig.color}14`,
            borderColor: isDark
              ? `${batteryConfig.color}40`
              : `${batteryConfig.color}33`,
          }}
        >
          <div className="flex items-center mb-2">
            <BatteryIcon size={20} color={batteryConfig.color} />
            <span
              className="text-base font-bold ml-2"
              style={{ color: batteryConfig.color }}
            >
              {device.battery_percentage !== null
                ? `${device.battery_percentage}%`
                : "N/A"}
            </span>
          </div>
          {device.battery_percentage !== null && (
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                backgroundColor: isDark ? themeColors.surface : "#E5E7EB",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, device.battery_percentage)}%`,
                  backgroundColor: batteryConfig.color,
                }}
              />
            </div>
          )}
        </div>

        {/* Enhanced Real-time Activity Indicator */}
        {showActivityIndicator && (
          <div
            className="flex items-center gap-2 mx-4 mb-2 px-3 py-2 rounded-xl"
            style={{
              backgroundColor: isDark
                ? `${batteryConfig.color}40`
                : `${batteryConfig.color}26`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                backgroundColor: batteryConfig.color,
              }}
            />
            <span
              className="text-xs font-semibold flex-1"
              style={{
                color: isDark ? "#FFFFFF" : batteryConfig.color,
              }}
            >
              {batteryConfig.text === "Power Off"
                ? "Power Off • "
                : batteryConfig.text === "Critical Battery"
                ? "Critical Battery • "
                : batteryConfig.text === "Low Battery"
                ? "Low Battery • "
                : "Live • "}
              Updated {device.minutes_since_update || 0}m ago
            </span>
            <div className="px-1.5 py-1 rounded-lg">
              {batteryConfig.text === "Power Off" ? (
                <FiPower
                  size={12}
                  color={isDark ? "#FFFFFF" : batteryConfig.color}
                />
              ) : (
                <FiWifi
                  size={12}
                  color={isDark ? "#FFFFFF" : batteryConfig.color}
                />
              )}
            </div>
          </div>
        )}

        {/* Battery Alert Counts: Removed battery_low_count display as requested */}
        {device.power_off_count > 0 && (
          <div
            className="mx-4 mb-2 p-3 rounded-xl border"
            style={{
              backgroundColor: isDark
                ? `${batteryConfig.color}33`
                : `${batteryConfig.color}1F`,
              borderColor: isDark
                ? `${batteryConfig.color}4D`
                : `${batteryConfig.color}33`,
            }}
          >
            <div className="flex flex-wrap gap-3">
              {(() => {
                const alertCfg = getBatteryAlertConfig("power_off", isDark);
                return (
                  <div className="flex items-center gap-1">
                    <MdPowerOff size={14} color={alertCfg.color} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: themeColors.text }}
                    >
                      {device.power_off_count} {alertCfg.label}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Enhanced Last Activity Section */}
        {lastAlertTime && (
          <div
            className="flex items-center mx-4 mb-4 p-3 rounded-xl border"
            style={{
              backgroundColor: isDark
                ? `${batteryConfig.color}33`
                : `${batteryConfig.color}1F`,
              borderColor: isDark
                ? `${batteryConfig.color}4D`
                : `${batteryConfig.color}33`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 border"
              style={{
                backgroundColor: isDark
                  ? `${batteryConfig.color}40`
                  : `${batteryConfig.color}26`,
                borderColor: isDark
                  ? `${batteryConfig.color}59`
                  : `${batteryConfig.color}40`,
              }}
            >
              <FiClock
                size={16}
                color={isDark ? "#B0B0B0" : themeColors.text}
              />
            </div>
            <div className="flex-1">
              <span
                className="text-[11px] uppercase tracking-wider block mb-0.5"
                style={{ color: isDark ? "#888888" : themeColors.text }}
              >
                Last update
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: isDark ? "#FFFFFF" : themeColors.heading }}
              >
                {lastAlertTime}
              </span>
            </div>
            <button
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: isDark ? "#FFFFFF" : batteryConfig.color }}
              >
                View Details
              </span>
              <FiChevronRight
                size={16}
                color={isDark ? "#FFFFFF" : batteryConfig.color}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
