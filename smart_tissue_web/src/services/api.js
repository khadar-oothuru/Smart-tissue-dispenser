import axios from "axios";
import config from "../config/config";

// Platform detection for web environment
const Platform = {
  OS: typeof window !== "undefined" ? "web" : "node",
};

const API_URL = config.API_URL;
const API_BASE_URL = `${API_URL}/device`;
const AUTH_BASE_URL = `${API_URL}/auth`;

console.log("API URL:", API_URL);

// Configure global axios defaults
// axios.defaults.timeout = 45000; // Timeout removed to allow long-running requests

// Add request interceptor for logging
axios.interceptors.request.use((request) => {
  console.log(
    `🔄 API Request: ${request.method?.toUpperCase()} ${request.url}`
  );
  return request;
});

// Add response interceptor for logging
axios.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response: ${response.config.method?.toUpperCase()} ${
        response.config.url
      } (${response.status})`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `❌ API Error: ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        } (${error.response.status})`,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        `❌ API Error: No response received for ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }`,
        error.message
      );
    } else {
      console.error(`❌ API Error: Request failed`, error.message);
    }
    return Promise.reject(error);
  }
);

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
    throw new Error(
      getErrorMessage(error, "Failed to send password reset email")
    );
  }
}

// Note: The backend uses token-based password reset, not OTP
// This function is kept for compatibility but may not work with current backend
export async function verifyOTP(email, otp) {
  try {
    // This endpoint doesn't exist in the backend - consider removing or updating
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
    // This endpoint expects token-based reset, not direct password reset
    const res = await axios.post(`${AUTH_BASE_URL}/reset-password/`, {
      email,
      new_password: newPassword,
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Password reset failed"));
  }
}

// Token-based password reset (matches backend implementation)
export async function resetPasswordWithToken(uidb64, token, newPassword) {
  try {
    // This would be a form submission to the backend reset view
    // For API-based reset, you might need to modify the backend
    const formData = new FormData();
    formData.append("password", newPassword);

    const res = await axios.post(
      `${AUTH_BASE_URL}/reset/${uidb64}/${token}/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
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
    // imageFile is a FormData from the caller, so just use it directly
    const res = await axios.post(
      `${AUTH_BASE_URL}/user/upload-picture/`,
      imageFile,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type here!
        },
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

export async function fetchDevices(token, retryCount = 2, retryDelay = 2000) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retryCount} for devices...`);
      }

      const res = await axios.get(`${API_BASE_URL}/devices/`, {
        headers: authHeaders(token, null),
      });

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch devices after multiple attempts"
    )
  );
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

export async function fetchAllDeviceData(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for all device data...`
        );
      }

      const res = await axios.get(`${API_BASE_URL}/device-data/all/`, {
        headers: authHeaders(token, null),
      });

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch all device data after multiple attempts"
    )
  );
}

export async function fetchDeviceDataById(
  token,
  deviceId,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for device data by ID ${deviceId}...`
        );
      }

      const res = await axios.get(`${API_BASE_URL}/device-data/${deviceId}/`, {
        headers: authHeaders(token, null),
      });

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      `Failed to fetch device data for ID ${deviceId} after multiple attempts`
    )
  );
}

// ---------------- Notifications ----------------

export async function fetchNotifications(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for notifications...`
        );
      }

      const res = await axios.get(`${API_BASE_URL}/notifications/`, {
        headers: authHeaders(token, null),
      });

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch notifications after multiple attempts"
    )
  );
}

export async function fetchUnreadNotificationCount(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for unread notification count...`
        );
      }

      const res = await axios.get(
        `${API_BASE_URL}/notifications/unread-count/`,
        {
          headers: authHeaders(token, null),
        }
      );

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch unread notification count after multiple attempts"
    )
  );
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

export async function fetchDeviceAnalytics(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for device analytics...`
        );
      }

      const res = await axios.get(`${API_BASE_URL}/device-analytics/`, {
        headers: authHeaders(token, null),
      });

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch analytics after multiple attempts"
    )
  );
}

