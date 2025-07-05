import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { documentDirectory, writeAsStringAsync } from "expo-file-system";
import * as FileSystem from "expo-file-system"; // used for EncodingType
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  View,
} from "react-native";
import AnalyticsHeader from "../../components/Analytics/AnalyticsHeader";
import TimeBasedTab from "../../components/Analytics/TimeBasedTab";
import ErrorMessage from "../../components/common/ErrorMessage";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  CustomAlert,
  DownloadOptionsAlert,
} from "../../components/common/CustomAlert";

import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";
import { useDeviceStore } from "../../store/useDeviceStore";
import { subDays, startOfDay, endOfDay } from "date-fns";

const showToast = (message, duration = "SHORT") => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid[duration]);
  }
};

export default function Analytics() {
  const { accessToken, loading: authLoading } = useAuth();
  const { themeColors, isDark } = useThemeContext();
  const {
    // analytics, // removed unused
    timeBasedData,
    devices,
    analyticsLoading,
    analyticsError,
    fetchDevices,
    fetchDeviceAnalytics,
    fetchTimeBasedAnalytics,
    fetchSummaryAnalytics,
    downloadAnalytics,
    clearAnalyticsError,
  } = useDeviceStore();
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [selectedDevice, setSelectedDevice] = useState("all");
  // Removed TabNavigation, so activeTab and setActiveTab are no longer needed
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadCancelled, setDownloadCancelled] = useState(false);
  const [dataUpdateCounter, setDataUpdateCounter] = useState(0);

  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: startOfDay(subDays(new Date(), 7)),
    endDate: endOfDay(new Date()),
    label: "Last 7 Days",
  });

  // Enhanced period change handler
  const handlePeriodChange = useCallback((newPeriod) => {
    setSelectedPeriod(newPeriod);
    setDataUpdateCounter((prev) => prev + 1);
    showToast(`Period changed to ${newPeriod}`);
  }, []);

  // Enhanced device change handler
  const handleDeviceChange = useCallback(
    (newDevice) => {
      setSelectedDevice(newDevice);
      setDataUpdateCounter((prev) => prev + 1);
      const deviceName =
        newDevice === "all"
          ? "All Devices"
          : devices.find((d) => d.id === newDevice)?.name ||
            `Device ${newDevice}`;
      showToast(`Device changed to ${deviceName}`);
    },
    [devices]
  );

  // Custom Alert States
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    primaryAction: null,
    secondaryAction: null,
  });
  const [downloadAlert, setDownloadAlert] = useState({
    visible: false,
    format: "",
    onShare: null,
    onDownload: null,
  }); // Enhanced alert functions with custom alerts
  const showCustomAlert = useCallback(
    (type, title, message, primaryAction = null, secondaryAction = null) => {
      if (Platform.OS === "ios") {
        const hapticType =
          type === "success"
            ? Haptics.NotificationFeedbackType.Success
            : type === "error"
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning;
        Haptics.notificationAsync(hapticType);
      }

      // Small delay to ensure proper state management and rendering
      setTimeout(() => {
        setCustomAlert({
          visible: true,
          type,
          title,
          message,
          primaryAction,
          secondaryAction,
        });
      }, 50);
    },
    []
  );
  const closeCustomAlert = useCallback(() => {
    // If user closes alert during download, cancel the download
    if (downloading) {
      setDownloadCancelled(true);
      setDownloading(false);
      showToast("Download cancelled");
    }
    setCustomAlert((prev) => ({ ...prev, visible: false }));
  }, [downloading]);
  const showSuccessAlert = useCallback(
    (title, message, onSuccess = null) => {
      const primaryAction = onSuccess
        ? { text: "OK", onPress: onSuccess }
        : null;

      showCustomAlert("success", title, message, primaryAction);
    },
    [showCustomAlert]
  );
  const showErrorAlert = useCallback(
    (title, message, onRetry = null) => {
      const primaryAction = onRetry
        ? { text: "Retry", onPress: onRetry }
        : null;
      const secondaryAction = onRetry
        ? { text: "Cancel", onPress: () => {} }
        : null;

      showCustomAlert("error", title, message, primaryAction, secondaryAction);
    },
    [showCustomAlert]
  );
  const showWarningAlert = useCallback(
    (title, message, buttons = []) => {
      const primaryAction =
        buttons.length > 0 && buttons[0]
          ? {
              text: buttons[0].text || "Got it!",
              onPress: buttons[0].onPress || (() => {}),
            }
          : null;

      showCustomAlert("warning", title, message, primaryAction);
    },
    [showCustomAlert]
  );
  const showDownloadOptionsAlert = useCallback(
    (format, onShare, onDownload, onCancel) => {
      // Small delay to ensure proper state management and rendering
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
    // If user closes download options alert during download, cancel the download
    if (downloading) {
      setDownloadCancelled(true);
      setDownloading(false);
      showToast("Download cancelled");
    }
    setDownloadAlert((prev) => ({ ...prev, visible: false }));
  }, [downloading]);

  // Handle date range change
  const handleDateRangeChange = useCallback((dateRange) => {
    setSelectedDateRange(dateRange);
    setDataUpdateCounter((prev) => prev + 1);
    showToast(`Date range updated: ${dateRange.label}`);
  }, []);

  // Manual refresh function for debugging
  const handleManualRefresh = useCallback(async () => {
    setDataUpdateCounter((prev) => prev + 1);
    showToast("Refreshing analytics data...");
    await loadTimeBasedData();
  }, [loadTimeBasedData]);

  // Only fetch devices on first load, then let time-based effect handle analytics
  const loadAllData = useCallback(async () => {
    if (!accessToken) return;
    try {
      await fetchDevices(accessToken);
      if (isFirstLoad) {
        setIsFirstLoad(false);
        showToast("Analytics data loaded successfully");
      }
    } catch (_error) {
      showErrorAlert(
        "Data Loading Failed",
        "Unable to fetch analytics data. Please check your connection and try again.",
        () => loadAllData()
      );
    }
  }, [accessToken, isFirstLoad, fetchDevices, showErrorAlert]);
  const loadTimeBasedData = useCallback(async () => {
    if (!accessToken) return;

    try {
      const deviceId = selectedDevice === "all" ? null : selectedDevice;

      // Always pass date range if available - let backend handle the filtering
      let startDate = null;
      let endDate = null;

      // Pass date range if it exists and has valid dates
      if (selectedDateRange?.startDate && selectedDateRange?.endDate) {
        // Ensure dates are properly formatted as ISO strings
        startDate =
          selectedDateRange.startDate instanceof Date
            ? selectedDateRange.startDate.toISOString()
            : selectedDateRange.startDate;
        endDate =
          selectedDateRange.endDate instanceof Date
            ? selectedDateRange.endDate.toISOString()
            : selectedDateRange.endDate;
      }

      await fetchTimeBasedAnalytics(
        accessToken,
        selectedPeriod,
        deviceId,
        startDate,
        endDate
      );
    } catch (_error) {
      showErrorAlert(
        "Time-based Data Error",
        "Failed to load time-based analytics. The data might be temporarily unavailable.",
        () => loadTimeBasedData()
      );
    }
  }, [
    accessToken,
    selectedPeriod,
    selectedDevice,
    selectedDateRange,
    fetchTimeBasedAnalytics,
    showErrorAlert,
  ]);

  // On first load, fetch devices, then always fetch time-based analytics when dependencies change
  useEffect(() => {
    if (!authLoading && accessToken && isFirstLoad) {
      loadAllData();
    }
  }, [authLoading, accessToken, isFirstLoad, loadAllData]);

  useEffect(() => {
    if (
      !authLoading &&
      accessToken &&
      (!isFirstLoad || (isFirstLoad && devices.length > 0))
    ) {
      loadTimeBasedData();
    }
  }, [
    selectedPeriod,
    selectedDevice,
    selectedDateRange,
    authLoading,
    accessToken,
    isFirstLoad,
    devices.length,
    loadTimeBasedData,
  ]);
  const handleDownload = async (format) => {
    if (downloading) {
      showWarningAlert(
        "Download in Progress",
        "Please wait for the current download to complete before starting a new one."
      );
      return false;
    }

    // Reset cancellation flag at the start
    setDownloadCancelled(false);

    // Return a promise that resolves based on user action
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
          // Cancel callback - reset any processing states
          setDownloadCancelled(true);
          setDownloading(false);
          resolve(false);
        }
      );
    });
  };
  const processDownload = async (format, action) => {
    if (downloading) return false;

    try {
      setDownloading(true);
      setDownloadCancelled(false); // Reset cancellation flag

      // Show progress toast on Android
      if (Platform.OS === "android") {
        showToast(`Preparing ${format.toUpperCase()} file...`, "LONG");
      }

      const deviceId = selectedDevice === "all" ? null : selectedDevice;

      // Only pass date range if it's different from the default weekly range
      let startDate = null;
      let endDate = null;

      // Check if user has selected a custom date range (not the default "Last 7 Days")
      if (
        selectedDateRange?.label !== "Last 7 Days" &&
        selectedDateRange?.startDate &&
        selectedDateRange?.endDate
      ) {
        startDate = selectedDateRange.startDate.toISOString();
        endDate = selectedDateRange.endDate.toISOString();
      }

      const result = await downloadAnalytics(
        accessToken,
        selectedPeriod,
        format,
        deviceId,
        startDate,
        endDate
      );

      // Check if download was cancelled
      if (downloadCancelled) {
        return false;
      }

      if (!result?.data) {
        throw new Error(
          "No analytics data available for the selected period and device"
        );
      }

      // Debug PDF data
      debugPdfData(result.data, format); // Handle web platform separately
      if (Platform.OS === "web") {
        // Check if download was cancelled
        if (downloadCancelled) {
          return false;
        }

        let blob;

        if (format === "csv") {
          blob = new Blob([result.data], { type: "text/csv" });
        } else if (format === "json") {
          blob = new Blob([result.data], { type: "application/json" });
        } else if (format === "pdf") {
          blob = new Blob([result.data], { type: "application/pdf" });
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics_${selectedPeriod}_${
          new Date().toISOString().split("T")[0]
        }.${format}`;
        link.click();
        URL.revokeObjectURL(url);
        showSuccessAlert(
          "Download Complete",
          `Your analytics data has been downloaded as a ${format.toUpperCase()} file.`
        );
        return true;
      }

      // Handle native platforms
      if (!documentDirectory) {
        throw new Error("File system not available on this device");
      }

      // Check if download was cancelled before processing
      if (downloadCancelled) {
        return false;
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const fileName = `analytics_${selectedPeriod}_${timestamp}.${format}`;
      const fileUri = `${documentDirectory}${fileName}`;
      const fileContent =
        format === "json" ? JSON.stringify(result.data, null, 2) : result.data; // For PDF, we need to handle binary data properly
      if (format === "pdf") {
        // Check if download was cancelled
        if (downloadCancelled) {
          return false;
        }

        // PDF is handled directly through sharing
        if (action === "share") {
          if (await Sharing.isAvailableAsync()) {
            // Create a temporary file for PDF sharing
            const pdfUri = `${documentDirectory}${fileName}`;

            // Write the base64 PDF data to file
            await writeAsStringAsync(pdfUri, result.data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            await Sharing.shareAsync(pdfUri, {
              mimeType: "application/pdf",
              dialogTitle: `Save Analytics PDF Report`,
              UTI: "com.adobe.pdf",
            });
            showSuccessAlert(
              "PDF Ready to Save",
              "Your analytics PDF report is ready! Choose your preferred location from the share menu to save it."
            );
            return true;
          } else {
            throw new Error("Sharing is not available on this device");
          }
        } else {
          // For direct download of PDF on Android
          if (Platform.OS === "android") {
            try {
              const { StorageAccessFramework } = await import(
                "expo-file-system"
              );
              const permissions =
                await StorageAccessFramework.requestDirectoryPermissionsAsync();

              if (permissions.granted) {
                const uri = await StorageAccessFramework.createFileAsync(
                  permissions.directoryUri,
                  fileName,
                  "application/pdf"
                );

                // Write base64 PDF data
                await StorageAccessFramework.writeAsStringAsync(
                  uri,
                  result.data,
                  {
                    encoding: FileSystem.EncodingType.Base64,
                  }
                );
                showSuccessAlert(
                  "PDF Saved",
                  `Your analytics PDF report has been saved to Downloads:\n${fileName}`
                );
                return true;
              }
            } catch (_androidError) {
              // Error handling for Android PDF download
            }
          } // Fallback for PDF
          showCustomAlert(
            "info",
            "PDF Ready",
            `PDF report created: ${fileName}\n\nUse "Share" to save it to your preferred location.`,
            {
              text: "Share Now",
              onPress: () => processDownload(format, "share"),
            },
            { text: "OK", onPress: () => {} }
          );
          return true;
        }
      }

      // Check if download was cancelled before writing file
      if (downloadCancelled) {
        return false;
      }

      await writeAsStringAsync(fileUri, fileContent);

      if (action === "download") {
        // Try direct download first (Android)
        if (Platform.OS === "android") {
          try {
            const { StorageAccessFramework } = await import("expo-file-system");
            const permissions =
              await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              let mimeType = "application/json";
              if (format === "csv") mimeType = "text/csv";
              else if (format === "pdf") mimeType = "application/pdf";

              const uri = await StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                mimeType
              );
              await StorageAccessFramework.writeAsStringAsync(uri, fileContent);
              showSuccessAlert(
                "File Saved",
                `Your analytics file has been saved to Downloads:\n${fileName}`
              );
              return true;
            }
          } catch (_androidError) {
            // Error handling for Android direct download
          }
        } // iOS or Android fallback
        showCustomAlert(
          "info",
          "File Ready",
          `File created: ${fileName}\n\nThe file is saved in the app directory. Use "Share" to save it to your preferred location.`,
          {
            text: "Share Now",
            onPress: () => processDownload(format, "share"),
          },
          { text: "OK", onPress: () => {} }
        );
        return true;
      } else if (action === "share") {
        if (await Sharing.isAvailableAsync()) {
          let mimeType = "application/json";
          let UTI = "public.json";

          if (format === "csv") {
            mimeType = "text/csv";
            UTI = "public.comma-separated-values-text";
          } else if (format === "pdf") {
            mimeType = "application/pdf";
            UTI = "com.adobe.pdf";
          }

          await Sharing.shareAsync(fileUri, {
            mimeType: mimeType,
            dialogTitle: `Save Analytics ${format.toUpperCase()}`,
            UTI: UTI,
          });
          showSuccessAlert(
            "Ready to Save",
            "Your analytics file is ready! Choose your preferred location from the share menu to save it."
          );
          return true;
        } else {
          throw new Error("Sharing is not available on this device");
        }
      }

      return true;
    } catch (error) {
      let errorMessage =
        "An unexpected error occurred while processing your request.";
      if (error.message.includes("No analytics data")) {
        errorMessage =
          "No analytics data available for the selected filters. Try adjusting your selection.";
      } else if (error.message.includes("network")) {
        errorMessage =
          "Network error occurred. Please check your connection and try again.";
      } else if (error.message.includes("permission")) {
        errorMessage =
          "Permission denied. Please grant file access permissions in your device settings.";
      }
      showErrorAlert("Operation Failed", errorMessage, () =>
        handleDownload(format)
      );
      return false;
    } finally {
      setDownloading(false);
      // Reset cancellation flag after a short delay to allow UI to update
      setTimeout(() => {
        setDownloadCancelled(false);
      }, 500);
    }
  };

  // Debug function to check PDF data
  const debugPdfData = (data, format) => {
    if (format === "pdf") {
      // Check if it's valid base64
      try {
        if (typeof data === "string") {
          // Check if it starts with PDF header (when decoded)
          atob(data.substring(0, 100)); // Check first 100 chars
          // Validate PDF format silently
        }
      } catch (_e) {
        // Error checking PDF header silently
      }
    }
  };

  if (authLoading || (analyticsLoading && isFirstLoad)) {
    return (
      <LoadingScreen
        message="Loading Analytics"
        submessage="Fetching your latest updates..."
        iconName="analytics"
        variant="fullscreen"
        customIcon={
          <Ionicons
            name="analytics-outline"
            size={80}
            color={themeColors.primary}
          />
        }
      />
    );
  }
  // const totalLowAlerts = summaryData?.alert_distribution?.low || 0; // removed unused

  return (
    <View style={styles.rootContainer}>
      <ScreenWrapper scrollable={false}>
        <ScrollView
          style={[
            styles.container,
            { backgroundColor: themeColors.background },
          ]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <AnalyticsHeader
            onDateRangeChange={handleDateRangeChange}
            selectedDateRange={selectedDateRange}
            onRefresh={handleManualRefresh}
            isLoading={analyticsLoading}
          />
          <View style={styles.tabContentContainer}>
            <TimeBasedTab
              key={`${selectedPeriod}_${selectedDevice}_${selectedDateRange?.label}_${dataUpdateCounter}`}
              timeBasedData={timeBasedData || {}}
              devices={devices || []}
              selectedPeriod={selectedPeriod}
              selectedDevice={selectedDevice}
              onPeriodChange={handlePeriodChange}
              onDeviceChange={handleDeviceChange}
              onDownload={handleDownload}
              downloading={downloading}
              cancelled={downloadCancelled}
              isLoading={analyticsLoading}
            />
          </View>
          {analyticsError && (
            <ErrorMessage
              error={analyticsError}
              onDismiss={clearAnalyticsError}
            />
          )}
        </ScrollView>
      </ScreenWrapper>

      {/* Custom Alert Components - Positioned absolutely at root level */}
      {customAlert.visible && (
        <View style={styles.modalContainer}>
          <CustomAlert
            visible={customAlert.visible}
            onClose={closeCustomAlert}
            title={customAlert.title}
            message={customAlert.message}
            type={customAlert.type}
            primaryAction={customAlert.primaryAction}
            secondaryAction={customAlert.secondaryAction}
            themeColors={themeColors}
            isDark={isDark}
          />
        </View>
      )}

      {downloadAlert.visible && (
        <View style={styles.modalContainer}>
          <DownloadOptionsAlert
            visible={downloadAlert.visible}
            onClose={closeDownloadAlert}
            format={downloadAlert.format}
            onShare={downloadAlert.onShare}
            onDownload={downloadAlert.onDownload}
            themeColors={themeColors}
            isDark={isDark}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: "relative",
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 0 : 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.select({
      ios: 100,
      android: 80,
      web: 60,
    }),
  },
  tabContentContainer: {
    flex: 1,
    zIndex: 0,
    position: "relative",
  },
  modalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 1000, // Ensure it's above everything on Android
    ...Platform.select({
      web: {
        position: "fixed",
      },
    }),
  },
});
