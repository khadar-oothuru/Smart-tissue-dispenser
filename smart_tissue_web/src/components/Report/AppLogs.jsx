import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Info,
  AlertTriangle,
  XCircle,
  Bug,
  CheckCircle,
  AlertCircle,
  FileText,
  Share2,
} from "lucide-react";
import { useTheme } from "../../hooks/useThemeContext";
import { useAuth } from "../../hooks/useAuth";
import AdminService from "../../services/AdminService";
import { CustomAlert } from "../common/CustomAlert"; // Import from common
import Spinner from "../common/Spinner";

// Helper function for ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const AppLogs = ({ className = "" }) => {
  const { themeColors, isDark } = useTheme();
  const auth = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadAlert, setDownloadAlert] = useState({
    visible: false,
    format: "",
    onShare: null,
    onDownload: null,
  });
  const [formatPickerVisible, setFormatPickerVisible] = useState(false);

  // Define log level colors and icons
  const logLevelColors = {
    INFO: "text-blue-600 border-blue-600 bg-blue-50",
    WARNING: "text-yellow-600 border-yellow-600 bg-yellow-50",
    ERROR: "text-red-600 border-red-600 bg-red-50",
    DEBUG: "text-gray-600 border-gray-600 bg-gray-50",
    SUCCESS: "text-green-600 border-green-600 bg-green-50",
  };

  const logLevelIcons = {
    INFO: Info,
    WARNING: AlertTriangle,
    ERROR: XCircle,
    DEBUG: Bug,
    SUCCESS: CheckCircle,
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("AppLogs: Fetching logs...");
      const data = await AdminService.fetchLogs();
      let logsArr = [];
      if (data && Array.isArray(data)) {
        logsArr = data;
      } else if (data && data.results && Array.isArray(data.results)) {
        logsArr = data.results;
      }
      console.log("Fetched logs (final):", logsArr);
      setLogs(logsArr);
      setFilteredLogs(logsArr);
    } catch (error) {
      console.error("AppLogs: Error fetching logs:", error);
      setError("Failed to load logs. Please try again.");
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth.loading && auth.accessToken) {
      AdminService.setAuthContext(auth);
      fetchLogs();
    }
  }, [auth, fetchLogs]);

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(
        logs.filter(
          (log) =>
            log.level &&
            log.level.toString().toUpperCase() === activeFilter.toUpperCase()
        )
      );
    }
  }, [activeFilter, logs]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderFilterButton = (level, label) => {
    const isActive = activeFilter === level;
    // Use theme primary color for 'all' and active buttons
    const primaryBg =
      themeColors && themeColors.primary ? themeColors.primary : "bg-blue-600";
    const primaryText =
      themeColors && themeColors.primaryText
        ? themeColors.primaryText
        : "text-white";
    const cardBg =
      themeColors && themeColors.surface ? themeColors.surface : "#ffffff";
    const colorClass =
      level === "all" ? primaryBg + " " + primaryText : logLevelColors[level];

    // Button style for inactive state: use card bg and default text
    const inactiveStyle = !isActive
      ? {
          backgroundColor: cardBg,
          color: isDark ? "#e0e0e0" : "#333333",
          border: `1px solid ${
            themeColors && themeColors.border ? themeColors.border : "#e0e0e0"
          }`,
        }
      : {};

    // Button style for active 'all' state: use theme primary
    const activeAllStyle =
      level === "all" && isActive && themeColors && themeColors.primary
        ? {
            backgroundColor: themeColors.primary.replace("bg-", "#"),
            color: themeColors.primaryText
              ? themeColors.primaryText.replace("text-", "#")
              : undefined,
          }
        : {};

    return (
      <button
        key={level}
        onClick={() => setActiveFilter(level)}
        className={`
          px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
          ${
            isActive
              ? level === "all"
                ? `${primaryBg} ${primaryText}`
                : colorClass.split(" ")[2] + " " + colorClass.split(" ")[0]
              : ""
          }
        `}
        style={isActive ? activeAllStyle : inactiveStyle}
      >
        {label}
      </button>
    );
  };

  const renderLogItem = (log, idx) => {
    const level = log.level ? log.level.toString().toUpperCase() : "INFO";
    const Icon = logLevelIcons[level] || Info;
    const colorClass = logLevelColors[level] || logLevelColors.INFO;
    // Use theme surface for card bg, and theme border for border color (like CustomAlert)
    const cardBg =
      themeColors && themeColors.surface ? themeColors.surface : "#ffffff";
    const cardBorder =
      themeColors && themeColors.border ? themeColors.border : "#e0e0e0";
    return (
      <div
        key={log.id || idx}
        className={`
          p-5 rounded-3xl mb-4 shadow-sm hover:shadow-md transition-shadow
        `}
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Icon size={18} className={colorClass.split(" ")[0]} />
            <span
              className={`text-sm font-semibold uppercase ${
                colorClass.split(" ")[0]
              }`}
            >
              {level}
            </span>
          </div>
          <span
            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {formatTimestamp(log.timestamp || log.created_at || Date.now())}
          </span>
        </div>

        <p
          className={`text-base font-medium mb-3 leading-relaxed ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {log.message || log.msg || "No message"}
        </p>

        <div className="space-y-1">
          <p
            className="text-sm font-medium"
            style={{
              color:
                themeColors && themeColors.primary
                  ? themeColors.primary.replace("bg-", "#")
                  : "#2563eb",
            }}
          >
            {log.source || "Unknown Source"}
          </p>
          {(log.details || log.detail) && (
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {log.details || log.detail}
            </p>
          )}
        </div>
      </div>
    );
  };

  const handleFormatSelect = (format) => {
    setFormatPickerVisible(false);
    handleDownload(format);
  };

  const showDownloadOptionsAlert = useCallback(
    (format, onShare, onDownload) => {
      setTimeout(() => {
        setDownloadAlert({
          visible: true,
          format,
          onShare: () => {
            setDownloadAlert((prev) => ({ ...prev, visible: false }));
            onShare();
          },
          onDownload: () => {
            setDownloadAlert((prev) => ({ ...prev, visible: false }));
            onDownload();
          },
        });
      }, 50);
    },
    []
  );

  const closeDownloadAlert = useCallback(() => {
    if (downloading) {
      setDownloading(false);
    }
    setDownloadAlert((prev) => ({ ...prev, visible: false }));
  }, [downloading]);

  const handleDownload = async (format) => {
    if (downloading) return false;

    return new Promise((resolve) => {
      showDownloadOptionsAlert(
        format,
        () => {
          processDownload(format, "share")
            .then(resolve)
            .catch(() => resolve(false));
        },
        () => {
          processDownload(format, "download")
            .then(resolve)
            .catch(() => resolve(false));
        }
      );
    });
  };

  const testConnection = async () => {
    try {
      console.log("AppLogs: Testing connection to backend...");
      await AdminService.fetchLogs();
      console.log("AppLogs: Connection test successful");
      return true;
    } catch (error) {
      console.error("AppLogs: Connection test failed:", error);
      return false;
    }
  };

  const processDownload = async (format, action) => {
    if (downloading) return false;

    try {
      setDownloading(true);

      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error(
          "Cannot connect to server. Please make sure the backend server is running on 192.168.31.101:8000 and try again."
        );
      }

      const filters = {
        level: activeFilter !== "all" ? activeFilter : undefined,
      };

      const { mimeType, ext } = getMimeTypeAndExtension(format);
      const fileName = `logs_${new Date().toISOString().split("T")[0]}.${ext}`;

      // Use AdminService.downloadLogs
      const fileContent = await AdminService.downloadLogs(format, filters);

      let blob;
      if (format === "pdf" && fileContent instanceof ArrayBuffer) {
        blob = new Blob([fileContent], { type: mimeType });
      } else {
        blob = new Blob([fileContent], { type: mimeType });
      }

      const downloadUrl = URL.createObjectURL(blob);

      if (action === "download") {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (action === "share") {
        if (navigator.share) {
          try {
            const file = new File([blob], fileName, { type: mimeType });
            await navigator.share({
              files: [file],
              title: "Application Logs",
              text: "Sharing application logs",
            });
          } catch (err) {
            // Fallback to download if share fails
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = fileName;
            link.click();
          }
        } else {
          // Fallback to download if share is not supported
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = fileName;
          link.click();
        }
      }

      URL.revokeObjectURL(downloadUrl);
      return true;
    } catch (error) {
      setError(error.message || "Download failed. Please try again.");
      throw error;
    } finally {
      setDownloading(false);
    }
  };

  const getMimeTypeAndExtension = (format) => {
    const types = {
      csv: { mimeType: "text/csv", ext: "csv" },
      json: { mimeType: "application/json", ext: "json" },
      pdf: { mimeType: "application/pdf", ext: "pdf" },
    };
    return types[format] || types.csv;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Spinner
          size={48}
          color={
            themeColors && themeColors.primary
              ? themeColors.primary.replace("bg-", "#")
              : "#2563eb"
          }
        />
        <p
          className={`mt-4 text-base ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Loading logs...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        themeColors && themeColors.background
          ? themeColors.background
          : isDark
          ? "bg-gray-900"
          : "bg-gray-50"
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1
              className={`text-3xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Application Logs
            </h1>
            <button
              onClick={() => setFormatPickerVisible(true)}
              disabled={downloading}
              title="Download Reports"
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                ${
                  isDark
                    ? "border-gray-700 hover:bg-gray-800"
                    : "border-gray-200 hover:bg-gray-100"
                }
                border-2
                ${downloading ? "opacity-50 cursor-not-allowed" : ""}
                ${
                  themeColors && themeColors.primary
                    ? themeColors.primary +
                      " " +
                      (themeColors.primaryText || "text-white")
                    : "bg-blue-600 text-white"
                }
              `}
              style={{
                ...(themeColors && themeColors.primary
                  ? {
                      backgroundColor: themeColors.primary.replace("bg-", "#"),
                      color: themeColors.primaryText
                        ? themeColors.primaryText.replace("text-", "#")
                        : undefined,
                    }
                  : {}),
              }}
            >
              <>
                {downloading ? (
                  <>
                    <span
                      className="animate-spin inline-block h-5 w-5 border-2 border-solid border-current border-t-transparent rounded-full"
                      style={{
                        color:
                          themeColors && themeColors.primary
                            ? themeColors.primary.replace("bg-", "#")
                            : "#2563eb",
                      }}
                    ></span>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download
                      size={22}
                      style={{
                        color:
                          themeColors && themeColors.primaryText
                            ? themeColors.primaryText.replace("text-", "#")
                            : "#fff",
                      }}
                    />
                    <span>Download Logs</span>
                  </>
                )}
                {/* Extra spinner for visibility on the right */}
                {downloading && (
                  <span
                    className="animate-spin inline-block h-5 w-5 border-2 border-solid border-current border-t-transparent rounded-full ml-2"
                    style={{
                      color:
                        themeColors && themeColors.primary
                          ? themeColors.primary.replace("bg-", "#")
                          : "#2563eb",
                    }}
                  ></span>
                )}
              </>
            </button>
          </div>
          <p
            className={`text-base ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Monitor system activity and troubleshoot issues
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-3 pb-2">
            {renderFilterButton("all", "All")}
            {renderFilterButton("INFO", "Info")}
            {renderFilterButton("SUCCESS", "Success")}
            {renderFilterButton("WARNING", "Warning")}
            {renderFilterButton("ERROR", "Error")}
            {renderFilterButton("DEBUG", "Debug")}
          </div>
        </div>
        {/* Logs List */}
        <div className="relative">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <p className="text-red-500 text-center mb-6 max-w-md">{error}</p>
              <button
                onClick={fetchLogs}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText
                size={48}
                className={`${isDark ? "text-gray-600" : "text-gray-400"} mb-4`}
              />
              <p
                className={`text-lg font-semibold mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                No logs found
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-500" : "text-gray-500"
                }`}
              >
                {activeFilter === "all"
                  ? "No logs available at the moment"
                  : `No ${activeFilter.toLowerCase()} logs found`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">{filteredLogs.map(renderLogItem)}</div>
          )}
        </div>
      </div>

      {/* Format Picker Modal */}
      {formatPickerVisible && (
        <CustomAlert
          visible={formatPickerVisible}
          onClose={() => setFormatPickerVisible(false)}
          title="Select Format"
          message="Choose the format to download your logs."
          type="info"
          primaryAction={{
            onPress: () => handleFormatSelect("csv"),
            text: "CSV",
          }}
          secondaryAction={{
            onPress: () => handleFormatSelect("json"),
            text: "JSON",
          }}
          tertiaryAction={{
            onPress: () => handleFormatSelect("pdf"),
            text: "PDF",
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
      )}

      {/* Download Options Modal - Modified to remove Share button */}
      {downloadAlert.visible && (
        <CustomAlert
          visible={downloadAlert.visible}
          onClose={closeDownloadAlert}
          title="Download Logs"
          message={`Your logs will be downloaded as ${
            downloadAlert.format?.toUpperCase() || "CSV"
          } format.`}
          type="info"
          primaryAction={{
            onPress: () => {
              downloadAlert.onDownload && downloadAlert.onDownload();
            },
            text: downloading ? (
              <span className="flex items-center gap-2">
                <span
                  className="animate-spin inline-block h-5 w-5 border-2 border-solid border-current border-t-transparent rounded-full"
                  style={{
                    color:
                      themeColors && themeColors.primary
                        ? themeColors.primary.replace("bg-", "#")
                        : "#2563eb",
                  }}
                ></span>
                Downloading...
              </span>
            ) : (
              "Download"
            ),
            disabled: downloading,
          }}
          secondaryAction={{
            onPress: closeDownloadAlert,
            text: "Cancel",
            disabled: downloading,
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
      )}
    </div>
  );
};

export default AppLogs;
