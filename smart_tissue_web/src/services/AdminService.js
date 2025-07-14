import axios from "axios";
import config from "../config/config";

class AdminService {
  constructor() {
    this.authContext = null;
    this.baseURL = config.API_URL;
  }

  // Set auth context (similar to the React Native version)
  setAuthContext(authContext) {
    this.authContext = authContext;
    console.log("AdminService: Auth context set", {
      user: authContext?.user?.email,
      hasToken: !!authContext?.accessToken,
    });
  }

  // Helper to get auth headers
  getAuthHeaders(contentType = "application/json") {
    if (!this.authContext?.accessToken) {
      throw new Error("No access token available");
    }
    return {
      Authorization: `Bearer ${this.authContext.accessToken}`,
      ...(contentType && { "Content-Type": contentType }),
    };
  }

  // Helper to handle API errors
  handleError(error, defaultMessage) {
    console.error("AdminService API Error:", error);
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.response?.data?.username?.[0] ||
      error.message ||
      defaultMessage;
    throw new Error(message);
  }

  // Fetch users (with pagination support)
  async fetchUsers() {
    try {
      console.log("AdminService: Fetching users...");
      const response = await axios.get(`${this.baseURL}/auth/admin/users/`, {
        headers: this.getAuthHeaders(),
      });
      console.log("AdminService: Users fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch users");
    }
  }

