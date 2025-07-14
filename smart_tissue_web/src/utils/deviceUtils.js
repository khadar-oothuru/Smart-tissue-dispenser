// utils/deviceUtils.js

export const DEVICE_STATUS = {
  CRITICAL: "critical",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  UNKNOWN: "unknown",
};

export const STATUS_COLORS = {
  [DEVICE_STATUS.CRITICAL]: "#F87171",
  [DEVICE_STATUS.LOW]: "#FBBF24",
  [DEVICE_STATUS.MEDIUM]: "#60A5FA",
  [DEVICE_STATUS.HIGH]: "#34D399",
  [DEVICE_STATUS.UNKNOWN]: "#9CA3AF",
};

export const getStatusColor = (status) => {
  if (!status) return STATUS_COLORS[DEVICE_STATUS.UNKNOWN];
  return (
    STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS[DEVICE_STATUS.UNKNOWN]
  );
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
        color: isDark ? "#4CAF50" : "#2E7D32",
        bgLight: "#E8F5E9",
        bgDark: isDark ? "#1F2A1F" : "rgba(76, 175, 80, 0.18)",
        icon: "archive",
        text: "Full",
        gradient: isDark ? ["#4CAF50", "#2E7D32"] : ["#4CAF50", "#2E7D32"],
        shadowColor: isDark ? "#4CAF50" : "#2E7D32",
        priority: 70,
      };
    case "battery_critical":
      return {
        color: isDark ? "#FF1744" : "#D50000",
        bgLight: "#FFEBEE",
        bgDark: isDark ? "#2A1F1F" : "rgba(255, 23, 68, 0.18)",
        icon: "battery-alert",
        text: "Battery Critical",
        gradient: isDark ? ["#FF1744", "#D50000"] : ["#FF1744", "#D50000"],
        shadowColor: isDark ? "#FF1744" : "#D50000",
        priority: 85,
      };
    case "battery_low":
      return {
        color: isDark ? "#FFD600" : "#FF9F00",
        bgLight: "#FFFDE7",
        bgDark: isDark ? "#2A2A1F" : "rgba(255, 214, 0, 0.18)",
        icon: "battery-low",
        text: "Battery Low",
        gradient: isDark ? ["#FFD600", "#FF9F00"] : ["#FFD600", "#FF9F00"],
        shadowColor: isDark ? "#FFD600" : "#FF9F00",
        priority: 75,
      };
    case "power_off":
      return {
        color: isDark ? "#757575" : "#616161",
        bgLight: "#EEEEEE",
        bgDark: isDark ? "#252525" : "rgba(117, 117, 117, 0.18)",
        icon: "power",
        text: "Power Off",
        gradient: isDark ? ["#757575", "#616161"] : ["#757575", "#616161"],
        shadowColor: isDark ? "#757575" : "#616161",
        priority: 65,
      };
    case "normal":
      return {
        color: isDark ? "#4CAF50" : "#2E7D32",
        bgLight: "#E8F5E9",
        bgDark: isDark ? "#1F2A1F" : "rgba(76, 175, 80, 0.18)",
        icon: "check-circle",
        text: "Normal",
        gradient: isDark ? ["#4CAF50", "#2E7D32"] : ["#4CAF50", "#2E7D32"],
        shadowColor: isDark ? "#4CAF50" : "#2E7D32",
        priority: 50,
      };
    case "inactive":
    case "offline":
      if (isActive === false) {
        return {
          color: isDark ? "#CFD8DC" : "#90A4AE",
          bgLight: "#ECEFF1",
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
    default:
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
};

export const validateDevice = (deviceData) => {
  const errors = [];

  if (!deviceData.name?.trim()) {
    errors.push("Device name is required");
  }

  if (
    deviceData.floor_number === undefined ||
    deviceData.floor_number === null ||
    isNaN(deviceData.floor_number)
  ) {
    errors.push("Valid floor number is required");
  }

  if (!deviceData.room_number?.trim()) {
    errors.push("Room number is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
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

export const formatDeviceForAPI = (formData) => ({
  name: formData.name?.trim(),
  floor_number: parseInt(formData.floor_number, 10),
  room_number: formData.room_number?.trim(),
});

export const filterDevices = (devices, searchTerm) => {
  if (!Array.isArray(devices) || !searchTerm) return devices || [];

  const lowerSearchTerm = searchTerm.toLowerCase();

  return devices.filter(
    (device) =>
      device.name?.toLowerCase().includes(lowerSearchTerm) ||
      device.room_number?.toString().includes(searchTerm) ||
      device.floor_number?.toString().includes(searchTerm)
  );
};

export const sortDevices = (devices, sortBy = "name") => {
  if (!Array.isArray(devices)) return [];

  return [...devices].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "floor":
        return (a.floor_number || 0) - (b.floor_number || 0);
      case "room":
        return (a.room_number || "").localeCompare(b.room_number || "");
      case "status": {
        const statusOrder = [
          DEVICE_STATUS.CRITICAL,
          DEVICE_STATUS.LOW,
          DEVICE_STATUS.MEDIUM,
          DEVICE_STATUS.HIGH,
          DEVICE_STATUS.UNKNOWN,
        ];
        const aIndex = statusOrder.indexOf(a.status?.toLowerCase()) ?? 4;
        const bIndex = statusOrder.indexOf(b.status?.toLowerCase()) ?? 4;
        return aIndex - bIndex;
      }
      default:
        return 0;
    }
  });
};

export const getDeviceDisplayInfo = (device) => ({
  name: device.name || "Unnamed Device",
  floor: device.floor_number || "N/A",
  room: device.room_number || "N/A",
  lastChanged: device.last_changed || "N/A",
  status: device.status || DEVICE_STATUS.UNKNOWN,
});

export const getSignalStrength = (signalDbm) => {
  if (signalDbm >= -30) return "Excellent";
  if (signalDbm >= -67) return "Good";
  if (signalDbm >= -70) return "Fair";
  if (signalDbm >= -80) return "Weak";
  return "Very Weak";
};

export const generateMockWiFiDevices = (count = 3) => {
  const mockDevices = [];
  for (let i = 1; i <= count; i++) {
    mockDevices.push({
      ssid: `Device_ESP32_${String(i).padStart(3, "0")}`,
      signal: Math.floor(Math.random() * 40) - 80, // -80 to -40 dBm
    });
  }
  return mockDevices;
};

export const handleDeviceOperationResponse = (
  operation,
  success,
  deviceName = ""
) => {
  const messages = {
    add: {
      success: "Device added successfully",
      error: "Failed to add device",
    },
    update: {
      success: "Device updated successfully",
      error: "Failed to update device",
    },
    delete: {
      success: "Device deleted successfully",
      error: "Failed to delete device",
    },
    wifiConnect: {
      success: `Device connected successfully from ${deviceName}!`,
      error: "Failed to connect device via WiFi",
    },
  };

  return {
    title: success ? "Success" : "Error",
    message: success
      ? messages[operation]?.success
      : messages[operation]?.error,
  };
};
