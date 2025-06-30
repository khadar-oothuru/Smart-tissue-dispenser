import config from "../config/config";
import axios from "axios";

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
    error.response?.data?.username?.[0] ||
    error.message ||
    fallbackMessage
  );
};

class AdminService {
  constructor(authContext = null) {
    this.authContext = authContext;
  }

  setAuthContext(authContext) {
    this.authContext = authContext;
  }
  async getAuthToken() {
    try {
      // Try to get token from authContext first
      if (this.authContext) {
        if (this.authContext.accessToken) {
          console.log("AdminService: Using accessToken from context");
          return this.authContext.accessToken;
        }
        if (this.authContext.token) {
          console.log("AdminService: Using token from context");
          return this.authContext.token;
        }
      }

      // Fallback to AsyncStorage for backward compatibility
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      const token = await AsyncStorage.getItem("accessToken");

      console.log("AdminService: Using token from AsyncStorage:", !!token);
      if (token) {
        console.log("AdminService: Token length:", token.length);
      }

      return token;
    } catch (error) {
      console.error("AdminService: Error getting auth token:", error);
      return null;
    }
  }
  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }

    console.log("AdminService: Making request to:", endpoint);
    console.log(
      "AdminService: Using token:",
      token ? "Token present" : "No token"
    );

    const defaultOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const response = await fetch(`${config.API_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
    });

    console.log("AdminService: Response status:", response.status);

    if (!response.ok) {
      let errorData = {};
      try {
        // Only try to parse JSON if response has content
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        }
      } catch (_parseError) {
        // Ignore JSON parsing errors for error responses
      }
      console.error(
        "AdminService: Request failed:",
        response.status,
        errorData
      );

      // Use the helper function to extract meaningful error messages
      const errorMessage = getErrorMessage(
        { response: { data: errorData } },
        `HTTP ${response.status}`
      );
      throw new Error(errorMessage);
    }

    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get("content-type");
    if (
      response.status === 204 ||
      !contentType ||
      !contentType.includes("application/json")
    ) {
      return {}; // Return empty object for successful operations with no content
    }

    return response.json();
  } // User Management APIs
  async fetchUsers() {
    return this.makeAuthenticatedRequest("/auth/admin/users/");
  }

  async fetchUserById(userId) {
    return this.makeAuthenticatedRequest(`/auth/admin/users/${userId}/`);
  }

  async updateUserRole(userId, role) {
    return this.makeAuthenticatedRequest(`/auth/admin/users/${userId}/role/`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId) {
    return this.makeAuthenticatedRequest(
      `/auth/admin/users/${userId}/delete/`,
      {
        method: "DELETE",
      }
    );
  }

  // Admin Profile APIs
  async fetchAdminProfile() {
    return this.makeAuthenticatedRequest("/auth/admin/profile/");
  }
  async updateAdminProfile(profileData) {
    console.log("AdminService: Updating admin profile with data:", profileData);
    console.log("AdminService: Profile data keys:", Object.keys(profileData));
    console.log(
      "AdminService: Profile data values:",
      Object.values(profileData)
    );

    // Validate that we have actual data to update
    if (!profileData || Object.keys(profileData).length === 0) {
      throw new Error("No profile data provided for update");
    }

    try {
      return this.makeAuthenticatedRequest("/auth/admin/profile/", {
        method: "PATCH",
        body: JSON.stringify(profileData),
      });
    } catch (error) {
      console.error("AdminService: Profile update error:", error);
      throw new Error(getErrorMessage(error, "Failed to update admin profile"));
    }
  }

  // Statistics APIs
  async fetchAdminStats() {
    return this.makeAuthenticatedRequest("/auth/admin/stats/");
  }

  // Logs APIs
  async fetchLogs() {
    try {
      console.log("AdminService: fetchLogs - Starting API call");
      const response = await this.makeAuthenticatedRequest("/auth/admin/logs/");
      console.log("AdminService: fetchLogs - Raw response:", response);
      console.log("AdminService: fetchLogs - Response type:", typeof response);
      console.log("AdminService: fetchLogs - Has results:", !!response.results);
      console.log(
        "AdminService: fetchLogs - Results type:",
        typeof response.results
      );
      console.log(
        "AdminService: fetchLogs - Results is array:",
        Array.isArray(response.results)
      );

      // Return the results array from the paginated response
      const logs = response.results || response || [];
      console.log("AdminService: fetchLogs - Returning logs:", logs);
      console.log("AdminService: fetchLogs - Logs count:", logs.length);
      return logs;
    } catch (error) {
      console.error("AdminService: Error fetching logs:", error);
      console.error("AdminService: Error message:", error.message);
      console.error("AdminService: Error response:", error.response);
      throw error;
    }
  }

  async fetchLogsByLevel(level) {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/auth/admin/logs/level/${level}/`
      );
      return response.results || response || [];
    } catch (error) {
      console.error("AdminService: Error fetching logs by level:", error);
      throw error;
    }
  }

  async fetchLogsByDateRange(startDate, endDate) {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/auth/admin/logs/?start_date=${startDate}&end_date=${endDate}`
      );
      return response.results || response || [];
    } catch (error) {
      console.error("AdminService: Error fetching logs by date range:", error);
      throw error;
    }
  }

  async fetchLogsStats() {
    try {
      return await this.makeAuthenticatedRequest("/auth/admin/logs/stats/");
    } catch (error) {
      console.error("AdminService: Error fetching log stats:", error);
      throw error;
    }
  }

  // Download/Export Logs
  async downloadLogs(format = "csv", filters = {}) {
    // Use the new endpoints
    let url = "/admin/logs/export/csv/";
    if (format === "json") url = "/admin/logs/export/json/";
    if (format === "pdf") url = "/admin/logs/export/pdf/";
    return await AdminService.downloadLogsFromUrl(
      url,
      filters,
      this.authContext
    );
  }

  static async downloadLogsFromUrl(url, filters = {}, authContext = null) {
    // Build query string from filters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.append(key, value);
    });
    const fullUrl = `${config.API_URL}${url}${
      params.toString() ? "?" + params.toString() : ""
    }`;
    // Try to get token from authContext or from singleton instance
    let token = null;
    if (authContext) {
      token = authContext.accessToken || authContext.token;
    }
    if (!token && AdminService.instance && AdminService.instance.authContext) {
      token =
        AdminService.instance.authContext.accessToken ||
        AdminService.instance.authContext.token;
    }
    if (!token) throw new Error("Authentication token not found");
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`
      );
    }
    if (url.endsWith("/pdf/")) {
      return await response.arrayBuffer();
    }
    return await response.text();
  }

  async createLog(logData) {
    try {
      return await this.makeAuthenticatedRequest("/auth/admin/logs/create/", {
        method: "POST",
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error("AdminService: Error creating log:", error);
      throw error;
    }
  }

  // Profile Picture Upload
  async uploadProfilePicture(imageFile) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }

    console.log("AdminService: Uploading profile picture...");
    console.log("AdminService: Image file:", {
      uri: imageFile.uri,
      type: imageFile.type,
      name: imageFile.name || imageFile.fileName,
    });

    // Validate image file
    if (!imageFile.uri) {
      throw new Error("Invalid image file - no URI provided");
    }

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageFile.uri,
        type: "image/jpeg",
        name: "profile.jpg",
      });

      console.log("AdminService: Making axios request to upload image");
      const response = await axios.post(
        `${config.API_URL}/auth/user/upload-picture/`,
        formData,
        {
          headers: authHeaders(token, "multipart/form-data"),
        }
      );

      console.log("AdminService: Upload successful");
      return response.data;
    } catch (error) {
      console.error("AdminService: Upload error:", error);
      throw new Error(
        getErrorMessage(error, "Failed to upload profile picture")
      );
    }
  }

  // Password Change APIs
  async sendPasswordChangeOTP() {
    console.log("AdminService: Sending password change OTP...");
    try {
      const result = await this.makeAuthenticatedRequest(
        "/auth/user/send-change-password-otp/",
        {
          method: "POST",
        }
      );
      console.log("AdminService: OTP sent successfully");
      return result;
    } catch (error) {
      console.error("AdminService: Failed to send OTP:", error);
      throw error;
    }
  }

  async verifyPasswordChangeOTP(otp) {
    console.log("AdminService: Verifying password change OTP...");
    try {
      const result = await this.makeAuthenticatedRequest(
        "/auth/user/verify-password-change-otp/",
        {
          method: "POST",
          body: JSON.stringify({ otp }),
        }
      );
      console.log("AdminService: OTP verified successfully");
      return result;
    } catch (error) {
      console.error("AdminService: Failed to verify OTP:", error);
      throw error;
    }
  }

  async changePasswordWithOTP(oldPassword, newPassword, otp) {
    console.log("AdminService: Changing password with OTP...");
    try {
      const result = await this.makeAuthenticatedRequest(
        "/auth/user/change-password-with-otp/",
        {
          method: "POST",
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
            otp: otp,
          }),
        }
      );
      console.log("AdminService: Password changed successfully");
      return result;
    } catch (error) {
      console.error("AdminService: Failed to change password:", error);
      throw error;
    }
  }

  // Debug method to test authentication
  async testAuth() {
    try {
      const token = await this.getAuthToken();
      console.log("AdminService: Test auth - Token available:", !!token);

      if (token) {
        console.log("AdminService: Test auth - Making test request");
        const response = await this.makeAuthenticatedRequest(
          "/auth/admin/profile/"
        );
        console.log("AdminService: Test auth - Success:", !!response);
        return response;
      }

      return null;
    } catch (error) {
      console.error("AdminService: Test auth failed:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
AdminService.instance = new AdminService();
export default AdminService.instance;