  // Fetch user by ID (NEW from mobile)
  async fetchUserById(userId) {
    try {
      console.log(`AdminService: Fetching user ${userId}...`);
      const response = await axios.get(
        `${this.baseURL}/auth/admin/users/${userId}/`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: User fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch user");
    }
  }

  // Fetch admin statistics
  async fetchAdminStats() {
    try {
      console.log("AdminService: Fetching admin stats...");
      const response = await axios.get(`${this.baseURL}/auth/admin/stats/`, {
        headers: this.getAuthHeaders(),
      });
      console.log("AdminService: Stats fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch admin statistics");
    }
  }

  // Fetch admin profile
  async fetchAdminProfile() {
    try {
      console.log("AdminService: Fetching admin profile...");
      const response = await axios.get(`${this.baseURL}/auth/admin/profile/`, {
        headers: this.getAuthHeaders(),
      });
      console.log(
        "AdminService: Admin profile fetched successfully:",
        response.data
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch admin profile");
    }
  }

  // Update user status (activate/deactivate)
  async updateUserStatus(userId, isActive) {
    try {
      console.log(`AdminService: Updating user ${userId} status to:`, isActive);
      const response = await axios.patch(
        `${this.baseURL}/auth/admin/users/${userId}/`,
        { is_active: isActive },
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: User status updated successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to update user status");
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      console.log(`AdminService: Deleting user ${userId}...`);
      const response = await axios.delete(
        `${this.baseURL}/auth/admin/users/${userId}/delete/`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: User deleted successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to delete user");
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      console.log("AdminService: Creating new user...");
      const response = await axios.post(
        `${this.baseURL}/auth/admin/users/`,
        userData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: User created successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to create user");
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      console.log(`AdminService: Updating user ${userId}...`);
      const response = await axios.patch(
        `${this.baseURL}/auth/admin/users/${userId}/`,
        userData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: User updated successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to update user");
    }
  }

  // Update user role
  async updateUserRole(userId, newRole) {
    try {
      console.log(
        `AdminService: Updating user ${userId} role to ${newRole}...`
      );
      const response = await axios.patch(
        `${this.baseURL}/auth/admin/users/${userId}/role/`,
        { role: newRole },
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: User role updated successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to update user role");
    }
  }

  // Fetch app logs (updated to match mobile version)
  async fetchLogs() {
    try {
      console.log("AdminService: Fetching app logs...");
      const response = await axios.get(`${this.baseURL}/auth/admin/logs/`, {
        headers: this.getAuthHeaders(),
      });
      console.log("AdminService: App logs fetched successfully");
      // Return the results array from the paginated response
      const logs = response.data.results || response.data || [];
      return logs;
    } catch (error) {
      this.handleError(error, "Failed to fetch app logs");
    }
  }

  // Fetch logs by level (NEW from mobile)
  async fetchLogsByLevel(level) {
    try {
      console.log(`AdminService: Fetching logs by level: ${level}...`);
      const response = await axios.get(
        `${this.baseURL}/auth/admin/logs/level/${level}/`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data.results || response.data || [];
    } catch (error) {
      this.handleError(error, "Failed to fetch logs by level");
    }
  }

  // Fetch logs by date range (NEW from mobile)
  async fetchLogsByDateRange(startDate, endDate) {
    try {
      console.log("AdminService: Fetching logs by date range...");
      const response = await axios.get(
        `${this.baseURL}/auth/admin/logs/?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data.results || response.data || [];
    } catch (error) {
      this.handleError(error, "Failed to fetch logs by date range");
    }
  }

  // Fetch logs statistics (NEW from mobile)
  async fetchLogsStats() {
    try {
      console.log("AdminService: Fetching logs stats...");
      const response = await axios.get(
        `${this.baseURL}/auth/admin/logs/stats/`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch logs statistics");
    }
  }

  // Create log (NEW from mobile)
  async createLog(logData) {
    try {
      console.log("AdminService: Creating log...");
      const response = await axios.post(
        `${this.baseURL}/auth/admin/logs/create/`,
        logData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: Log created successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to create log");
    }
  }

  // Download/Export logs (NEW from mobile)
  async downloadLogs(format = "csv", filters = {}) {
    try {
      let endpoint = "/auth/admin/logs/export/csv/";
      if (format === "json") endpoint = "/auth/admin/logs/export/json/";
      if (format === "pdf") endpoint = "/auth/admin/logs/export/pdf/";

      // Build query string from filters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.append(key, value);
      });

      const url = `${this.baseURL}${endpoint}${
        params.toString() ? "?" + params.toString() : ""
      }`;

      console.log(`AdminService: Downloading logs as ${format}...`);
      const response = await axios.get(url, {
        headers: this.getAuthHeaders(),
        responseType: format === "pdf" ? "arraybuffer" : "text",
      });

      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to download logs");
    }
  }

  // Update admin profile
  async updateAdminProfile(profileData) {
    try {
      console.log("AdminService: Updating admin profile...");

      // Validate that we have actual data to update
      if (!profileData || Object.keys(profileData).length === 0) {
        throw new Error("No profile data provided for update");
      }

      const response = await axios.patch(
        `${this.baseURL}/auth/admin/profile/`,
        profileData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: Admin profile updated successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to update admin profile");
    }
  }

  // Upload profile picture (NEW from mobile)
  async uploadProfilePicture(imageFile) {
    try {
      console.log("AdminService: Uploading profile picture...");

      // Validate image file
      if (!imageFile) {
        throw new Error("No image file provided");
      }

      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await axios.post(
        `${this.baseURL}/auth/user/upload-picture/`,
        formData,
        {
          headers: this.getAuthHeaders("multipart/form-data"),
        }
      );

      console.log("AdminService: Profile picture uploaded successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to upload profile picture");
    }
  }

  // Password change methods (NEW from mobile)
  async sendPasswordChangeOTP() {
    try {
      console.log("AdminService: Sending password change OTP...");
      const response = await axios.post(
        `${this.baseURL}/auth/user/send-change-password-otp/`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: OTP sent successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to send OTP");
    }
  }

  async verifyPasswordChangeOTP(otp) {
    try {
      console.log("AdminService: Verifying password change OTP...");
      const response = await axios.post(
        `${this.baseURL}/auth/user/verify-password-change-otp/`,
        { otp },
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: OTP verified successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to verify OTP");
    }
  }

  async changePasswordWithOTP(oldPassword, newPassword, otp) {
    try {
      console.log("AdminService: Changing password with OTP...");
      const response = await axios.post(
        `${this.baseURL}/auth/user/change-password-with-otp/`,
        {
          old_password: oldPassword,
          new_password: newPassword,
          otp: otp,
        },
        {
          headers: this.getAuthHeaders(),
        }
      );
      console.log("AdminService: Password changed successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to change password");
    }
  }

  // Test authentication (NEW from mobile - useful for debugging)
  async testAuth() {
    try {
      console.log("AdminService: Testing authentication...");
      const response = await axios.get(`${this.baseURL}/auth/admin/profile/`, {
        headers: this.getAuthHeaders(),
      });
      console.log("AdminService: Authentication test successful");
      return response.data;
    } catch (error) {
      console.error("AdminService: Authentication test failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
const adminService = new AdminService();
export default adminService;
