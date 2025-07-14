import React, { useEffect, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Download,
  Share,
  X,
} from "lucide-react";

// Default theme colors fallback
const defaultThemeColors = {
  surface: "#ffffff",
  heading: "#000000",
  text: "#333333",
  border: "#e0e0e0",
  primary: "#007AFF",
};

// Custom Alert Modal Component
const CustomAlert = ({
  visible,
  onClose,
  title,
  message,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  type = "warning",
  themeColors = defaultThemeColors,
  isDark = false,
  children,
}) => {
  const modalRef = useRef(null);

  // Ensure themeColors has all required properties
  const safeThemeColors = {
    ...defaultThemeColors,
    ...themeColors,
  };

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [visible]);

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          color: "#34C759",
          backgroundColor: "#E8F5E8",
        };
      case "error":
        return {
          icon: XCircle,
          color: "#FF3B30",
          backgroundColor: "#FDF2F2",
        };
      case "info":
        return {
          icon: Info,
          color: "#007AFF",
          backgroundColor: "#E8F4FD",
        };
      case "download":
        return {
          icon: Download,
          color: "#FF9500",
          backgroundColor: "#FFF4E6",
        };
      default: // warning
        return {
          icon: AlertTriangle,
          color: "#FF9500",
          backgroundColor: "#FFF4E6",
        };
    }
  };

  const typeConfig = getTypeConfig();
  const IconComponent = typeConfig.icon;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        isDark ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`
          relative w-full max-w-sm mx-auto p-6 rounded-3xl shadow-2xl transform transition-all duration-300 scale-100
          ${isDark ? "border border-gray-700" : "border-transparent"}
        `}
        style={{ backgroundColor: safeThemeColors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon Section */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            backgroundColor: isDark
              ? `${typeConfig.color}20`
              : typeConfig.backgroundColor,
          }}
        >
          <IconComponent size={32} color={typeConfig.color} />
        </div>

        {/* Content Section */}
        <div className="text-center mb-6">
          <h3
            className="text-xl font-bold mb-2 leading-relaxed"
            style={{ color: safeThemeColors.heading }}
          >
            {title}
          </h3>
          <p
            className="text-base leading-relaxed opacity-80"
            style={{ color: safeThemeColors.text }}
          >
            {message}
          </p>
        </div>

        {/* Actions Section or Custom Content */}
        {children ? (
          children
        ) : (
          <div className="flex gap-3 w-full">
            {secondaryAction && (
              <button
                className={`
                  flex-1 py-3 px-3 rounded-xl border font-extrabold text-sm
                  transition-all duration-200 hover:scale-105 active:scale-95
                  ${
                    (secondaryAction && primaryAction) ||
                    (secondaryAction && tertiaryAction)
                      ? "py-2 px-2 min-h-11"
                      : "min-h-13"
                  }
                `}
                style={{
                  borderColor: safeThemeColors.border,
                  color: safeThemeColors.text,
                }}
                onClick={() => {
                  secondaryAction.onPress();
                  onClose();
                }}
              >
                {secondaryAction.text}
              </button>
            )}
            {primaryAction && (
              <button
                className={`
                  flex-1 py-3 px-3 rounded-xl font-extrabold text-sm text-white
                  shadow-lg transition-all duration-200 hover:scale-105 active:scale-95
                  ${
                    (secondaryAction && primaryAction) ||
                    (primaryAction && tertiaryAction)
                      ? "py-2 px-2 min-h-11"
                      : "min-h-13"
                  }
                `}
                style={{ backgroundColor: typeConfig.color }}
                onClick={() => {
                  primaryAction.onPress();
                  onClose();
                }}
              >
                {primaryAction.text}
              </button>
            )}
            {tertiaryAction && (
              <button
                className={`
                  flex-1 py-3 px-3 rounded-xl font-extrabold text-sm text-white
                  shadow-lg transition-all duration-200 hover:scale-105 active:scale-95
                  ${
                    primaryAction || secondaryAction
                      ? "py-2 px-2 min-h-11"
                      : "min-h-13"
                  }
                `}
                style={{ backgroundColor: safeThemeColors.primary }}
                onClick={() => {
                  tertiaryAction.onPress();
                  onClose();
                }}
              >
                {tertiaryAction.text}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Info Alert Modal Component (simpler version)
const InfoAlert = ({
  visible,
  onClose,
  title,
  message,
  themeColors = defaultThemeColors,
  isDark = false,
}) => {
  return (
    <CustomAlert
      visible={visible}
      onClose={onClose}
      title={title}
      message={message}
      type="info"
      themeColors={themeColors}
      isDark={isDark}
    />
  );
};

// Download Options Alert Component
const DownloadOptionsAlert = ({
  visible,
  onClose,
  format,
  onShare,
  onDownload,
  themeColors = defaultThemeColors,
  isDark = false,
}) => {
  const modalRef = useRef(null);

  // Ensure themeColors has all required properties
  const safeThemeColors = {
    ...defaultThemeColors,
    ...themeColors,
  };

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [visible]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        isDark ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`
          relative w-full max-w-sm mx-auto p-6 rounded-3xl shadow-2xl transform transition-all duration-300 scale-100
          ${isDark ? "border border-gray-700" : "border-transparent"}
        `}
        style={{ backgroundColor: safeThemeColors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button in top-right corner */}
        <button
          className={`
            absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
            transition-all duration-200 hover:scale-110 active:scale-95
            ${isDark ? "bg-red-500 bg-opacity-20" : "bg-red-500 bg-opacity-15"}
          `}
          onClick={onClose}
        >
          <X size={20} color="#FF3B30" />
        </button>

        {/* Icon Section */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            backgroundColor: isDark
              ? `${safeThemeColors.primary}20`
              : `${safeThemeColors.primary}15`,
          }}
        >
          <Download size={32} color={safeThemeColors.primary} />
        </div>

        {/* Content Section */}
        <div className="text-center mb-6">
          <h3
            className="text-xl font-bold mb-2 leading-relaxed"
            style={{ color: safeThemeColors.heading }}
          >
            Export {format.toUpperCase()} Data
          </h3>
          <p
            className="text-base leading-relaxed opacity-80"
            style={{ color: safeThemeColors.text }}
          >
            Choose how to save your analytics file:
          </p>
        </div>

        {/* Actions Section */}
        <div className="flex gap-3 w-full">
          <button
            className="flex-1 py-3 px-3 rounded-xl font-extrabold text-sm text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1 min-h-13"
            style={{ backgroundColor: safeThemeColors.primary }}
            onClick={() => {
              onDownload();
              onClose();
            }}
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo Component to showcase the alerts
const AlertDemo = () => {
  const [showCustomAlert, setShowCustomAlert] = React.useState(false);
  const [showInfoAlert, setShowInfoAlert] = React.useState(false);
  const [showDownloadAlert, setShowDownloadAlert] = React.useState(false);
  const [alertType, setAlertType] = React.useState("warning");
  const [isDark, setIsDark] = React.useState(false);

  const darkTheme = {
    surface: "#1a1a1a",
    heading: "#ffffff",
    text: "#e0e0e0",
    border: "#333333",
    primary: "#007AFF",
  };

  const lightTheme = {
    surface: "#ffffff",
    heading: "#000000",
    text: "#333333",
    border: "#e0e0e0",
    primary: "#007AFF",
  };

  const currentTheme = isDark ? darkTheme : lightTheme;

  return (
    <div
      className={`min-h-screen p-8 transition-colors duration-300 ${
        isDark ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1
            className={`text-4xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Custom Alert Components
          </h1>
          <p
            className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            React.js + Tailwind CSS version of the React Native alerts
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              isDark
                ? "bg-yellow-500 text-black hover:bg-yellow-400"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {/* Controls */}
        <div
          className={`p-6 rounded-xl mb-8 ${
            isDark ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Demo Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Alert Type
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowCustomAlert(true)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              Show Custom Alert
            </button>
            <button
              onClick={() => setShowInfoAlert(true)}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              Show Info Alert
            </button>
            <button
              onClick={() => setShowDownloadAlert(true)}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              Show Download Alert
            </button>
          </div>
        </div>

        {/* Features List */}
        <div
          className={`p-6 rounded-xl ${
            isDark ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                ✨ Animations
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Smooth scale animations and transitions
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                🎨 Theming
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Dark/light mode support with custom colors
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                🔧 Customizable
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Multiple alert types and action buttons
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                📱 Responsive
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Works great on all screen sizes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Components */}
      <CustomAlert
        visible={showCustomAlert}
        onClose={() => setShowCustomAlert(false)}
        title="Custom Alert"
        message="This is a customizable alert with multiple action buttons and themes."
        type={alertType}
        themeColors={currentTheme}
        isDark={isDark}
        primaryAction={{
          text: "Confirm",
          onPress: () => alert("Primary action pressed!"),
        }}
        secondaryAction={{
          text: "Cancel",
          onPress: () => alert("Secondary action pressed!"),
        }}
        tertiaryAction={{
          text: "More",
          onPress: () => alert("Tertiary action pressed!"),
        }}
      />

      <InfoAlert
        visible={showInfoAlert}
        onClose={() => setShowInfoAlert(false)}
        title="Information"
        message="This is a simple info alert component for displaying information to users."
        themeColors={currentTheme}
        isDark={isDark}
      />

      <DownloadOptionsAlert
        visible={showDownloadAlert}
        onClose={() => setShowDownloadAlert(false)}
        format="csv"
        onShare={() => alert("Share action pressed!")}
        onDownload={() => alert("Download action pressed!")}
        themeColors={currentTheme}
        isDark={isDark}
      />
    </div>
  );
};

export { CustomAlert, InfoAlert, DownloadOptionsAlert };
export default AlertDemo;
