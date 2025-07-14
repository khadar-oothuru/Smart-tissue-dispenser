import React from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Settings,
  Activity,
  X,
  Maximize,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const UserProfileModal = ({ visible, user, onClose }) => {
  const { themeColors } = useTheme();
  const [showFullImage, setShowFullImage] = React.useState(false);

  if (!visible || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    color = "text-gray-700 dark:text-gray-300",
  }) => (
    <div className="flex items-center mb-4">
      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm font-medium ${color}`}>{value}</p>
      </div>
    </div>
  );

  // Modal style config (mimic RoleChangeModal)
  const isDark = document.documentElement.classList.contains("dark");
  const safeThemeColors = {
    surface: isDark ? "#181f2e" : "#fff",
    heading: isDark ? "#fff" : "#000",
    text: isDark ? "#e0e0e0" : "#333",
    border: isDark ? "#333" : "#e0e0e0",
    primary: themeColors?.primary || "#007AFF",
    ...(themeColors || {}),
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        isDark ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"
      }`}
    >
      <div
        className="relative w-full max-w-xl mx-auto p-10 rounded-[2.2rem] shadow-2xl transform transition-all duration-300 scale-100 flex flex-col max-h-[92vh] bg-[#181f2e] dark:bg-[#181f2e]"
        style={{ backgroundColor: safeThemeColors.surface }}
      >
        {/* Close button in top-right corner */}
        <button
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 bg-red-500 bg-opacity-90 z-10"
          onClick={onClose}
          style={{ boxShadow: "0 2px 8px 0 rgba(255,0,0,0.10)" }}
        >
          <X size={24} color="#fff" />
        </button>

        {/* Header */}
        <div className="text-center mb-8 mt-2">
          <h3
            className="text-2xl font-extrabold mb-3 leading-relaxed tracking-tight"
            style={{ color: safeThemeColors.heading }}
          >
            User Profile {user.username ? `- ${user.username}` : ""}
          </h3>
        </div>

        {/* Body */}
        <div className="px-2 pb-2">
          {/* Profile Picture, Name, and Badge Side by Side */}
          <div className="flex flex-row items-center gap-6 mb-6 justify-center">
            <div className="relative">
              {user.profile_picture ? (
                <div className="relative">
                  <img
                    src={user.profile_picture}
                    alt={user.username}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#23272f] shadow-lg"
                  />
                  <button
                    onClick={() => setShowFullImage(true)}
                    className="absolute top-0 right-0 bg-gray-800 bg-opacity-70 rounded-full p-1.5 hover:scale-110 transition-all"
                  >
                    <Maximize className="h-4 w-4 text-white" />
                  </button>
                  <div
                    className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-[#23272f] ${
                      user.is_active ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#23272f] flex items-center justify-center relative shadow-lg">
                  <User className="h-12 w-12 text-gray-500" />
                  <div
                    className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-[#23272f] ${
                      user.is_active ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col items-start gap-1">
              <h4 className="text-xl font-bold text-white mb-0 leading-tight">
                {user.username}
              </h4>
              <p className="text-gray-400 mb-0 text-base">@{user.username}</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                  user.role === "admin"
                    ? "bg-purple-900/40 text-purple-300"
                    : "bg-blue-900/40 text-blue-300"
                }`}
              >
                {user.role === "admin" ? (
                  <Shield className="h-4 w-4 mr-1" />
                ) : (
                  <User className="h-4 w-4 mr-1" />
                )}
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>

          {/* User Information */}
          <div className="mb-8">
            <h5 className="text-lg font-bold text-white mb-5">
              User Information
            </h5>

            <InfoItem
              icon={Mail}
              label="Email"
              value={user.email || "Not provided"}
            />

            <InfoItem
              icon={User}
              label="Username"
              value={user.username || "Not provided"}
            />

            <InfoItem
              icon={Calendar}
              label="Date Joined"
              value={formatDate(user.date_joined)}
            />

            <InfoItem
              icon={Clock}
              label="Last Login"
              value={formatDate(user.last_login) || "Never"}
            />

            <InfoItem
              icon={CheckCircle}
              label="Account Status"
              value={user.is_active ? "Active" : "Inactive"}
              color={user.is_active ? "text-green-400" : "text-red-400"}
            />

            {user.is_staff !== undefined && (
              <InfoItem
                icon={Shield}
                label="Staff Status"
                value={user.is_staff ? "Yes" : "No"}
                color={user.is_staff ? "text-blue-400" : "text-gray-400"}
              />
            )}

            {user.is_superuser !== undefined && (
              <InfoItem
                icon={Settings}
                label="Superuser"
                value={user.is_superuser ? "Yes" : "No"}
                color={user.is_superuser ? "text-red-400" : "text-gray-400"}
              />
            )}
          </div>

          {/* Additional Stats if available */}
          {(user.device_count || user.last_activity) && (
            <div>
              <h5 className="text-lg font-bold text-white mb-5">Activity</h5>

              {user.device_count && (
                <InfoItem
                  icon={Activity}
                  label="Devices"
                  value={`${user.device_count} connected`}
                />
              )}

              {user.last_activity && (
                <InfoItem
                  icon={Activity}
                  label="Last Activity"
                  value={formatDate(user.last_activity)}
                />
              )}
            </div>
          )}
        </div>

        {/* Full Screen Image Modal */}
        {showFullImage && user.profile_picture && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setShowFullImage(false)}
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={user.profile_picture}
              alt={user.username}
              className="max-w-[90%] max-h-[90vh] object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
