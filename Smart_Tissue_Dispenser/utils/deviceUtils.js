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