// ---------------- Real-time Device Status ----------------

export async function fetchDeviceRealtimeStatus(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for realtime status...`
        );
      }

      const res = await axios.get(
        `${API_BASE_URL}/device-analytics/realtime-status/`,
        {
          headers: authHeaders(token, null),
        }
      );

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch real-time device status after multiple attempts"
    )
  );
}

export async function fetchDeviceStatusSummary(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for device status summary...`
        );
      }

      const res = await axios.get(
        `${API_BASE_URL}/device-analytics/status-summary/`,
        {
          headers: authHeaders(token, null),
        }
      );

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch device status summary after multiple attempts"
    )
  );
}

// ---------------- New Time-based Analytics ----------------

export async function fetchTimeBasedAnalytics(
  token,
  period = "weekly",
  deviceId = null,
  startDate = null,
  endDate = null,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for time-based analytics...`
        );
      }

      const params = new URLSearchParams({ period });
      if (deviceId) params.append("device_id", deviceId);
      if (startDate) {
        const start =
          startDate instanceof Date ? startDate : new Date(startDate);
        params.append("start_date", start.toISOString());
      }
      if (endDate) {
        const end = endDate instanceof Date ? endDate : new Date(endDate);
        params.append("end_date", end.toISOString());
      }

      const res = await axios.get(
        `${API_BASE_URL}/device-analytics/time-based/?${params.toString()}`,
        {
          headers: authHeaders(token, null),
        }
      );

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch time-based analytics after multiple attempts"
    )
  );
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

        // Use browser-compatible method to convert ArrayBuffer to base64
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

export async function fetchSummaryAnalytics(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for summary analytics...`
        );
      }

      const res = await axios.get(`${API_BASE_URL}/device-analytics/summary/`, {
        headers: authHeaders(token, null),
      });

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch summary analytics after multiple attempts"
    )
  );
}

