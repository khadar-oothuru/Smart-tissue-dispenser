import React from "react";
import { Shield, User, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const RoleChangeModal = ({ visible, user, onRoleUpdate, onClose }) => {
  const { themeColors } = useTheme();
  // Modal style config (mimic CustomAlert)
  const isDark = document.documentElement.classList.contains("dark");
  const safeThemeColors = {
    surface: isDark ? "#1a1a1a" : "#fff",
    heading: isDark ? "#fff" : "#000",
    text: isDark ? "#e0e0e0" : "#333",
    border: isDark ? "#333" : "#e0e0e0",
    primary: themeColors?.primary || "#007AFF",
    ...(themeColors || {}),
  };

  if (!visible || !user) return null;

  const handleRoleChange = (newRole) => {
    if (user.role !== newRole) {
      onRoleUpdate(newRole);
      // Don't close here - let parent handle closing after successful API call
    } else {
      onClose(); // Close if same role selected
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        isDark ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"
      }`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-auto p-8 rounded-[2.2rem] shadow-2xl transform transition-all duration-300 scale-100"
        style={{ backgroundColor: safeThemeColors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button in top-right corner */}
        <button
          className={`absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 bg-red-500 bg-opacity-90`}
          onClick={onClose}
          style={{ boxShadow: "0 2px 8px 0 rgba(255,0,0,0.10)" }}
        >
          <X size={24} color="#fff" />
        </button>

        {/* Content Section */}
        <div className="text-center mb-8 mt-2">
          <h3
            className="text-2xl font-extrabold mb-3 leading-relaxed tracking-tight"
            style={{ color: safeThemeColors.heading }}
          >
            Change User Role
          </h3>
          <p
            className="text-lg leading-relaxed opacity-90 mb-1"
            style={{ color: safeThemeColors.text }}
          >
            Username: <span className="font-bold">{user.username}</span>
          </p>
          <p
            className="text-lg leading-relaxed opacity-90 mb-4"
            style={{ color: safeThemeColors.text }}
          >
            Current role:{" "}
            <span className="font-bold">{user.role?.toUpperCase()}</span>
          </p>
        </div>

        {/* Role Options */}
        <div className="space-y-5 mb-8">
          {/* User Role Option */}
          <button
            className={`w-full flex items-center p-5 rounded-2xl border-2 transition-all duration-150 text-left relative group focus:outline-none ${
              user.role === "user"
                ? "bg-[#181f2e] border-blue-500 shadow-lg scale-[1.01]"
                : "bg-[#23272f] border-[#3a3f4b] hover:border-blue-400 hover:bg-[#232f3e]"
            }`}
            onClick={() => handleRoleChange("user")}
            style={{ fontWeight: 600, minHeight: 90 }}
          >
            <User className="h-6 w-6 text-blue-400 mr-4" />
            <div className="flex-1">
              <p className="font-bold text-lg text-white mb-1">User</p>
              <p className="text-base text-gray-400">
                Standard user with basic permissions
              </p>
            </div>
            {user.role === "user" && (
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </button>

          {/* Admin Role Option */}
          <button
            className={`w-full flex items-center p-5 rounded-2xl border-2 transition-all duration-150 text-left relative group focus:outline-none ${
              user.role === "admin"
                ? "bg-[#181f2e] border-purple-500 shadow-lg scale-[1.01]"
                : "bg-[#23272f] border-[#3a3f4b] hover:border-purple-400 hover:bg-[#232f3e]"
            }`}
            onClick={() => handleRoleChange("admin")}
            style={{ fontWeight: 600, minHeight: 90 }}
          >
            <Shield className="h-6 w-6 text-purple-400 mr-4" />
            <div className="flex-1">
              <p className="font-bold text-lg text-white mb-1">Admin</p>
              <p className="text-base text-gray-400">
                Full access to system management
              </p>
            </div>
            {user.role === "admin" && (
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-purple-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 text-base font-semibold text-white bg-[#3a3f4b] rounded-xl hover:bg-[#23272f] transition-all duration-150"
            style={{ minWidth: 120 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeModal;
