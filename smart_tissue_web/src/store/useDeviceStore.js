import { create } from "zustand";

import {
  fetchDevices as apiFetchDevices,
  addDevice as apiAddDevice,
  updateDevice as apiUpdateDevice,
  deleteDevice as apiDeleteDevice,
  fetchAllDeviceData as apiFetchAllDeviceData,
  fetchDeviceDataById as apiFetchDeviceDataById,
  fetchNotifications as apiFetchNotifications,
  registerPushToken as apiRegisterPushToken,
  registerDeviceViaWiFi as apiRegisterDeviceViaWiFi,
  fetchDeviceAnalytics as apiFetchDeviceAnalytics,
  fetchTimeBasedAnalytics as apiFetchTimeBasedAnalytics,
  downloadAnalytics as apiDownloadAnalytics,
  fetchSummaryAnalytics as apiFetchSummaryAnalytics,
  fetchDeviceRealtimeStatus as apiFetchDeviceRealtimeStatus,
  fetchDeviceStatusSummary as apiFetchDeviceStatusSummary,
  fetchDeviceStatusDistribution as apiFetchDeviceStatusDistribution,
  checkDeviceStatus as apiCheckDeviceStatus,
  updateDeviceStatus as apiUpdateDeviceStatus,
  fetchBatteryUsageAnalytics as apiFetchBatteryUsageAnalytics,
  fetchBatteryUsageTrends as apiFetchBatteryUsageTrends,
  downloadCSVAnalytics as apiDownloadCSVAnalytics,
  downloadJSONAnalytics as apiDownloadJSONAnalytics,
  downloadPDFAnalytics as apiDownloadPDFAnalytics,
} from "../services/api.js";

// Helper function to store data in localStorage
const storeData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error storing data:", error);
  }
};

// Helper function to get data from localStorage
const getData = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Error retrieving data:", error);
    return null;
  }
};