// ---------------- New Analytics Functions ----------------
// Battery and Power Analytics
export async function fetchBatteryUsageAnalytics(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for battery usage analytics...`
        );
      }

      const res = await axios.get(
        `${API_BASE_URL}/device-analytics/battery-usage/`,
        {
          headers: authHeaders(token, null),
        }
      );

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch battery usage analytics after multiple attempts"
    )
  );
}

export async function fetchBatteryUsageTrends(
  token,
  deviceId = null,
  days = 7,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for battery usage trends...`
        );
      }

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
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch battery usage trends after multiple attempts"
    )
  );
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
      if (typeof window !== "undefined") {
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
      // Handle mobile download - Note: This is for web, so we'll return data instead
      // If you need React Native support, you'll need to conditionally import these
      try {
        // For web fallback, we'll return the data for manual handling
        return {
          success: true,
          data: res.data,
          filename: `analytics_${period}_${
            new Date().toISOString().split("T")[0]
          }.csv`,
          message: "CSV data retrieved successfully",
        };
      } catch {
        return {
          success: false,
          message: "CSV download not available in web environment",
        };
      }
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
      if (typeof window !== "undefined") {
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
      // Handle mobile download - Note: This is for web, so we'll return data instead
      // If you need React Native support, you'll need to conditionally import these
      try {
        // For web fallback, we'll return the data for manual handling
        return {
          success: true,
          data: res.data,
          filename: `analytics_${period}_${
            new Date().toISOString().split("T")[0]
          }.json`,
          message: "JSON data retrieved successfully",
        };
      } catch {
        return {
          success: false,
          message: "JSON download not available in web environment",
        };
      }
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
      if (typeof window !== "undefined") {
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
      // Handle mobile download - Note: This is for web, so we'll return data instead
      // If you need React Native support, you'll need to conditionally import these
      try {
        const contentType = res.headers["content-type"];
        const isPDF = contentType === "application/pdf";
        const extension = isPDF ? "pdf" : "html";

        // For web fallback, we'll return the data for manual handling
        return {
          success: true,
          data: res.data,
          filename: `analytics_${period}_${
            new Date().toISOString().split("T")[0]
          }.${extension}`,
          message: isPDF
            ? "PDF data retrieved successfully"
            : "HTML report data retrieved successfully",
        };
      } catch {
        return {
          success: false,
          message: "PDF download not available in web environment",
        };
      }
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

export async function fetchDeviceStatusDistribution(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for device status distribution...`
        );
      }

      const res = await axios.get(
        `${API_BASE_URL}/device-analytics/status-distribution/`,
        {
          headers: authHeaders(token, null),
        }
      );

      return res.data;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  throw new Error(
    getErrorMessage(
      lastError,
      "Failed to fetch device status distribution after multiple attempts"
    )
  );
}

// ---------------- Utility Functions ----------------

// Utility function to validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Utility function to validate password strength
export function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }
  if (!hasSpecialChar) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
}

// Helper function to calculate password strength
function calculatePasswordStrength(password) {
  let score = 0;
  let strength = "Very Weak";

  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (score >= 80) strength = "Very Strong";
  else if (score >= 60) strength = "Strong";
  else if (score >= 40) strength = "Medium";
  else if (score >= 20) strength = "Weak";

  return { score, strength };
}

export default {
  // Authentication functions
  register,
  login,
  refreshToken,
  googleLogin,
  forgotPassword,
  verifyOTP,
  resetPassword,
  resetPasswordWithToken,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  sendPasswordChangeOTP,
  verifyPasswordChangeOTP,
  changePasswordWithOTP,

  // Device management
  fetchDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  getDeviceDetails,
  submitDeviceData,
  fetchAllDeviceData,
  fetchDeviceDataById,

  // Notifications
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
  registerPushToken,

  // Analytics
  fetchDeviceAnalytics,
  fetchDeviceRealtimeStatus,
  fetchDeviceStatusSummary,
  fetchTimeBasedAnalytics,
  downloadAnalytics,
  fetchSummaryAnalytics,

  // Device WiFi and Status
  registerDeviceViaWiFi,
  checkDeviceStatus,
  updateDeviceStatus,
  fetchDeviceStatusDistribution,

  // Battery Analytics
  fetchBatteryUsageAnalytics,
  fetchBatteryUsageTrends,

  // Download functions
  downloadCSVAnalytics,
  downloadJSONAnalytics,
  downloadPDFAnalytics,

  // Contact Support
  submitContactForm,

  // Utility Functions
  isValidEmail,
  validatePasswordStrength,
};

// ---------------- Admin Dashboard ----------------

export async function fetchDashboardStats(
  token,
  retryCount = 2,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // If this is a retry attempt, log it
      if (attempt > 0) {
        console.log(
          `Retry attempt ${attempt}/${retryCount} for dashboard stats...`
        );
      }

      const res = await axios.get(`${API_BASE_URL}/admin/dashboard-stats/`, {
        headers: authHeaders(token),
      });

      return {
        success: true,
        data: res.data,
      };
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors, not on 4xx/5xx responses
      const isTimeoutOrNetworkError =
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        !error.response;

      if (!isTimeoutOrNetworkError || attempt >= retryCount) {
        break; // Don't retry on non-timeout errors or if we've used all retries
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // If we got here, all retries failed
  console.error(
    "Error fetching dashboard stats after multiple attempts:",
    lastError
  );
  return {
    success: false,
    error: getErrorMessage(
      lastError,
      "Failed to fetch dashboard stats after multiple attempts"
    ),
    data: {
      totalDevices: 0,
      activeDevices: 0,
      lowBatteryDevices: 0,
      emptyDevices: 0,
      recentAlerts: [],
      deviceStatusSummary: {},
    },
  };
}
