import axios from "axios";

import config from "../config/config";
import { Platform } from "react-native";

import { Buffer } from "buffer";

const API_URL = config.API_URL;
const API_BASE_URL = `${API_URL}/device`;
const AUTH_BASE_URL = `${API_URL}/auth`;

console.log("API URL:", API_URL);

// Helper for headers
const authHeaders = (token, contentType = "application/json") => ({
  Authorization: `Bearer ${token}`,
  ...(contentType && { "Content-Type": contentType }),
});

// Helper for error message
const getErrorMessage = (error, fallbackMessage) => {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallbackMessage
  );
};

// ---------------- Authentication ----------------

export async function register(userData) {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/register/`, userData, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Registration failed"));
  }
}

export async function login(email, password) {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/login/`, {
      email,
      password,
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Login failed"));
  }
}

export async function refreshToken(refreshToken) {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/token/refresh/`, {
      refresh: refreshToken,
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Token refresh failed"));
  }
}

export async function googleLogin(idToken) {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/google-login/`, {
      id_token: idToken,
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Google login failed"));
  }
}

export async function forgotPassword(email) {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/forgot/`, { email });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to send reset OTP"));
  }
}

export async function verifyOTP(email, otp) {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/verify-otp/`, {
      email,
      otp,
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "OTP verification failed"));
  }
}

export async function resetPassword(email, newPassword) {
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/reset-password/`, {
      email,
      new_password: newPassword,
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Password reset failed"));
  }
}

// ---------------- User Profile ----------------

export async function getProfile(token) {
  try {
    const res = await axios.get(`${AUTH_BASE_URL}/user/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch user profile"));
  }
}

