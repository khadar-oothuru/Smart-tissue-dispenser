import { useCallback, useState } from "react";
import { useDeviceStore } from "../store/useDeviceStore";

export const useDeviceOperations = (accessToken, showAlert) => {
  const {
    devices,
    loading,
    error,
    fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    registerDeviceViaWiFi,
    clearError,
  } = useDeviceStore();

  const [refreshing, setRefreshing] = useState(false);
  // Load devices with comprehensive error handling
  const loadDevices = useCallback(async () => {
    if (!accessToken) {
      if (showAlert) {
        showAlert({
          title: "Error",
          message: "No authentication token available",
          icon: "alert-circle",
          action: null,
        });
      }
      return;
    }

    try {
      await fetchDevices(accessToken);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load devices";
      if (showAlert) {
        showAlert({
          title: "Error",
          message: errorMessage,
          icon: "alert-circle",
          action: null,
        });
      }
    }
  }, [accessToken, fetchDevices, showAlert]);

  // Refresh devices
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDevices();
    } catch (_error) {
      // Handle refresh error silently
    } finally {
      setRefreshing(false);
    }
  }, [loadDevices]);

  // Add or update device
  const handleDeviceSubmit = useCallback(
    async (deviceData) => {
      if (!accessToken) {
        if (showAlert) {
          showAlert({
            title: "Error",
            message: "No authentication token available",
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }

      // Validate device data
      if (!deviceData.name || deviceData.name.trim() === "") {
        if (showAlert) {
          showAlert({
            title: "Error",
            message: "Device name is required",
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }

      // Ensure floor_number is a valid number
      const validatedData = {
        ...deviceData,
        name: deviceData.name.trim(),
        room_number: deviceData.room_number?.trim() || "",
        floor_number: parseInt(deviceData.floor_number, 10) || 0,
      };

      // Check if floor_number is still NaN
      if (isNaN(validatedData.floor_number)) {
        if (showAlert) {
          showAlert({
            title: "Error",
            message: "Invalid floor number",
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }
      try {
        await addDevice(accessToken, validatedData);

        // Device added successfully, state is already updated by the store
        // The store will also trigger background refresh for synchronization

        if (showAlert) {
          showAlert({
            title: "Success",
            message: "Device added successfully and synced to dashboard",
            icon: "checkmark-circle",
            action: null,
          });
        }
        return true;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to add device";
        if (showAlert) {
          showAlert({
            title: "Error",
            message: errorMessage,
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }
    },
    [accessToken, addDevice, showAlert]
  );

  // Update existing device
  const handleDeviceUpdate = useCallback(
    async (deviceId, deviceData) => {
      if (!accessToken) {
        if (showAlert) {
          showAlert({
            title: "Error",
            message: "No authentication token available",
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }

      // Validate device data
      if (!deviceData.name || deviceData.name.trim() === "") {
        if (showAlert) {
          showAlert({
            title: "Error",
            message: "Device name is required",
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }

      // Ensure floor_number is a valid number
      const validatedData = {
        ...deviceData,
        name: deviceData.name.trim(),
        room_number: deviceData.room_number?.trim() || "",
        floor_number: parseInt(deviceData.floor_number, 10) || 0,
      };

      if (isNaN(validatedData.floor_number)) {
        if (showAlert) {
          showAlert({
            title: "Error",
            message: "Invalid floor number",
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }
      try {
        await updateDevice(accessToken, deviceId, validatedData);

        // Device updated successfully, state is already updated by the store
        // The store will also trigger background refresh for synchronization

        if (showAlert) {
          showAlert({
            title: "Success",
            message: "Device updated successfully and synced to dashboard",
            icon: "checkmark-circle",
            action: null,
          });
        }
        return true;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to update device";
        if (showAlert) {
          showAlert({
            title: "Error",
            message: errorMessage,
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }
    },
    [accessToken, updateDevice, showAlert]
  ); // Delete device - FIXED VERSION WITH DATA REFRESH
  const handleDeviceDelete = useCallback(
    async (device) => {
      if (!accessToken) {
        throw new Error("No authentication token available");
      }

      if (!device || !device.id) {
        throw new Error("Invalid device data");
      }
      try {
        await deleteDevice(accessToken, device.id);

        // Device deleted successfully, state is already updated by the store
        // The store will also trigger background refresh for synchronization

        return true;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to delete device";
        throw new Error(errorMessage);
      }
    },
    [accessToken, deleteDevice]
  );

  // WiFi Connect function
  const handleWiFiConnect = useCallback(
    async (deviceData) => {
      if (!accessToken) {
        if (showAlert) {
          showAlert({
            title: "Error",
            message: "No authentication token available",
            icon: "alert-circle",
            action: null,
          });
        }
        return false;
      }
      try {
        // Call the updated registerDeviceViaWiFi with full device data
        const result = await registerDeviceViaWiFi(accessToken, deviceData);

        if (result) {
          // Check if device was already registered
          if (result.message === "Device already registered") {
            if (showAlert) {
              showAlert({
                title: "Device Already Registered",
                message: `This device (${result.device.name}) is already registered in the system.`,
                icon: "information-circle",
                action: null,
              });
            }
          } else {
            if (showAlert) {
              showAlert({
                title: "Success",
                message: `Device "${result.name}" has been successfully registered and synced to dashboard!`,
                icon: "checkmark-circle",
                action: null,
              });
            }
          }
          // Device registered successfully, state is already updated by the store
          // The store will also trigger background refresh for synchronization
          return true;
        }

        return false;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to connect device via WiFi";
        if (showAlert) {
          showAlert({
            title: "Error",
            message: errorMessage,
            icon: "wifi-off",
            action: null,
          });
        }
        return false;
      }
    },
    [accessToken, registerDeviceViaWiFi, showAlert]
  );
  // Filter devices based on search term
  const filterDevices = useCallback(
    (searchTerm) => {
      // Ensure devices is always an array
      const deviceList = Array.isArray(devices) ? devices : [];

      let filteredList = deviceList;

      if (searchTerm && searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase().trim();
        filteredList = deviceList.filter((device) => {
          if (!device) return false;

          // Safely check each property
          const nameMatch = device.name?.toLowerCase()?.includes(term) || false;
          const roomMatch =
            device.room_number?.toString()?.toLowerCase()?.includes(term) ||
            false;
          const floorMatch =
            device.floor_number?.toString()?.includes(searchTerm) || false;
          return nameMatch || roomMatch || floorMatch;
        });
      }

      // Sort devices by priority and activity (same logic as DeviceList component)
      return filteredList.sort((a, b) => {
        const getDevicePriorityScore = (device) => {
          const status = device.current_status?.toLowerCase() || "unknown";
          const priority = device.status_priority || 0;

          // Tamper status gets highest priority (100+)
          if (
            status === "tamper" ||
            priority >= 4 ||
            (device.current_tamper && device.tamper_count > 0)
          ) {
            return (
              100 + (device.tamper_count || 0) + (device.low_alert_count || 0)
            );
          }

          // Empty alerts get second highest priority (90+)
          if (
            status === "empty" ||
            priority === 3 ||
            device.current_alert === "EMPTY"
          ) {
            return 90 + (device.low_alert_count || 0);
          }

          // Low alerts get medium priority (80+)
          if (
            status === "low" ||
            priority === 2 ||
            device.low_alert_count > 0 ||
            device.current_alert === "LOW"
          ) {
            return 80 + (device.low_alert_count || 0);
          }

          // Full level status gets good priority (70+)
          if (status === "full" || device.current_alert === "FULL") {
            return 70;
          }

          // Normal/Active/Online devices get normal priority (30-50) with time bonus
          if (
            status === "normal" ||
            status === "active" ||
            status === "online" ||
            priority === 1 ||
            device.is_active === true ||
            device.total_entries > 0
          ) {
            // Bonus for recent activity
            if (
              device.minutes_since_update !== null &&
              device.minutes_since_update <= 5
            ) {
              return 50; // Recently active
            } else if (
              device.minutes_since_update !== null &&
              device.minutes_since_update <= 30
            ) {
              return 45; // Moderately active
            }
            return 30; // Active but not recent
          }

          // Inactive/Offline devices get lowest priority (0-10)
          if (
            status === "inactive" ||
            status === "offline" ||
            device.is_active === false
          ) {
            return status === "inactive" ? 5 : 10;
          }

          // Unknown status gets minimal priority
          return 1;
        };

        // Get priority scores for both devices
        const scoreA = getDevicePriorityScore(a);
        const scoreB = getDevicePriorityScore(b);

        // Sort by priority score (highest first)
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        // For devices with same priority, sort by recent activity
        const timeA = a.minutes_since_update || 999;
        const timeB = b.minutes_since_update || 999;

        // More recent activity (lower minutes) comes first
        return timeA - timeB;
      });
    },
    [devices]
  );

  return {
    devices: Array.isArray(devices) ? devices : [],
    loading,
    error,
    refreshing,

    loadDevices,
    onRefresh,
    handleDeviceSubmit,
    handleDeviceUpdate,
    handleDeviceDelete,
    handleWiFiConnect,
    filterDevices,
    clearError,
  };
};
