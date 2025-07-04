/**
 * Merge devices with analytics and realtime status by device_id
 * @param {Array} devices
 * @param {Array} analytics
 * @param {Array} realtimeStatus
 * @returns {Array} merged devices
 */
export function mergeDevicesWithAnalyticsAndStatus(
  devices = [],
  analytics = [],
  realtimeStatus = []
) {
  // Convert analytics and realtimeStatus to maps for fast lookup
  const analyticsMap = new Map((analytics || []).map((a) => [a.device_id, a]));
  const statusMap = new Map(
    (realtimeStatus || []).map((s) => [s.device_id, s])
  );
  return (devices || []).map((device) => {
    const id = device.device_id || device.id;
    return {
      ...device,
      ...(analyticsMap.get(id) || {}),
      ...(statusMap.get(id) || {}),
    };
  });
}
/**
 * Get battery alert config for alert counts (critical, low, power_off)
 * Returns icon, color, and label for each alert type
 */
export const getBatteryAlertConfig = (alertType, isDark) => {
  switch (alertType) {
    case "critical":
      return {
        icon: "battery-alert",
        color: isDark ? "#FF1744" : "#D50000",
        label: "Critical",
      };
    case "low":
      return {
        icon: "battery-low",
        color: isDark ? "#FFD600" : "#FF9F00",
        label: "Low",
      };
    case "power_off":
      return {
        icon: "power",
        color: isDark ? "#757575" : "#757575", // Gray for Power Off
        label: "Power Off",
      };
    default:
      return {
        icon: "help-circle",
        color: isDark ? "#B0BEC5" : "#607D8B",
        label: "Unknown",
      };
  }
};

/**
 * Get battery-specific device status (for battery-focused screens)
 * Only considers battery and power-related statuses, not tissue alerts
 */
export const getBatteryDeviceStatus = (device) => {
  if (!device) return "unknown";

  // Enhanced power off detection logic
  const isPowerOff = (powerStatus) => {
    if (powerStatus === null || powerStatus === undefined) return true;
    const status = String(powerStatus).trim().toLowerCase();
    return ["off", "no", "none", "", "0", "false"].includes(status);
  };

  // Check for battery alerts first (highest priority for battery screens)
  if (device.battery_critical === 1 || device.battery_critical_count > 0) {
    return "battery_critical";
  }

  if (device.battery_low === 1 || device.battery_low_count > 0) {
    return "battery_low";
  }

  // Check for power status
  if (isPowerOff(device.power_status) || device.power_off_count > 0) {
    return "power_off";
  }

  // Check for battery percentage thresholds - Updated: 0% = battery off, 1-10% = critical, 11-20% = low
  if (
    device.battery_percentage !== null &&
    device.battery_percentage !== undefined
  ) {
    if (device.battery_percentage === 0) {
      return "battery_off";
    }
    if (device.battery_percentage > 0 && device.battery_percentage <= 10) {
      return "battery_critical";
    }
    if (device.battery_percentage > 10 && device.battery_percentage <= 20) {
      return "battery_low";
    }
  }

  // Check for connection status
  if (!device.is_active) {
    return "inactive";
  }

  // Check current status from backend (only battery/power related)
  if (device.current_status) {
    const status = device.current_status.toLowerCase();
    if (status === "offline" || status === "disconnected") {
      return "inactive";
    }
    if (status === "power_off") {
      return "power_off";
    }
    if (status === "battery_critical") {
      return "battery_critical";
    }
    if (status === "battery_low") {
      return "battery_low";
    }
    if (status === "normal" || status === "active" || status === "online") {
      return "normal";
    }
  }

  // Default to normal if device is active
  if (device.is_active === true) {
    return "normal";
  }

  return "unknown";
};

/**
 * Get overall device status based on all status indicators
 * Determines the most critical status for display purposes
 * Includes tissue alerts for general device status
 */