export async function updateProfile(token, data) {
  try {
    const res = await axios.put(`${AUTH_BASE_URL}/user/update/`, data, {
      headers: authHeaders(token),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update profile"));
  }
}

export async function uploadProfilePicture(token, imageFile) {
  try {
    const formData = new FormData();
    formData.append("image", {
      uri: imageFile.uri,
      type: "image/jpeg",
      name: "profile.jpg",
    });

    const res = await axios.post(
      `${AUTH_BASE_URL}/user/upload-picture/`,
      formData,
      {
        headers: authHeaders(token, "multipart/form-data"),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to upload profile picture"));
  }
}

export async function changePassword(token, oldPassword, newPassword) {
  try {
    const res = await axios.post(
      `${AUTH_BASE_URL}/user/change-password/`,
      {
        old_password: oldPassword,
        new_password: newPassword,
      },
      {
        headers: authHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to change password"));
  }
}

// ---------------- Password Change with OTP ----------------

export async function sendPasswordChangeOTP(token) {
  try {
    const res = await axios.post(
      `${AUTH_BASE_URL}/user/send-change-password-otp/`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to send OTP"));
  }
}

export async function verifyPasswordChangeOTP(token, otp) {
  try {
    const res = await axios.post(
      `${AUTH_BASE_URL}/user/verify-password-change-otp/`,
      { otp },
      { headers: authHeaders(token) }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "OTP verification failed"));
  }
}

export async function changePasswordWithOTP(
  token,
  oldPassword,
  newPassword,
  otp
) {
  try {
    const res = await axios.post(
      `${AUTH_BASE_URL}/user/change-password-with-otp/`,
      {
        old_password: oldPassword,
        new_password: newPassword,
        otp: otp,
      },
      {
        headers: authHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to change password"));
  }
}

// ---------------- Contact Support ----------------

export async function submitContactForm(formData) {
  try {
    const res = await axios.post(
      `${API_URL}/contact/`,
      {
        ...formData,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 15000, // 15 second timeout
      }
    );
    return res.data;
  } catch (error) {
    // Enhanced error handling for contact form
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Request timed out. Please check your internet connection and try again."
      );
    } else if (error.message.includes("Network Error")) {
      throw new Error(
        "Network error. Please check your internet connection and try again."
      );
    } else if (error.response?.status >= 500) {
      throw new Error(
        "Server error. Please try again later or contact support directly."
      );
    }
    throw new Error(getErrorMessage(error, "Failed to send contact form"));
  }
}

// ---------------- Device Management ----------------

export async function fetchDevices(token) {
  try {
    const res = await axios.get(`${API_BASE_URL}/devices/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch devices"));
  }
}

export async function addDevice(token, data) {
  try {
    const res = await axios.post(`${API_BASE_URL}/devices/add/`, data, {
      headers: authHeaders(token),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to add device"));
  }
}

export async function updateDevice(token, id, data) {
  try {
    const res = await axios.put(`${API_BASE_URL}/devices/${id}/`, data, {
      headers: authHeaders(token),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update device"));
  }
}

export async function deleteDevice(token, id) {
  try {
    await axios.delete(`${API_BASE_URL}/devices/${id}/`, {
      headers: authHeaders(token, null),
    });
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete device"));
  }
}

export async function getDeviceDetails(token, id) {
  try {
    const res = await axios.get(`${API_BASE_URL}/devices/${id}/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to get device details"));
  }
}

// ---------------- Device Data ----------------

export async function submitDeviceData(token, data) {
  try {
    const res = await axios.post(`${API_BASE_URL}/device-data/submit/`, data, {
      headers: authHeaders(token),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to submit device data"));
  }
}

export async function fetchAllDeviceData(token) {
  try {
    const res = await axios.get(`${API_BASE_URL}/device-data/all/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch all device data"));
  }
}

export async function fetchDeviceDataById(token, deviceId) {
  try {
    const res = await axios.get(`${API_BASE_URL}/device-data/${deviceId}/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to fetch device data by ID")
    );
  }
}

// ---------------- Notifications ----------------

export async function fetchNotifications(token) {
  try {
    const res = await axios.get(`${API_BASE_URL}/notifications/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch notifications"));
  }
}

export async function fetchUnreadNotificationCount(token) {
  try {
    const res = await axios.get(`${API_BASE_URL}/notifications/unread-count/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch unread count"));
  }
}

export async function markNotificationAsRead(token, notificationId) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/notifications/${notificationId}/mark-read/`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to mark notification as read")
    );
  }
}

export async function deleteNotification(token, notificationId) {
  try {
    await axios.delete(`${API_BASE_URL}/notifications/${notificationId}/`, {
      headers: authHeaders(token, null),
    });
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete notification"));
  }
}

export async function clearAllNotifications(token) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/notifications/clear-all/`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to clear all notifications")
    );
  }
}

export async function registerPushToken(token, pushTokenData) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/expo-token/register/`,
      pushTokenData,
      {
        headers: authHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to register push token"));
  }
}

// ---------------- Analytics ----------------

export async function fetchDeviceAnalytics(token) {
  try {
    const res = await axios.get(`${API_BASE_URL}/device-analytics/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch analytics"));
  }
}

// ---------------- Real-time Device Status ----------------

export async function fetchDeviceRealtimeStatus(token) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/realtime-status/`,
      {
        headers: authHeaders(token, null),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to fetch real-time device status")
    );
  }
}

export async function fetchDeviceStatusSummary(token) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/status-summary/`,
      {
        headers: authHeaders(token, null),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to fetch device status summary")
    );
  }
}

// ---------------- New Time-based Analytics ----------------

export async function fetchTimeBasedAnalytics(
  token,
  period = "weekly",
  deviceId = null,
  startDate = null,
  endDate = null
) {
  try {
    const params = new URLSearchParams({ period });
    if (deviceId) params.append("device_id", deviceId);
    if (startDate) params.append("start_date", startDate.toISOString());
    if (endDate) params.append("end_date", endDate.toISOString());

    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/time-based/?${params.toString()}`,
      {
        headers: authHeaders(token, null),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to fetch time-based analytics")
    );
  }
}

// In your api.js file
export async function downloadAnalytics(
  token,
  period = "weekly",
  format = "csv",
  deviceId = null
) {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (deviceId) params.append("device_id", deviceId);
    let endpoint;
    let responseType;

    if (format === "csv") {
      endpoint = "/device-analytics/download/csv/";
      responseType = Platform.OS === "web" ? "blob" : "text";
    } else if (format === "json") {
      endpoint = "/device-analytics/download/json/";
      responseType = Platform.OS === "web" ? "blob" : "text";
    } else if (format === "pdf") {
      endpoint = "/device-analytics/download/pdf/";
      // PDF needs different handling - use blob for web, base64 for mobile
      responseType = Platform.OS === "web" ? "blob" : "arraybuffer";
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    const res = await axios.get(
      `${API_BASE_URL}${endpoint}?${params.toString()}`,
      {
        headers: authHeaders(token, null),
        responseType: responseType,
      }
    ); // Handle the response based on platform and format
    if (Platform.OS === "web") {
      return res.data;
    } else {
      // For mobile platforms
      if (format === "pdf") {
        // For React Native, we need to handle binary data properly
        // Convert ArrayBuffer to base64 string
        const buffer = res.data;

        // Method 1: Using Buffer (Node.js style, works in React Native)
        if (typeof Buffer !== "undefined") {
          return Buffer.from(buffer).toString("base64");
        }

        // Method 2: Manual conversion as fallback
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      } else {
        // For CSV and JSON, return text data directly
        return res.data;
      }
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to download analytics"));
  }
}

export async function fetchSummaryAnalytics(token) {
  try {
    const res = await axios.get(`${API_BASE_URL}/device-analytics/summary/`, {
      headers: authHeaders(token, null),
    });
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to fetch summary analytics")
    );
  }
}

// ---------------- New Analytics Functions ----------------
// Battery and Power Analytics
export async function fetchBatteryUsageAnalytics(token) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/battery-usage/`,
      {
        headers: authHeaders(token, null),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to fetch battery usage analytics")
    );
  }
}

export async function fetchBatteryUsageTrends(
  token,
  deviceId = null,
  days = 7
) {
  try {
    const params = new URLSearchParams();
    if (deviceId) params.append("device_id", deviceId);
    params.append("days", days.toString());

    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/battery-usage-trends/?${params.toString()}`,
      {
        headers: authHeaders(token, null),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to fetch battery usage trends")
    );
  }
}

// ---------------- Enhanced Download Functions ----------------

export async function downloadCSVAnalytics(
  token,
  period = "weekly",
  deviceId = null
) {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (deviceId) params.append("device_id", deviceId);

    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/download/csv/?${params.toString()}`,
      {
        headers: authHeaders(token, null),
        responseType: Platform.OS === "web" ? "blob" : "text",
      }
    );

    if (Platform.OS === "web") {
      // Handle web download
      if (typeof window !== 'undefined') {
        const blob = new Blob([res.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics_${period}_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        return { success: true, message: "CSV downloaded successfully" };
      } else {
        return { success: false, message: "Download not available" };
      }
    } else {
      // Handle mobile download
      const { FileSystem, Sharing } = require("expo");
      const fileName = `analytics_${period}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, res.data);
      await Sharing.shareAsync(fileUri);

      return { success: true, message: "CSV shared successfully" };
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to download CSV analytics"));
  }
}

export async function downloadJSONAnalytics(
  token,
  period = "weekly",
  deviceId = null
) {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (deviceId) params.append("device_id", deviceId);

    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/download/json/?${params.toString()}`,
      {
        headers: authHeaders(token, null),
        responseType: Platform.OS === "web" ? "blob" : "text",
      }
    );

    if (Platform.OS === "web") {
      // Handle web download
      if (typeof window !== 'undefined') {
        const blob = new Blob([res.data], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics_${period}_${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();
        window.URL.revokeObjectURL(url);
        return { success: true, message: "JSON downloaded successfully" };
      } else {
        return { success: false, message: "Download not available" };
      }
    } else {
      // Handle mobile download
      const { FileSystem, Sharing } = require("expo");
      const fileName = `analytics_${period}_${
        new Date().toISOString().split("T")[0]
      }.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, res.data);
      await Sharing.shareAsync(fileUri);

      return { success: true, message: "JSON shared successfully" };
    }
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to download JSON analytics")
    );
  }
}

export async function downloadPDFAnalytics(
  token,
  period = "weekly",
  deviceId = null
) {
  try {
    const params = new URLSearchParams();
    params.append("period", period);
    if (deviceId) params.append("device_id", deviceId);

    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/download/pdf/?${params.toString()}`,
      {
        headers: authHeaders(token, null),
        responseType: Platform.OS === "web" ? "blob" : "arraybuffer",
      }
    );

    if (Platform.OS === "web") {
      // Handle web download
      if (typeof window !== 'undefined') {
        const contentType = res.headers["content-type"];

        if (contentType === "application/pdf") {
          // PDF download
          const blob = new Blob([res.data], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `analytics_${period}_${
            new Date().toISOString().split("T")[0]
          }.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          return { success: true, message: "PDF downloaded successfully" };
        } else if (contentType === "text/html") {
          // HTML fallback
          const blob = new Blob([res.data], { type: "text/html" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `analytics_${period}_${
            new Date().toISOString().split("T")[0]
          }.html`;
          link.click();
          window.URL.revokeObjectURL(url);
          return {
            success: true,
            message: "HTML report downloaded (PDF libraries not available)",
          };
        }
      } else {
        return { success: false, message: "Download not available" };
      }
    } else {
      // Handle mobile download
      const { FileSystem, Sharing } = require("expo");
      const contentType = res.headers["content-type"];
      const isPDF = contentType === "application/pdf";
      const extension = isPDF ? "pdf" : "html";
      const fileName = `analytics_${period}_${
        new Date().toISOString().split("T")[0]
      }.${extension}`;
      const fileUri = FileSystem.documentDirectory + fileName;
      if (isPDF) {
        // Handle PDF as base64 - React Native compatible
        const base64Data = res.data.toString("base64");
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        // Handle HTML as string
        await FileSystem.writeAsStringAsync(fileUri, res.data);
      }

      await Sharing.shareAsync(fileUri);
      return {
        success: true,
        message: isPDF
          ? "PDF shared successfully"
          : "HTML report shared (PDF libraries not available)",
      };
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to download PDF analytics"));
  }
}

// ---------------- Device WiFi Registration & Status ----------------

export async function registerDeviceViaWiFi(token, data) {
  try {
    // The backend expects device_id, name, floor_number, room_number, and optional WiFi metadata
    // Fixed: Use correct endpoint path 'wifi/' (API_BASE_URL already includes '/device')
    const res = await axios.post(`${API_BASE_URL}/wifi/`, data, {
      headers: authHeaders(token),
    });
    return res.data;
  } catch (error) {
    // Check if device already exists (200 response with message)
    if (error.response?.status === 200) {
      return error.response.data;
    }
    throw new Error(
      getErrorMessage(error, "Failed to register device via WiFi")
    );
  }
}

export async function checkDeviceStatus(token, deviceId) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/devices/check-status/`,
      { device_id: deviceId },
      {
        headers: authHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to check device status"));
  }
}

export async function updateDeviceStatus(token, statusData) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/devices/update-status/`,
      statusData,
      {
        headers: authHeaders(token),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update device status"));
  }
}

export async function fetchDeviceStatusDistribution(token) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/device-analytics/status-distribution/`,
      {
        headers: authHeaders(token, null),
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to fetch device status distribution")
    );
  }
}

export default {
  fetchDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  getDeviceDetails,
  submitDeviceData,
  fetchAllDeviceData,
  fetchDeviceDataById,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
  registerPushToken,
  fetchDeviceAnalytics,
  fetchDeviceRealtimeStatus,
  fetchDeviceStatusSummary,
  fetchTimeBasedAnalytics,
  downloadAnalytics,
  fetchSummaryAnalytics,
  registerDeviceViaWiFi,
  checkDeviceStatus,
  updateDeviceStatus,
  fetchDeviceStatusDistribution,
  fetchBatteryUsageAnalytics,
  fetchBatteryUsageTrends,
  downloadCSVAnalytics,
  downloadJSONAnalytics,
  downloadPDFAnalytics,
  // Contact Support
  submitContactForm,
};
