import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoLocationOutline,
  IoTimeOutline,
  IoChevronForward,
  IoWifiOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import { MdRouter } from "react-icons/md";
import { useTheme } from "../../hooks/useThemeContext";
import { getDeviceStatusConfig } from "../../utils/deviceStatusConfig";

export default function DeviceCard({ device, index = 0, tissueOnly = false }) {
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
    navigate(`/admin/device-details`, {
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

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  // Get status configuration
  let statusConfig;
  if (tissueOnly) {
    const status = (device.current_status || "").toLowerCase();
    if (device.current_tamper === true) {
      statusConfig = getDeviceStatusConfig("tamper", device.is_active, isDark);
    } else if (status === "empty") {
      statusConfig = getDeviceStatusConfig("empty", device.is_active, isDark);
    } else if (status === "low") {
      statusConfig = getDeviceStatusConfig("low", device.is_active, isDark);
    } else if (status === "full") {
      statusConfig = getDeviceStatusConfig("full", device.is_active, isDark);
    } else if (["offline", "disconnected", "inactive"].includes(status)) {
      statusConfig = getDeviceStatusConfig("offline", device.is_active, isDark);
    } else if (["normal", "active", "online"].includes(status)) {
      statusConfig = getDeviceStatusConfig("active", device.is_active, isDark);
    } else {
      statusConfig = getDeviceStatusConfig("unknown", device.is_active, isDark);
    }
  } else {
    statusConfig = getDeviceStatusConfig(
      device.current_status,
      device.is_active,
      isDark
    );
  }

  // Get icon component based on status
  const getStatusIcon = () => {
    switch (statusConfig.icon) {
      case "alert-circle-outline":
        return IoAlertCircleOutline;
      case "checkmark-circle-outline":
        return IoCheckmarkCircleOutline;
      case "warning-outline":
        return IoWarningOutline;
      case "close-circle-outline":
        return IoCloseCircleOutline;
      default:
        return IoWifiOutline;
    }
  };

  const StatusIcon = getStatusIcon();

  const lastAlertTime = device.last_alert_time
    ? new Date(device.last_alert_time).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Show real-time activity indicator
  const showActivityIndicator =
    device.is_active &&
    device.minutes_since_update !== null &&
    device.minutes_since_update <= 5;

  return (
    <div
      ref={cardRef}
      className={`transform transition-all duration-400 ease-out mx-4 mb-4 ${
        isAnimated ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div
        onClick={handleCardPress}
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer
          transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
          border border-opacity-30 shadow-md
          ${isDark ? "shadow-black/30" : "shadow-gray-200/80"}
        `}
        style={{
          background: themeColors.surface,
          borderColor: statusConfig.color + "30",
          borderLeftWidth: "4px",
          borderLeftColor: statusConfig.color,
        }}
      >
        {/* Status Gradient Bar */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(to right, ${statusConfig.gradient[0]}, ${statusConfig.gradient[1]})`,
          }}
        />

        {/* Header Section */}
        <div className="flex justify-between items-center p-4 pb-3">
          <div className="flex items-center flex-1">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mr-3 relative"
              style={{
                backgroundColor: isDark
                  ? statusConfig.bgDark
                  : statusConfig.bgLight,
              }}
            >
              <MdRouter size={24} style={{ color: statusConfig.color }} />
            </div>

            <div className="flex-1">
              <h3
                className={`text-lg font-bold mb-1 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {device.device_name ||
                  device.name ||
                  `Device ${device.device_id}`}
              </h3>
              <div className="flex items-center">
                <IoLocationOutline
                  size={12}
                  className={isDark ? "text-gray-400" : "text-gray-600"}
                />
                <span
                  className={`text-sm ml-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Room {device.room_number || device.room || "Unknown"} • Floor{" "}
                  {device.floor_number !== undefined
                    ? device.floor_number
                    : device.floor || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className="flex items-center px-3 py-1.5 rounded-full gap-1"
            style={{
              backgroundColor: isDark
                ? statusConfig.bgDark
                : statusConfig.bgLight,
            }}
          >
            <StatusIcon size={16} style={{ color: statusConfig.color }} />
            <span
              className="text-sm font-semibold"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.text}
            </span>
          </div>
        </div>

        {/* Enhanced Real-time Activity Indicator */}
        {showActivityIndicator && (
          <div
            className="flex items-center mx-4 mb-2 px-3 py-2 rounded-xl gap-2"
            style={{
              backgroundColor: isDark
                ? statusConfig.color + "25"
                : statusConfig.color + "15",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: statusConfig.color }}
            />
            <span
              className={`text-xs font-semibold flex-1 ${
                isDark ? "text-white" : ""
              }`}
              style={{ color: isDark ? "#FFFFFF" : statusConfig.color }}
            >
              {device.current_status === "tamper"
                ? "Tamper Alert • "
                : device.current_status === "empty"
                ? "Empty Alert • "
                : device.current_status === "low"
                ? "Low Level Alert • "
                : device.current_status === "full"
                ? "Full Level • "
                : "Live • "}
              Updated {device.minutes_since_update || 0}m ago
            </span>
            <div className="px-1.5 py-1 rounded-lg">
              {["tamper", "empty"].includes(device.current_status) ? (
                <IoAlertCircleOutline
                  size={12}
                  style={{ color: isDark ? "#FFFFFF" : statusConfig.color }}
                />
              ) : (
                <IoWifiOutline
                  size={12}
                  style={{ color: isDark ? "#FFFFFF" : statusConfig.color }}
                />
              )}
            </div>
          </div>
        )}

        {/* Enhanced Last Activity Section */}
        {lastAlertTime && (
          <div
            className="flex items-center mx-4 mb-4 p-3 rounded-xl border"
            style={{
              backgroundColor: isDark
                ? statusConfig.color + "20"
                : statusConfig.color + "12",
              borderColor: isDark
                ? statusConfig.color + "30"
                : statusConfig.color + "20",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 border"
              style={{
                backgroundColor: isDark
                  ? statusConfig.color + "25"
                  : statusConfig.color + "15",
                borderColor: isDark
                  ? statusConfig.color + "35"
                  : statusConfig.color + "25",
              }}
            >
              <IoTimeOutline
                size={16}
                className={isDark ? "text-gray-400" : "text-gray-700"}
              />
            </div>
            <div className="flex-1">
              <p
                className={`text-xs uppercase tracking-wider mb-0.5 ${
                  isDark ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Last Update
              </p>
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {lastAlertTime}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardPress();
              }}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <span
                className="text-sm font-medium"
                style={{ color: isDark ? "#FFFFFF" : statusConfig.color }}
              >
                View Details
              </span>
              <IoChevronForward
                size={16}
                style={{ color: isDark ? "#FFFFFF" : statusConfig.color }}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Add this CSS to your global styles or as a styled component
const pulseAnimation = `
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

// Optional: If you need to inject the animation styles
export const DeviceCardStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: pulseAnimation }} />
);