export const getOverallDeviceStatus = (device) => {
  if (!device) return "unknown";

  // Enhanced power off detection logic
  const isPowerOff = (powerStatus) => {
    if (powerStatus === null || powerStatus === undefined) return true;
    const status = String(powerStatus).trim().toLowerCase();
    return ["off", "no", "none", "", "0", "false"].includes(status);
  };

  // Check for tamper alerts first (highest priority)
  if (device.current_tamper === true || device.tamper_count > 0) {
    return "tamper";
  }

  // Check for tissue alerts (EMPTY, LOW, FULL)
  if (device.current_status === "empty" || device.current_alert === "EMPTY") {
    return "empty";
  }

  if (device.current_status === "low" || device.current_alert === "LOW") {
    return "low";
  }

  if (device.current_status === "full" || device.current_alert === "FULL") {
    return "full";
  }

  // Check for battery alerts
  if (device.battery_critical === 1 || device.battery_critical_count > 0) {
    return "battery_critical";
  }

  if (device.battery_low === 1 || device.battery_low_count > 0) {
    return "battery_low";
  }

  // Check for power status
  if (isPowerOff(device.power_status) || device.power_off_count > 0) {
    return "power_off";
  }

  // Check for battery percentage thresholds - Updated: 0% = battery off, 1-10% = critical, 11-20% = low
  if (
    device.battery_percentage !== null &&
    device.battery_percentage !== undefined
  ) {
    if (device.battery_percentage === 0) {
      return "battery_off";
    }
    if (device.battery_percentage > 0 && device.battery_percentage <= 10) {
      return "battery_critical";
    }
    if (device.battery_percentage > 10 && device.battery_percentage <= 20) {
      return "battery_low";
    }
  }

  // Check for connection status
  if (!device.is_active) {
    return "inactive";
  }

  // Check current status from backend
  if (device.current_status) {
    const status = device.current_status.toLowerCase();
    if (status === "offline" || status === "disconnected") {
      return "inactive";
    }
    if (status === "normal" || status === "active" || status === "online") {
      return "normal";
    }
    // Return the current status if it's not handled above
    return device.current_status;
  }

  // Default to normal if device is active
  if (device.is_active === true) {
    return "normal";
  }

  return "unknown";
};

/**
 * Device Status Configuration Utility
 * Contains all status configurations for device cards including colors, icons, and gradients
 */

