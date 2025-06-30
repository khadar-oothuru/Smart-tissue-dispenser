import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import AdminService from "../../services/AdminService";
import config from "../../config/config";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width } = Dimensions.get("window");

// Add helper function for ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in browsers, but for React Native, use a polyfill if needed
  if (typeof btoa === "function") {
    return btoa(binary);
  } else {
    throw new Error(
      "Base64 encoding not available. Use a polyfill for btoa in React Native."
    );
  }
}

const AppLogs = ({ style }) => {
  const { themeColors, isDark } = useThemeContext();
  const { auth } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [selectedFormat, setSelectedFormat] = useState(null);

  // Define logLevelColors and logLevelIcons
  const logLevelColors = {
    INFO: themeColors.primary,
    WARNING: themeColors.warning,
    ERROR: themeColors.danger,
    DEBUG: themeColors.text,
    SUCCESS: themeColors.success,
  };

  const logLevelIcons = {
    INFO: "information-circle-outline",
    WARNING: "warning-outline",
    ERROR: "close-circle-outline",
    DEBUG: "bug-outline",
    SUCCESS: "checkmark-circle-outline",
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("AppLogs: Fetching logs...");
      const data = await AdminService.fetchLogs();
      console.log("AppLogs: Received data:", data);
      console.log("AppLogs: Data type:", typeof data);
      console.log("AppLogs: Is array:", Array.isArray(data));

      if (data && Array.isArray(data)) {
        console.log("AppLogs: Setting logs, count:", data.length);
        setLogs(data);
        setFilteredLogs(data);
      } else if (data && data.results && Array.isArray(data.results)) {
        console.log(
          "AppLogs: Setting logs from results, count:",
          data.results.length
        );
        setLogs(data.results);
        setFilteredLogs(data.results);
      } else {
        console.log("AppLogs: No valid logs data, setting empty arrays");
        setLogs([]);
        setFilteredLogs([]);
      }
    } catch (error) {
      console.error("AppLogs: Error fetching logs:", error);
      console.error("AppLogs: Error details:", error.message);
      setError("Failed to load logs. Please try again.");
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Initialize AdminService with auth context
  useEffect(() => {
    if (auth) {
      AdminService.setAuthContext(auth);
    }
  }, [auth]);

  // Filter logs based on active filter
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter((log) => log.level === activeFilter));
    }
  }, [activeFilter, logs]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderFilterButton = (level, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor:
            activeFilter === level
              ? logLevelColors[level]
              : themeColors.surface,
          borderColor: logLevelColors[level],
        },
      ]}
      onPress={() => setActiveFilter(level)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterButtonText,
          {
            color: activeFilter === level ? "#FFFFFF" : logLevelColors[level],
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderLogItem = (log) => (
    <View
      key={log.id}
      style={[
        styles.logItem,
        {
          backgroundColor: themeColors.surface,
          borderLeftColor: logLevelColors[log.level],
        },
      ]}
    >
      <View style={styles.logHeader}>
        <View style={styles.logLevelContainer}>
          <Ionicons
            name={logLevelIcons[log.level]}
            size={16}
            color={logLevelColors[log.level]}
          />
          <Text style={[styles.logLevel, { color: logLevelColors[log.level] }]}>
            {log.level}
          </Text>
        </View>
        <Text style={[styles.logTimestamp, { color: themeColors.text }]}>
          {formatTimestamp(log.timestamp)}
        </Text>
      </View>

      <Text style={[styles.logMessage, { color: themeColors.heading }]}>
        {log.message}
      </Text>

      <View style={styles.logMeta}>
        <Text style={[styles.logSource, { color: themeColors.primary }]}>
          {log.source}
        </Text>
        {log.details && (
          <Text style={[styles.logDetails, { color: themeColors.text }]}>
            {log.details}
          </Text>
        )}
      </View>
    </View>
  );

  // Show format picker when download icon is pressed
  const openFormatPicker = () => {
    setFormatPickerVisible(true);
  };
  const closeFormatPicker = () => {
    setFormatPickerVisible(false);
  };
  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setFormatPickerVisible(false);
    handleDownload(format);
  };

  // Download functions (matching Analytics.jsx pattern)
  const showDownloadOptionsAlert = useCallback(
    (format, onShare, onDownload, onCancel) => {
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
    if (downloading) {
      return false;
    }

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
        },
        () => {
          setDownloading(false);
          resolve(false);
        }
      );
    });
  };

  const testConnection = async () => {
    try {
      console.log("AppLogs: Testing connection to backend...");

      // Use AdminService's makeAuthenticatedRequest method for consistency
      await AdminService.makeAuthenticatedRequest("/auth/admin/profile/");

      console.log("AppLogs: Connection test successful");
      return true;
    } catch (error) {
      console.error("AppLogs: Connection test failed:", error);
      return false;
    }
  };

  const getExportUrl = (format) => {
    if (format === "csv") return "/auth/admin/logs/export/csv/";
    if (format === "json") return "/auth/admin/logs/export/json/";
    if (format === "pdf") return "/auth/admin/logs/export/pdf/";
    return "/auth/admin/logs/export/csv/";
  };

  const getMimeTypeAndExtension = (format) => {
    if (format === "csv") return { mimeType: "text/csv", ext: "csv" };
    if (format === "json") return { mimeType: "application/json", ext: "json" };
    if (format === "pdf") return { mimeType: "application/pdf", ext: "pdf" };
    return { mimeType: "text/csv", ext: "csv" };
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
      const url = getExportUrl(format);
      const { mimeType, ext } = getMimeTypeAndExtension(format);
      let fileContent;
      let fileName = `logs_${new Date().toISOString().split("T")[0]}.${ext}`;
      if (format === "pdf") {
        // PDF is binary, may be ArrayBuffer
        fileContent = await AdminService.constructor.downloadLogsFromUrl(
          url,
          filters,
          AdminService.authContext
        );
      } else {
        fileContent = await AdminService.constructor.downloadLogsFromUrl(
          url,
          filters,
          AdminService.authContext
        );
      }
      // Handle web platform
      if (Platform.OS === "web") {
        let blob;
        if (format === "pdf") {
          blob = new Blob([fileContent], { type: mimeType });
        } else {
          blob = new Blob([fileContent], { type: mimeType });
        }
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        return true;
      }
      // Handle native platforms
      if (!FileSystem.documentDirectory) {
        throw new Error("File system not available on this device");
      }
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      if (format === "pdf") {
        // PDF is binary, may be ArrayBuffer
        let base64Content = fileContent;
        if (fileContent instanceof ArrayBuffer) {
          base64Content = arrayBufferToBase64(fileContent);
        }
        await FileSystem.writeAsStringAsync(fileUri, base64Content, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.writeAsStringAsync(fileUri, fileContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
      if (action === "share") {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: mimeType,
            dialogTitle: `Share Logs (${format.toUpperCase()})`,
          });
          return true;
        } else {
          throw new Error("Sharing is not available on this device");
        }
      } else if (action === "download") {
        if (Platform.OS === "android") {
          try {
            const { StorageAccessFramework } = await import("expo-file-system");
            const permissions =
              await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              const uri = await StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                mimeType
              );
              if (format === "pdf") {
                let base64Content = fileContent;
                if (fileContent instanceof ArrayBuffer) {
                  base64Content = arrayBufferToBase64(fileContent);
                }
                await StorageAccessFramework.writeAsStringAsync(
                  uri,
                  base64Content,
                  {
                    encoding: FileSystem.EncodingType.Base64,
                  }
                );
              } else {
                await StorageAccessFramework.writeAsStringAsync(
                  uri,
                  fileContent
                );
              }
              return true;
            }
          } catch (androidError) {
            console.log("Android direct download failed:", androidError);
          }
        }
        return true;
      }
      return true;
    } catch (error) {
      setError(error.message || "Download failed. Please try again.");
      throw error;
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Loading logs...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header with Download Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: themeColors.heading }]}>
            Application Logs
          </Text>
          <TouchableOpacity
            style={[
              styles.downloadButton,
              {
                borderColor: themeColors.surface,
                borderWidth: 2,
                backgroundColor: "transparent",
                padding: 8,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
            onPress={openFormatPicker}
            disabled={downloading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="download-outline"
              size={22}
              color={themeColors.primary}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: themeColors.text }]}>
          Monitor system activity and troubleshoot issues
        </Text>
      </View>

      {/* Filters with Horizontal Scroll */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          bounces={false}
          decelerationRate="fast"
        >
          {renderFilterButton("all", "All")}
          {renderFilterButton("INFO", "Info")}
          {renderFilterButton("SUCCESS", "Success")}
          {renderFilterButton("WARNING", "Warning")}
          {renderFilterButton("ERROR", "Error")}
          {renderFilterButton("DEBUG", "Debug")}
        </ScrollView>
      </View>

      {/* Logs List */}
      <ScrollView
        style={styles.logsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={themeColors.danger}
            />
            <Text style={[styles.errorText, { color: themeColors.danger }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: themeColors.primary },
              ]}
              onPress={fetchLogs}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={themeColors.text}
            />
            <Text style={[styles.emptyText, { color: themeColors.text }]}>
              No logs found
            </Text>
            <Text style={[styles.emptySubtext, { color: themeColors.text }]}>
              {activeFilter === "all"
                ? "No logs available at the moment"
                : `No ${activeFilter.toLowerCase()} logs found`}
            </Text>
          </View>
        ) : (
          filteredLogs.map(renderLogItem)
        )}
      </ScrollView>

      {/* Format Picker CustomAlert */}
      {formatPickerVisible && (
        <View style={styles.modalContainer}>
          <CustomAlert
            visible={formatPickerVisible}
            onClose={closeFormatPicker}
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
            cancelAction={{ onPress: closeFormatPicker, text: "Cancel" }}
            themeColors={themeColors}
            isDark={isDark}
          />
        </View>
      )}

      {/* Download Alert */}
      {downloadAlert.visible && (
        <View style={styles.modalContainer}>
          <CustomAlert
            visible={downloadAlert.visible}
            onClose={closeDownloadAlert}
            title="Download Logs"
            message={`Choose how you'd like to save your logs as ${
              downloadAlert.format?.toUpperCase() || "CSV"
            }.`}
            type="info"
            primaryAction={{
              onPress: () => {
                downloadAlert.onDownload && downloadAlert.onDownload();
              },
              text: "Download",
            }}
            secondaryAction={{
              onPress: () => {
                downloadAlert.onShare && downloadAlert.onShare();
              },
              text: "Share",
            }}
            cancelAction={{ onPress: closeDownloadAlert, text: "Cancel" }}
            themeColors={themeColors}
            isDark={isDark}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    fontWeight: "400",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filtersScroll: {
    gap: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  logTimestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  logMessage: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 22,
  },
  logMeta: {
    gap: 4,
  },
  logSource: {
    fontSize: 14,
    fontWeight: "500",
  },
  logDetails: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
  modalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 1000,
    ...Platform.select({
      web: {
        position: "fixed",
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  formatPickerBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 220,
  },
  downloadOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
    width: 160,
    justifyContent: "flex-start",
  },
});

export default AppLogs;
