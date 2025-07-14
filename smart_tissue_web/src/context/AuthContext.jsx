import React, { useState, useEffect, createContext, useCallback } from "react";
import axios from "axios";
import config from "../config/config";
import {
  login as apiLogin,
  register as apiRegister,
  forgotPassword as apiForgotPassword,
  refreshToken as apiRefreshToken,
  getProfile as apiGetProfile,
  googleLogin as apiGoogleLogin,
  changePassword as apiChangePassword,
} from "../services/api";

// Create the AuthContext
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Network connectivity and retry logic
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState("checking"); // 'checking', 'online', 'offline'

  console.log("AuthProvider rendering with:", {
    user,
    loading,
    isAuthenticated,
    accessToken: accessToken ? "present" : "null",
  });

  // API base URL - you can configure this based on your backend
  const API_URL = config.API_URL;

  // Storage utilities (web equivalent of AsyncStorage)
  const storeData = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error storing data:", error);
    }
  };

  const getData = (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Error retrieving data:", error);
      return null;
    }
  };

  const removeData = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing data:", error);
    }
  };

  // Logout function with useCallback to prevent dependency issues
  const logout = useCallback(() => {
    // Clear localStorage
    removeData("accessToken");
    removeData("refreshToken");
    removeData("userData");

    // Clear axios default headers
    delete axios.defaults.headers.common["Authorization"];

    // Clear state
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
  }, []);

  // Token refresh function
  const refreshAccessToken = useCallback(async () => {
    try {
      const refresh = getData("refreshToken");
      if (!refresh) {
        throw new Error("No refresh token available");
      }

      const response = await apiRefreshToken(refresh);
      const { access } = response;

      // Store new access token
      storeData("accessToken", access);
      setAccessToken(access);

      // Update axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;

      return access;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      throw error;
    }
  }, [logout]);

  // Configure axios defaults with error handling
  useEffect(() => {
    const setupAPI = async () => {
      try {
        // Test API connectivity
        axios.defaults.baseURL = API_URL;
        axios.defaults.timeout = 95000;

        console.log("✅ API setup completed:", API_URL);
        setApiStatus("online");
      } catch (error) {
        console.warn("⚠️ API setup issue:", error.message);
        setApiStatus("offline");
      }
    };

    setupAPI();
  }, [API_URL]);

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor to add token to requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refreshToken
        ) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken, refreshAccessToken, logout]);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = getData("accessToken");
    const refresh = getData("refreshToken");
    const userData = getData("userData");

    if (token && userData) {
      try {
        setUser(userData);
        setAccessToken(token);
        setRefreshToken(refresh);
        setIsAuthenticated(true);
        // Set default authorization header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("✅ User authenticated from storage");
      } catch (error) {
        console.error("❌ Error loading user data:", error);
        logout();
      }
    } else {
      console.log("ℹ️ No stored authentication found");
    }

    setLoading(false);
  }, [logout]);

  // Update user data
  const updateUserData = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    storeData("userData", updatedUser);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole("admin");
  };

  // Check if user is technician
  const isTechnician = () => {
    return hasRole("technician");
  };

  // Check if user is user
  const isUser = () => {
    return hasRole("user");
  };

  const login = async (credentials) => {
    try {
      setLoading(true);

      // Use the API service - it returns tokens directly
      const response = await apiLogin(credentials.email, credentials.password);

      // The backend returns { access, refresh } directly
      const { access, refresh } = response;

      // Get user data using the access token
      const userResponse = await apiGetProfile(access);

      const userData = userResponse;

      // Store tokens and user data using localStorage
      storeData("accessToken", access);
      storeData("refreshToken", refresh);
      storeData("userData", userData);

      // Set state
      setUser(userData);
      setAccessToken(access);
      setRefreshToken(refresh);
      setIsAuthenticated(true);

      // Set default authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In method
  const loginWithGoogle = async (googleToken) => {
    try {
      setLoading(true);

      const response = await apiGoogleLogin(googleToken);

      const { access, refresh, user: userData } = response;

      // Store tokens and user data
      storeData("accessToken", access);
      storeData("refreshToken", refresh);
      storeData("userData", userData);

      // Set state
      setUser(userData);
      setAccessToken(access);
      setRefreshToken(refresh);
      setIsAuthenticated(true);

      // Set default authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;

      return { success: true, user: userData };
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        error: error.message || "Google login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiRegister(userData);

      // API returns success message directly
      return {
        success: true,
        message: response.message || "Registration successful",
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await apiForgotPassword(email);

      // API returns success message directly
      return {
        success: true,
        message: response.message || "Password reset email sent",
      };
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        error: error.message || "Failed to send reset email. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      const response = await apiChangePassword(
        accessToken,
        oldPassword,
        newPassword
      );

      // API returns success message directly
      return {
        success: true,
        message: response.message || "Password changed successfully",
      };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        error: error.message || "Failed to change password. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  // Network connectivity and retry logic
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    accessToken,
    refreshToken,
    isOnline,
    apiStatus,
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    changePassword,
    refreshAccessToken,
    updateUserData,
    hasRole,
    isAdmin,
    isTechnician,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
export default AuthProvider;