export const getDeviceStatusConfig = (status, isActive, isDark) => {
  // Support for combo status: if status includes power_off, always use power_off config (grey)
  // Accepts status as string or array (for future-proofing)
  let normalizedStatus = status;
  if (Array.isArray(status)) {
    // If any status is power_off, use that
    if (status.includes("power_off")) {
      normalizedStatus = "power_off";
    } else if (status.includes("battery_critical")) {
      normalizedStatus = "battery_critical";
    } else if (status.includes("battery_low")) {
      normalizedStatus = "battery_low";
    } else if (status.includes("tamper")) {
      normalizedStatus = "tamper";
    } else if (status.includes("empty")) {
      normalizedStatus = "empty";
    } else if (status.includes("low")) {
      normalizedStatus = "low";
    } else if (status.includes("full")) {
      normalizedStatus = "full";
    } else if (status.includes("inactive")) {
      normalizedStatus = "inactive";
    } else if (status.includes("offline")) {
      normalizedStatus = "offline";
    } else if (status.includes("normal")) {
      normalizedStatus = "normal";
    } else {
      normalizedStatus = status[0];
    }
  } else {
    // Safely handle undefined/null status
    normalizedStatus = status ? String(status).toLowerCase() : "unknown";
  }

  switch (normalizedStatus) {
    case "tamper":
      return {
        color: isDark ? "#8B5CF6" : "#7C3AED",
        bgLight: "#F3E8FF",
        bgDark: isDark ? "#2A1F2A" : "rgba(139, 92, 246, 0.18)",
        icon: "shield-off-outline",
        text: "Tamper Alert",
        gradient: isDark ? ["#8B5CF6", "#7C3AED"] : ["#8B5CF6", "#7C3AED"],
        shadowColor: isDark ? "#8B5CF6" : "#7C3AED",
        priority: 100, // Highest priority
      };
    case "empty":
      return {
        color: isDark ? "#EF4444" : "#DC2626",
        bgLight: "#FEF2F2",
        bgDark: isDark ? "#2A1F1F" : "rgba(239, 68, 68, 0.18)",
        icon: "close-circle",
        text: "Empty",
        gradient: isDark ? ["#EF4444", "#DC2626"] : ["#EF4444", "#DC2626"],
        shadowColor: isDark ? "#EF4444" : "#DC2626",
        priority: 90,
      };
    case "low":
      return {
        color: isDark ? "#FFA726" : "#FF9800",
        bgLight: "#FFF3E0",
        bgDark: isDark ? "#2A1F1A" : "rgba(255, 167, 38, 0.18)",
        icon: "archive-outline",
        text: "Low",
        gradient: isDark ? ["#FFA726", "#FF9800"] : ["#FFA726", "#FF9800"],
        shadowColor: isDark ? "#FFA726" : "#FF9800",
        priority: 80,
      };
    case "full":
      return {
        color: isDark ? "#A5D6A7" : "#4CAF50",
        bgLight: "#E8F5E9",
        bgDark: isDark ? "#1F2A20" : "rgba(165, 214, 167, 0.18)",
        icon: "archive",
        text: "Full",
        gradient: isDark ? ["#A5D6A7", "#66BB6A"] : ["#66BB6A", "#4CAF50"],
        shadowColor: isDark ? "#A5D6A7" : "#4CAF50",
        priority: 70,
      };

    case "battery_critical":
      return {
        color: isDark ? "#FF9F00" : "#FF9F00", // Changed to orange
        bgLight: "#FFF7E5",
        bgDark: isDark ? "#2A1F1A" : "rgba(255, 159, 0, 0.18)",
        icon: "battery-alert",
        text: "Critical Battery",
        gradient: isDark ? ["#FF9F00", "#FFB300"] : ["#FF9F00", "#FFB300"],
        shadowColor: isDark ? "#FF9F00" : "#FF9F00",
        priority: 95,
      };
    case "battery_low":
      return {
        color: isDark ? "#FFD600" : "#FFEA00",
        bgLight: "#FFFDE7",
        bgDark: isDark ? "#2A2A1F" : "rgba(255, 214, 0, 0.18)",
        icon: "battery-low",
        text: "Low Battery",
        gradient: isDark ? ["#FFD600", "#FFEA00"] : ["#FFD600", "#FFEA00"],
        shadowColor: isDark ? "#FFD600" : "#FFEA00",
        priority: 85,
      };
    case "battery_off":
      return {
        color: isDark ? "#8B5CF6" : "#8B5CF6", // Purple for Battery Off (0%)
        bgLight: "#F3E8FF",
        bgDark: isDark ? "#2A1F2A" : "rgba(139, 92, 246, 0.18)",
        icon: "battery-off",
        text: "Battery Off",
        gradient: isDark ? ["#8B5CF6", "#7C3AED"] : ["#8B5CF6", "#7C3AED"],
        shadowColor: isDark ? "#8B5CF6" : "#8B5CF6",
        priority: 75,
      };
    case "power_off":
      return {
        color: isDark ? "#FF3B30" : "#FF3B30", // Red for Power Off
        bgLight: "#FFE5E5",
        bgDark: isDark ? "#2A1F1F" : "rgba(255, 59, 48, 0.18)",
        icon: "power",
        text: "Power Off",
        gradient: ["#FF3B30", "#FF3B30"],
        shadowColor: "#FF3B30",
        priority: 70,
      };

    case "normal":
    case "active":
    case "online":
      return {
        color: isDark ? "#A5D6A7" : "#4CAF50",
        bgLight: "#E8F5E9",
        bgDark: isDark ? "#1F2A20" : "rgba(165, 214, 167, 0.18)",
        icon: "check-circle",
        text: "Online",
        gradient: isDark ? ["#A5D6A7", "#66BB6A"] : ["#66BB6A", "#4CAF50"],
        shadowColor: isDark ? "#A5D6A7" : "#4CAF50",
        priority: 50,
      };

    case "inactive":
    case "offline":
    case "disconnected":
      return {
        color: isDark ? "#CFD8DC" : "#757575",
        bgLight: "#FAFAFA",
        bgDark: isDark ? "#252829" : "rgba(207, 216, 220, 0.18)",
        icon: "wifi-off",
        text: "Offline",
        gradient: isDark ? ["#CFD8DC", "#B0BEC5"] : ["#9E9E9E", "#757575"],
        shadowColor: isDark ? "#CFD8DC" : "#757575",
        priority: 10,
      };

    default:
      if (isActive === true) {
        return {
          color: isDark ? "#A5D6A7" : "#4CAF50",
          bgLight: "#E8F5E9",
          bgDark: isDark ? "#1F2A20" : "rgba(165, 214, 167, 0.18)",
          icon: "check-circle",
          text: "Active",
          gradient: isDark ? ["#A5D6A7", "#66BB6A"] : ["#66BB6A", "#4CAF50"],
          shadowColor: isDark ? "#A5D6A7" : "#4CAF50",
          priority: 45,
        };
      } else if (isActive === false) {
        return {
          color: isDark ? "#CFD8DC" : "#757575",
          bgLight: "#FAFAFA",
          bgDark: isDark ? "#252829" : "rgba(207, 216, 220, 0.18)",
          icon: "wifi-off",
          text: "Inactive",
          gradient: isDark ? ["#CFD8DC", "#B0BEC5"] : ["#9E9E9E", "#757575"],
          shadowColor: isDark ? "#CFD8DC" : "#757575",
          priority: 5,
        };
      } else {
        return {
          color: isDark ? "#B0BEC5" : "#607D8B",
          bgLight: "#ECEFF1",
          bgDark: "rgba(144, 164, 174, 0.15)",
          icon: "help-circle",
          text: "Unknown",
          gradient: ["#90A4AE", "#607D8B"],
          shadowColor: "#607D8B",
          priority: 1,
        };
      }
  }
};