const useDeviceStore = create((set, get) => ({
  // State - Initialize with safe defaults
  devices: [],
  deviceData: {},
  notifications: [],
  loading: false,
  error: null,
  operationMessage: null,
  analytics: [],
  timeBasedData: null,
  summaryData: null,
  analyticsLoading: false,
  analyticsError: null,
  // New state for real-time status
  realtimeStatus: [],
  statusSummary: null,
  realtimeLoading: false,
  realtimeError: null,
  // New state for status distribution
  statusDistribution: null,
  distributionLoading: false,
  distributionError: null,
  // New state for battery analytics
  batteryUsageData: null,
  batteryTrendsData: null,
  batteryAnalyticsLoading: false,
  batteryAnalyticsError: null,
  // Timestamp for last data update - helps with debugging synchronization
  lastDataUpdate: null,

  // Actions
  fetchDevices: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false, devices: [] });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      const response = await apiFetchDevices(token);

      // Ensure devices is always an array
      let devices = [];

      if (Array.isArray(response)) {
        devices = response;
      } else if (
        response &&
        response.results &&
        Array.isArray(response.results)
      ) {
        // Handle paginated response format
        devices = response.results;
      } else if (
        response &&
        response.devices &&
        Array.isArray(response.devices)
      ) {
        devices = response.devices;
      } else if (response && response.data && Array.isArray(response.data)) {
        devices = response.data;
      } else {
        devices = [];
      }
      set({
        devices,
        loading: false,
        error: null,
        lastDataUpdate: new Date().toISOString(),
      });

      // Cache devices data
      storeData("devices", devices);

      return devices;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch devices";

      set({
        error: errorMessage,
        loading: false,
        devices: [], // Reset devices to empty array on error
      });
      throw err;
    }
  },
  addDevice: async (token, deviceData) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false });
      throw new Error(error);
    }

    // Validate device data
    if (!deviceData || !deviceData.name) {
      const error = "Invalid device data: name is required";
      set({ error, loading: false });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      const newDevice = await apiAddDevice(token, deviceData);

      console.log("🔍 Store: API Response for new device:", newDevice);
      console.log("🔍 Store: Original deviceData:", deviceData);

      // Create analytics entry for the new device with enhanced fallback logic
      const newAnalyticsEntry = {
        id: newDevice.id,
        device_id: newDevice.id,
        // Device name with multiple fallbacks
        device_name:
          newDevice.name || deviceData.name || `Device ${newDevice.id}`,
        name: newDevice.name || deviceData.name || `Device ${newDevice.id}`,
        // Room and floor with proper fallbacks
        room_number:
          newDevice.room_number !== undefined
            ? newDevice.room_number
            : deviceData.room_number !== undefined
            ? deviceData.room_number
            : "",
        floor_number:
          newDevice.floor_number !== undefined
            ? newDevice.floor_number
            : deviceData.floor_number !== undefined
            ? deviceData.floor_number
            : 0,
        // Additional device properties with fallbacks
        location: newDevice.location || deviceData.location || "",
        description: newDevice.description || deviceData.description || "",
        device_type:
          newDevice.device_type || deviceData.device_type || "dispenser",
        tissue_type:
          newDevice.tissue_type || deviceData.tissue_type || "hand_towel",
        meter_capacity:
          newDevice.meter_capacity || deviceData.meter_capacity || 500,
        // Status fields
        is_active:
          newDevice.is_active !== undefined ? newDevice.is_active : false,
        current_status: newDevice.current_status || "unknown",
        // Analytics fields
        total_entries: 0,
        recent_entries_24h: 0,
        last_activity: null,
        minutes_since_update: null,
        status_priority: 0,
        // Timestamps
        created_at: newDevice.created_at || new Date().toISOString(),
        updated_at: newDevice.updated_at || new Date().toISOString(), // Spread remaining device properties but key fields will override
        ...newDevice,
      };

      // Log the final analytics entry to verify data integrity
      console.log(
        "✅ Store: Final analytics entry being added:",
        JSON.stringify(newAnalyticsEntry, null, 2)
      );

      // Create real-time status entry for immediate visibility
      const newRealtimeEntry = {
        device_id: newDevice.id,
        is_active: false,
        current_status: "unknown",
        minutes_since_update: null,
        last_update: new Date().toISOString(),
      };
      set((state) => ({
        devices: [newDevice, ...state.devices],
        analytics: [newAnalyticsEntry, ...state.analytics],
        realtimeStatus: [newRealtimeEntry, ...state.realtimeStatus],
        loading: false,
        error: null,
        operationMessage: "Device added successfully",
        lastDataUpdate: new Date().toISOString(),
      }));
      console.log("✅ Store: New device added to analytics:", {
        device_id: newAnalyticsEntry.device_id,
        device_name: newAnalyticsEntry.device_name,
        name: newAnalyticsEntry.name,
        room_number: newAnalyticsEntry.room_number,
        floor_number: newAnalyticsEntry.floor_number,
        tissue_type: newAnalyticsEntry.tissue_type,
        meter_capacity: newAnalyticsEntry.meter_capacity,
        is_active: newAnalyticsEntry.is_active,
        current_status: newAnalyticsEntry.current_status,
      });

      return newDevice;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to add device";

      set({
        error: errorMessage,
        loading: false,
        operationMessage: "Failed to add device",
      });
      throw err;
    }
  },
  updateDevice: async (token, id, data) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false });
      throw new Error(error);
    }

    if (!id || !data) {
      const error = "Invalid update parameters";
      set({ error, loading: false });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      const updatedDevice = await apiUpdateDevice(token, id, data);

      // Update device in all relevant state arrays to maintain synchronization
      set((state) => ({
        devices: state.devices.map((d) => (d.id === id ? updatedDevice : d)),
        analytics: state.analytics.map((d) => {
          if (d.device_id === id || d.id === id) {
            return {
              ...d,
              ...updatedDevice,
              id: d.id || id,
              device_id: d.device_id || id,
              device_name: updatedDevice.name || d.device_name,
              name: updatedDevice.name || d.name,
              room_number:
                updatedDevice.room_number !== undefined
                  ? updatedDevice.room_number
                  : d.room_number,
              floor_number:
                updatedDevice.floor_number !== undefined
                  ? updatedDevice.floor_number
                  : d.floor_number,
              tissue_type:
                updatedDevice.tissue_type !== undefined
                  ? updatedDevice.tissue_type
                  : d.tissue_type,
              gender:
                updatedDevice.gender !== undefined
                  ? updatedDevice.gender
                  : d.gender,
              meter_capacity:
                updatedDevice.meter_capacity !== undefined
                  ? updatedDevice.meter_capacity
                  : d.meter_capacity,
              location:
                updatedDevice.location !== undefined
                  ? updatedDevice.location
                  : d.location,
              description:
                updatedDevice.description !== undefined
                  ? updatedDevice.description
                  : d.description,
              updated_at: new Date().toISOString(),
            };
          }
          return d;
        }),
        realtimeStatus: state.realtimeStatus.map((d) => {
          if (d.device_id === id) {
            return {
              ...d,
              last_update: new Date().toISOString(),
            };
          }
          return d;
        }),
        loading: false,
        error: null,
        operationMessage: "Device updated successfully",
        lastDataUpdate: new Date().toISOString(),
      }));

      return updatedDevice;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to update device";

      set({
        error: errorMessage,
        loading: false,
        operationMessage: "Failed to update device",
      });
      throw err;
    }
  },
  deleteDevice: async (token, id) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false });
      throw new Error(error);
    }

    if (!id) {
      const error = "Invalid device ID";
      set({ error, loading: false });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      await apiDeleteDevice(token, id);

      // Fast state update for immediate UI response
      set((state) => ({
        devices: state.devices.filter((d) => d.id !== id),
        analytics: state.analytics.filter(
          (d) => d.device_id !== id && d.id !== id
        ),
        realtimeStatus: state.realtimeStatus.filter((d) => d.device_id !== id),
        deviceData: Object.keys(state.deviceData).reduce((acc, key) => {
          if (key !== id.toString()) {
            acc[key] = state.deviceData[key];
          }
          return acc;
        }, {}),
        loading: false,
        error: null,
        operationMessage: "Device deleted successfully",
        lastDataUpdate: new Date().toISOString(),
      }));

      return true;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to delete device";

      set({
        error: errorMessage,
        loading: false,
        operationMessage: "Failed to delete device",
      });
      throw err;
    }
  },
  fetchDeviceDataById: async (token, deviceId) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false });
      throw new Error(error);
    }

    if (!deviceId) {
      const error = "Invalid device ID";
      set({ error, loading: false });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      const data = await apiFetchDeviceDataById(token, deviceId);

      set((state) => ({
        deviceData: {
          ...state.deviceData,
          [deviceId]: data,
        },
        loading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch device data by ID";

      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
    }
  },
  fetchAllDeviceData: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      const data = await apiFetchAllDeviceData(token);

      set((state) => ({
        deviceData: {
          ...state.deviceData,
          all: data,
        },
        loading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch all device data";

      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
    }
  },
  fetchNotifications: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      const response = await apiFetchNotifications(token);

      // Ensure notifications is always an array
      const notifications = Array.isArray(response) ? response : [];

      set({
        notifications,
        loading: false,
        error: null,
      });

      return notifications;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch notifications";

      set({
        error: errorMessage,
        loading: false,
        notifications: [],
      });
      throw err;
    }
  },
  registerPushToken: async (token, pushTokenData) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false });
      throw new Error(error);
    }

    if (!pushTokenData || !pushTokenData.token) {
      const error = "Invalid push token data";
      set({ error, loading: false });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      const result = await apiRegisterPushToken(token, pushTokenData);

      set({
        loading: false,
        error: null,
      });

      return result;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to register push token";

      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
    }
  },
  registerDeviceViaWiFi: async (token, wifiData) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ error, loading: false });
      throw new Error(error);
    }

    set({ loading: true, error: null, operationMessage: null });

    try {
      const response = await apiRegisterDeviceViaWiFi(token, wifiData);

      // Check if device already exists
      if (response.message === "Device already registered") {
        set({
          loading: false,
          error: null,
          operationMessage: "Device already registered and connected",
        });
        return response.device;
      } // Create analytics entry for the new WiFi device with enhanced fallback logic
      const newAnalyticsEntry = {
        id: response.id,
        device_id: response.id,
        // Device name with multiple fallbacks
        device_name: response.name || wifiData.name || `Device ${response.id}`,
        name: response.name || wifiData.name || `Device ${response.id}`,
        // Room and floor with proper fallbacks
        room_number:
          response.room_number !== undefined
            ? response.room_number
            : wifiData.room_number !== undefined
            ? wifiData.room_number
            : "",
        floor_number:
          response.floor_number !== undefined
            ? response.floor_number
            : wifiData.floor_number !== undefined
            ? wifiData.floor_number
            : 0,
        // Additional device properties with fallbacks
        location: response.location || wifiData.location || "",
        description: response.description || wifiData.description || "",
        device_type:
          response.device_type || wifiData.device_type || "dispenser",
        tissue_type:
          response.tissue_type || wifiData.tissue_type || "hand_towel",
        meter_capacity:
          response.meter_capacity || wifiData.meter_capacity || 500,
        // WiFi devices start as active
        is_active: true,
        current_status: "normal",
        // Analytics fields
        total_entries: 0,
        recent_entries_24h: 0,
        last_activity: new Date().toISOString(),
        minutes_since_update: 0,
        status_priority: 1,
        // Timestamps
        created_at: response.created_at || new Date().toISOString(),
        updated_at: response.updated_at || new Date().toISOString(), // Spread remaining device properties
        ...response,
      };

      // Log the final analytics entry to verify data integrity
      console.log(
        "✅ Store: Final analytics entry being added:",
        JSON.stringify(newAnalyticsEntry, null, 2)
      );

      // Create real-time status entry for immediate visibility
      const newRealtimeEntry = {
        device_id: response.id,
        is_active: true,
        current_status: "normal",
        minutes_since_update: 0,
        last_update: new Date().toISOString(),
      }; // New device registered
      set((state) => ({
        devices: [response, ...state.devices],
        analytics: [newAnalyticsEntry, ...state.analytics],
        realtimeStatus: [newRealtimeEntry, ...state.realtimeStatus],
        loading: false,
        error: null,
        operationMessage: `Device "${response.name}" connected successfully via WiFi`,
        lastDataUpdate: new Date().toISOString(),
      }));

      return response;
    } catch (err) {
      const errorMessage = err.message || "Failed to connect device via WiFi";

      set({
        error: errorMessage,
        loading: false,
        operationMessage: errorMessage,
      });
      throw err;
    }
  },
  checkDeviceStatus: async (token, deviceId) => {
    if (!token) {
      throw new Error("No authentication token provided");
    }

    try {
      const response = await apiCheckDeviceStatus(token, deviceId);
      return response;
    } catch (err) {
      throw err;
    }
  },
  updateDeviceStatus: async (token, statusData) => {
    if (!token) {
      throw new Error("No authentication token provided");
    }

    try {
      const response = await apiUpdateDeviceStatus(token, statusData);
      return response;
    } catch (err) {
      throw err;
    }
  },
  // Analytics Actions
  fetchDeviceAnalytics: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ analyticsError: error, analyticsLoading: false });
      throw new Error(error);
    }

    set({ analyticsLoading: true, analyticsError: null });

    try {
      const data = await apiFetchDeviceAnalytics(token);

      set({
        analytics: data,
        analyticsLoading: false,
        analyticsError: null,
      });

      return data;
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch device analytics";

      set({
        analyticsError: errorMessage,
        analyticsLoading: false,
      });
      throw err;
    }
  },
  fetchTimeBasedAnalytics: async (
    token,
    period = "weekly",
    deviceId = null,
    startDate = null,
    endDate = null
  ) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ analyticsError: error, analyticsLoading: false });
      throw new Error(error);
    }

    set({ analyticsLoading: true, analyticsError: null });

    try {
      const data = await apiFetchTimeBasedAnalytics(
        token,
        period,
        deviceId,
        startDate,
        endDate
      );

      set({
        timeBasedData: data,
        analyticsLoading: false,
        analyticsError: null,
      });

      return data;
    } catch (err) {
      const errorMessage =
        err.message || "Failed to fetch time-based analytics";

      set({
        analyticsError: errorMessage,
        analyticsLoading: false,
      });
      throw err;
    }
  },
  fetchSummaryAnalytics: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ analyticsError: error, analyticsLoading: false });
      throw new Error(error);
    }

    set({ analyticsLoading: true, analyticsError: null });

    try {
      const data = await apiFetchSummaryAnalytics(token);

      set({
        summaryData: data,
        analyticsLoading: false,
        analyticsError: null,
      });

      return data;
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch summary analytics";

      set({
        analyticsError: errorMessage,
        analyticsLoading: false,
      });
      throw err;
    }
  },

  downloadAnalytics: async (
    token,
    period = "weekly",
    format = "csv",
    deviceId = null
  ) => {
    if (!token) {
      const error = "No authentication token provided";
      throw new Error(error);
    }

    try {
      set({ analyticsLoading: true });

      // Call the API endpoint function
      const data = await apiDownloadAnalytics(token, period, format, deviceId);

      if (!data) {
        throw new Error("No data available to download");
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      const errorMessage = error.message || "Failed to download analytics";
      set({ analyticsError: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ analyticsLoading: false });
    }
  },
  fetchDeviceRealtimeStatus: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ realtimeError: error, realtimeLoading: false });
      throw new Error(error);
    }

    set({ realtimeLoading: true, realtimeError: null });

    try {
      const data = await apiFetchDeviceRealtimeStatus(token);

      set({
        realtimeStatus: Array.isArray(data) ? data : [],
        realtimeLoading: false,
        realtimeError: null,
      });

      return data;
    } catch (err) {
      const errorMessage =
        err.message || "Failed to fetch real-time device status";

      set({
        realtimeError: errorMessage,
        realtimeLoading: false,
        realtimeStatus: [],
      });
      throw err;
    }
  },
  fetchDeviceStatusSummary: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ realtimeError: error, realtimeLoading: false });
      throw new Error(error);
    }

    set({ realtimeLoading: true, realtimeError: null });

    try {
      const data = await apiFetchDeviceStatusSummary(token);

      set({
        statusSummary: data,
        realtimeLoading: false,
        realtimeError: null,
      });

      return data;
    } catch (err) {
      const errorMessage =
        err.message || "Failed to fetch device status summary";

      set({
        realtimeError: errorMessage,
        realtimeLoading: false,
      });
      throw err;
    }
  },
  fetchDeviceStatusDistribution: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ distributionError: error, distributionLoading: false });
      throw new Error(error);
    }

    set({ distributionLoading: true, distributionError: null });

    try {
      const data = await apiFetchDeviceStatusDistribution(token);

      set({
        statusDistribution: data,
        distributionLoading: false,
        distributionError: null,
      });

      // Cache status distribution data
      storeData("statusDistribution", data);

      return data;
    } catch (err) {
      const errorMessage =
        err.message || "Failed to fetch device status distribution";

      set({
        distributionError: errorMessage,
        distributionLoading: false,
        statusDistribution: null,
      });
      throw err;
    }
  },
  // Combined fetch for both real-time status and analytics
  fetchAllAnalyticsData: async (token) => {
    if (!token) {
      const error = "No authentication token provided";
      set({ analyticsError: error, realtimeError: error });
      throw new Error(error);
    }

    set({
      analyticsLoading: true,
      realtimeLoading: true,
      analyticsError: null,
      realtimeError: null,
    });

    try {
      console.log("Fetching all analytics data...");
      
      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled([
        apiFetchDeviceAnalytics(token),
        apiFetchSummaryAnalytics(token),
        apiFetchDeviceRealtimeStatus(token),
        apiFetchDeviceStatusSummary(token),
      ]);
      
      // Process results and handle errors
      const [analyticsResult, summaryResult, realtimeResult, statusSummaryResult] = results;
      
      // Log any errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpoints = ['analytics', 'summary', 'realtime', 'status summary'];
          console.error(`Failed to fetch ${endpoints[index]}:`, result.reason);
        }
      });
      
      // Extract values or use defaults
      const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : [];
      const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
      const realtime = realtimeResult.status === 'fulfilled' ? realtimeResult.value : [];
      const statusSummary = statusSummaryResult.status === 'fulfilled' ? statusSummaryResult.value : null;

      set({
        analytics: Array.isArray(analytics) ? analytics : [],
        summaryData: summary,
        realtimeStatus: Array.isArray(realtime) ? realtime : [],
        statusSummary: statusSummary,
        analyticsLoading: false,
        realtimeLoading: false,
        analyticsError: null,
        realtimeError: null,
      });

      // Cache analytics data
      storeData("analytics", Array.isArray(analytics) ? analytics : []);
      storeData("summaryData", summary);
      storeData("realtimeStatus", Array.isArray(realtime) ? realtime : []);
      storeData("statusSummary", statusSummary);

      return {
        analytics,
        summary,
        realtime,
        statusSummary,
      };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch analytics data";

      set({
        analyticsError: errorMessage,
        realtimeError: errorMessage,
        analyticsLoading: false,
        realtimeLoading: false,
      });
      throw err;
    }
  }, // Force refresh all data - useful after device operations to ensure synchronization
  refreshAllData: async (token) => {
    if (!token) {
      console.warn("No token provided for data refresh");
      return;
    }

    console.log("🔄 Refreshing all data for synchronization...");

    try {
      // Use a more controlled approach to prevent hook issues
      const store = get();
      if (!store) {
        console.warn("Store not available for refresh");
        return;
      }

      // Refresh both devices and analytics data in parallel with error handling
      console.log("Starting data refresh...");
      
      // Define the refresh operations with more detailed logging
      const refreshOperations = [
        { 
          name: 'devices', 
          operation: () => store.fetchDevices(token),
          retryCount: 0,
          maxRetries: 2
        },
        { 
          name: 'analytics', 
          operation: () => store.fetchAllAnalyticsData(token),
          retryCount: 0,
          maxRetries: 2
        }
      ];
      
      // Execute all operations with Promise.allSettled
      const results = await Promise.allSettled(
        refreshOperations.map(async (op) => {
          try {
            console.log(`Starting refresh of ${op.name}...`);
            const startTime = Date.now();
            const result = await op.operation();
            const duration = Date.now() - startTime;
            console.log(`✅ Successfully refreshed ${op.name} in ${duration}ms`);
            return result;
          } catch (error) {
            console.error(`❌ Error refreshing ${op.name}:`, error);
            
            // Add more detailed error information
            const errorDetails = {
              message: error.message,
              stack: error.stack,
              name: op.name,
              timestamp: new Date().toISOString()
            };
            
            console.error(`Detailed error for ${op.name}:`, JSON.stringify(errorDetails));
            throw error;
          }
        })
      );
      
      // Check if any promises were rejected
      const hasErrors = results.some(result => result.status === 'rejected');
      
      // Log summary of results
      console.log(`Data refresh complete. Success: ${results.filter(r => r.status === 'fulfilled').length}/${results.length}`);
      
      if (hasErrors) {
        console.warn('Some data refresh operations failed. The dashboard may show partial or stale data.');
      }
      
      if (hasErrors) {
        console.log("⚠️ Data refresh completed with some errors");
      } else {
        console.log("✅ Data refresh completed successfully");
      }
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    }
  },

  // Clear functions
  clearAnalyticsError: () => {
    set({ analyticsError: null });
  },
  clearRealtimeError: () => {
    set({ realtimeError: null });
  },

  clearError: () => {
    set({ error: null, operationMessage: null });
  },
  // ===== NEW BATTERY ANALYTICS FUNCTIONS =====
  fetchBatteryUsageAnalytics: async (token) => {
    set({ batteryAnalyticsLoading: true, batteryAnalyticsError: null });

    try {
      const data = await apiFetchBatteryUsageAnalytics(token);
      set({
        batteryUsageData: data,
        batteryAnalyticsLoading: false,
        batteryAnalyticsError: null,
      });

      // Cache battery usage data
      storeData("batteryUsageData", data);

      return data;
    } catch (err) {
      const errorMessage =
        err.message || "Failed to fetch battery usage analytics";
      set({
        batteryAnalyticsError: errorMessage,
        batteryAnalyticsLoading: false,
      });
      throw err;
    }
  },

  fetchBatteryUsageTrends: async (token, deviceId = null, days = 7) => {
    set({ batteryAnalyticsLoading: true, batteryAnalyticsError: null });

    try {
      const data = await apiFetchBatteryUsageTrends(token, deviceId, days);
      set({
        batteryTrendsData: data,
        batteryAnalyticsLoading: false,
        batteryAnalyticsError: null,
      });

      // Cache battery trends data
      storeData("batteryTrendsData", data);

      return data;
    } catch (err) {
      const errorMessage =
        err.message || "Failed to fetch battery usage trends";
      set({
        batteryAnalyticsError: errorMessage,
        batteryAnalyticsLoading: false,
      });
      throw err;
    }
  },

  // Enhanced download functions
  downloadCSVAnalytics: async (token, period = "weekly", deviceId = null) => {
    try {
      const result = await apiDownloadCSVAnalytics(token, period, deviceId);
      return result;
    } catch (err) {
      const errorMessage = err.message || "Failed to download CSV analytics";
      set({ analyticsError: errorMessage });
      throw err;
    }
  },

  downloadJSONAnalytics: async (token, period = "weekly", deviceId = null) => {
    try {
      const result = await apiDownloadJSONAnalytics(token, period, deviceId);
      return result;
    } catch (err) {
      const errorMessage = err.message || "Failed to download JSON analytics";
      set({ analyticsError: errorMessage });
      throw err;
    }
  },

  downloadPDFAnalytics: async (token, period = "weekly", deviceId = null) => {
    try {
      const result = await apiDownloadPDFAnalytics(token, period, deviceId);
      return result;
    } catch (err) {
      const errorMessage = err.message || "Failed to download PDF analytics";
      set({ analyticsError: errorMessage });
      throw err;
    }
  },

  clearBatteryAnalyticsError: () => {
    set({ batteryAnalyticsError: null });
  },

  // Load cached data from localStorage
  loadCachedData: () => {
    try {
      const cachedDevices = getData("devices");
      const cachedAnalytics = getData("analytics");
      const cachedRealtimeStatus = getData("realtimeStatus");
      const cachedSummaryData = getData("summaryData");
      const cachedStatusSummary = getData("statusSummary");
      const cachedStatusDistribution = getData("statusDistribution");
      const cachedBatteryUsageData = getData("batteryUsageData");
      const cachedBatteryTrendsData = getData("batteryTrendsData");

      // Only update state if cached data exists
      const updates = {};
      if (cachedDevices) updates.devices = cachedDevices;
      if (cachedAnalytics) updates.analytics = cachedAnalytics;
      if (cachedRealtimeStatus) updates.realtimeStatus = cachedRealtimeStatus;
      if (cachedSummaryData) updates.summaryData = cachedSummaryData;
      if (cachedStatusSummary) updates.statusSummary = cachedStatusSummary;
      if (cachedStatusDistribution)
        updates.statusDistribution = cachedStatusDistribution;
      if (cachedBatteryUsageData)
        updates.batteryUsageData = cachedBatteryUsageData;
      if (cachedBatteryTrendsData)
        updates.batteryTrendsData = cachedBatteryTrendsData;

      if (Object.keys(updates).length > 0) {
        set(updates);
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
    }
  },
}));

export default useDeviceStore;
export { useDeviceStore }; // Named export for components that expect it
