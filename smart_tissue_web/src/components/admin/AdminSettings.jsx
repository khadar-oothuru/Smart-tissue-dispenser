import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  User,
  Lock,
  Bell,
  Settings as SettingsIcon,
  Save,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
} from "lucide-react";
import AdminService from "../../services/AdminService";

// Import new components
import UserManagement from "./UserManagement";
import AdminProfile from "./AdminProfile";
import AppLogs from "../Report/AppLogs.jsx";

const passwordSchema = yup.object().shape({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword")], "Passwords do not match"),
});

const AdminSettings = () => {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  // State management for UserManagement
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  // Set auth context in AdminService
  useEffect(() => {
    console.log("AdminSettings: Setting auth context, user:", auth.user?.email);
    console.log(
      "AdminSettings: Setting auth context, accessToken available:",
      !!auth.accessToken
    );
    AdminService.setAuthContext(auth);
  }, [auth]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  // API Functions
  const fetchUsers = useCallback(async () => {
    try {
      const data = await AdminService.fetchUsers();
      // Extract users array from paginated response
      const usersArray = data?.results || data || [];
      setUsers(usersArray);
    } catch (error) {
      console.error("AdminSettings: Error fetching users:", error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await AdminService.fetchAdminStats();
      setStats(data);
    } catch (error) {
      console.error("AdminSettings: Error fetching stats:", error);
    }
  }, []);

  const fetchAdminProfile = useCallback(async () => {
    try {
      console.log("AdminSettings: Fetching admin profile...");
      const data = await AdminService.fetchAdminProfile();
      console.log("AdminSettings: Admin profile fetched successfully:", !!data);
      setAdminProfile(data);
    } catch (error) {
      console.error("AdminSettings: Error fetching admin profile:", error);
      console.error("AdminSettings: Error message:", error.message);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([fetchUsers(), fetchStats(), fetchAdminProfile()]);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [fetchUsers, fetchStats, fetchAdminProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePasswordChange = async (data) => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    const result = await auth.changePassword({
      current_password: data.currentPassword,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    });

    if (result.success) {
      setMessage({ type: "success", text: "Password changed successfully!" });
      reset();
    } else {
      setMessage({ type: "error", text: result.error });
    }

    setLoading(false);
  };

  const tabs = [
    { id: "users", name: "Users", icon: Users },
    { id: "profile", name: "Profile", icon: User },
    { id: "security", name: "Security", icon: Lock },
    { id: "logs", name: "Logs", icon: FileText },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "system", name: "System", icon: SettingsIcon },
  ];

  const TabContent = () => {
    const commonProps = {
      style: "space-y-6",
    };

    switch (activeTab) {
      case "users":
        return (
          <UserManagement
            users={users}
            setUsers={setUsers}
            stats={stats}
            refreshing={refreshing}
            onRefresh={onRefresh}
            {...commonProps}
          />
        );

      case "profile":
        return (
          <AdminProfile
            adminProfile={adminProfile}
            fetchAdminProfile={fetchAdminProfile}
            {...commonProps}
          />
        );

      case "logs":
        return <AppLogs {...commonProps} />;

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Change Password
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Update your password to keep your account secure.
              </p>
            </div>

            {message.text && (
              <div
                className={`p-4 rounded-md ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex">
                  {message.type === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div className="ml-3">
                    <p
                      className={`text-sm ${
                        message.type === "success"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit(handlePasswordChange)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  {...register("currentPassword")}
                  type="password"
                  className={`mt-1 block w-full border ${
                    errors.currentPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  {...register("newPassword")}
                  type="password"
                  className={`mt-1 block w-full border ${
                    errors.newPassword ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className={`mt-1 block w-full border ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Changing...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Notification Preferences
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Configure how you receive notifications.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Device Alerts
                  </label>
                  <p className="text-sm text-gray-500">
                    Get alerts for device issues
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    System Updates
                  </label>
                  <p className="text-sm text-gray-500">
                    Notifications about system updates
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </button>
            </div>
          </div>
        );

      case "system":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                System Settings
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Configure system-wide settings.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data Retention Period (days)
                </label>
                <input
                  type="number"
                  defaultValue={30}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  defaultValue={20}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Maintenance Mode
                  </label>
                  <p className="text-sm text-gray-500">
                    Enable maintenance mode
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        );

      default:
        return (
          <UserManagement
            users={users}
            setUsers={setUsers}
            stats={stats}
            refreshing={refreshing}
            onRefresh={onRefresh}
            {...commonProps}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">
            Manage users, profile, and monitor logs
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <TabContent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