/**
 * Get connection status color based on minutes since last update
 */
export const getConnectionStatusColor = (minutesSinceUpdate) => {
  if (minutesSinceUpdate !== null && minutesSinceUpdate !== undefined) {
    if (minutesSinceUpdate <= 5) {
      return "#4CAF50";
    } else if (minutesSinceUpdate <= 30) {
      return "#FFA726";
    } else {
      return "#FF4444";
    }
  }

  return "#9E9E9E";
};

export const STATUS_PRIORITIES = {
  TAMPER: 100,
  EMPTY: 90,
  LOW: 80,
  FULL: 70,
  NORMAL: 50,
  ACTIVE: 45,
  OFFLINE: 10,
  INACTIVE: 5,
  UNKNOWN: 1,
};

/**
 * Returns true if the device is in a tissue alert state (empty, low, tamper, full)
 */
export function isTissueAlert(device) {
  if (!device) return false;
  const status = (device.current_status || "").toLowerCase();
  return (
    status === "empty" ||
    status === "low" ||
    status === "full" ||
    device.current_tamper === true
  );
}

/**
 * Returns true if the device is in a battery or power alert state (battery_critical, battery_low, power_off)
 */
export function isBatteryAlert(device) {
  if (!device) return false;
  // Check battery critical/low flags or power off
  if (
    device.battery_critical === 1 ||
    device.battery_critical_count > 0 ||
    device.battery_low === 1 ||
    device.battery_low_count > 0 ||
    device.power_off_count > 0
  ) {
    return true;
  }
  // Check battery percentage
  if (
    typeof device.battery_percentage === "number" &&
    device.battery_percentage <= 20
  ) {
    return true;
  }
  // Check power status
  const isPowerOff = (powerStatus) => {
    if (powerStatus === null || powerStatus === undefined) return true;
    const status = String(powerStatus).trim().toLowerCase();
    return ["off", "no", "none", "", "0", "false"].includes(status);
  };
  if (isPowerOff(device.power_status)) return true;
  // Check current_status for battery-related states
  const status = (device.current_status || "").toLowerCase();
  return (
    status === "battery_critical" ||
    status === "battery_low" ||
    status === "power_off"
  );
}
