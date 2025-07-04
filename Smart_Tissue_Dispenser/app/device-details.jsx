import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ToastAndroid,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { DonutChart } from "../components/Analytics/ChartComponents/DonutChart";
import { AreaLineChart } from "../components/Analytics/ChartComponents/AreaLineChart";
import LoadingScreen from "../components/common/LoadingScreen";
import {
  CustomAlert,
  DownloadOptionsAlert,
} from "../components/common/CustomAlert";
import { getDeviceStatusConfig } from "../utils/deviceStatusConfig";
import {
  getDeviceDetails,
  fetchDeviceAnalytics,
  fetchTimeBasedAnalytics,
  fetchDeviceStatusDistribution,
  fetchDeviceRealtimeStatus,
  downloadAnalytics,
} from "../utils/api";

export default function DeviceDetails() {
  const { themeColors, isDark } = useThemeContext();
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [device, setDevice] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeBasedData, setTimeBasedData] = useState(null);
  const [statusDistribution, setStatusDistribution] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [alertTrendsLoading, setAlertTrendsLoading] = useState(false);

  // Custom Alert States
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "warning",
    primaryAction: null,
    secondaryAction: null,
  });
  const [downloadOptionsAlert, setDownloadOptionsAlert] = useState({
    visible: false,
    format: "",
    onShare: null,
    onDownload: null,
    onCancel: null,
  });
  // Extract device info from params
  const deviceId = params.deviceId;
  const deviceName = params.deviceName || "Device";
  const paramDeviceStatus = params.deviceStatus || "unknown";
  const paramIsActive = params.isActive === "true";
  const room = params.room || "Unknown";
  const floor = params.floor || "N/A";

  // Determine actual device status from device data or fallback to params
  const deviceStatus =
    device?.status || realtimeStatus?.status || paramDeviceStatus;
  // Determine actual active status from device data or fallback to params  // Determine actual active status from device data or fallback to params
  const isActive =
    device?.is_active !== undefined
      ? device.is_active
      : realtimeStatus?.is_active !== undefined
      ? realtimeStatus.is_active
      : paramIsActive;

  // Helper function to get total usage count
  const getTotalUsage = () => {
    // Priority order: realtime data, device data, analytics data
    const totalUsage =
      realtimeStatus?.total_usage ||
      device?.total_usage ||
      analytics?.total_usage ||
      realtimeStatus?.current_count ||
      analytics?.total_entries;

    return totalUsage && totalUsage > 0 ? totalUsage : 0;
  };

  // Debug logging to help troubleshoot icon issues
  console.log("Device Details Debug:", {
    deviceId,
    deviceStatus,
    paramIsActive,
    deviceIsActive: device?.is_active,
    realtimeIsActive: realtimeStatus?.is_active,
    finalIsActive: isActive,
    totalUsage: {
      realtimeTotal: realtimeStatus?.total_usage,
      deviceTotal: device?.total_usage,
      analyticsTotal: analytics?.total_usage,
      realtimeCount: realtimeStatus?.current_count,
      analyticsEntries: analytics?.total_entries,
      finalCalculated: getTotalUsage(),
    },
    statusConfig: getDeviceStatusConfig(deviceStatus, isActive, isDark),
  });
  useEffect(() => {
    initializeData();
  }, [accessToken, initializeData]);
  const initializeData = useCallback(async () => {
    if (!accessToken) {
      showCustomAlert(
        "Authentication Error",
        "Authentication token not found. Please login again.",
        "error",
        {
          text: "Go to Login",
          onPress: () => router.replace("/login"),
        }
      );
      return;
    }

    try {
      // Load all data in parallel
      setLoading(true);

      const [deviceDetails, analyticsData, timeData, statusData, realtimeData] =
        await Promise.allSettled([
          getDeviceDetails(accessToken, deviceId),
          fetchDeviceAnalytics(accessToken),
          fetchTimeBasedAnalytics(accessToken, selectedPeriod, deviceId),
          fetchDeviceStatusDistribution(accessToken),
          fetchDeviceRealtimeStatus(accessToken, deviceId),
        ]);

      // Process device details
      if (deviceDetails.status === "fulfilled") {
        setDevice(deviceDetails.value);
      }

      // Process analytics
      if (analyticsData.status === "fulfilled") {
        setAnalytics(analyticsData.value);
      }

      // Process time-based data
      if (timeData.status === "fulfilled") {
        setTimeBasedData(timeData.value);
      }

      // Process status distribution
      if (statusData.status === "fulfilled") {
        setStatusDistribution(statusData.value);
      } // Process realtime status
      if (realtimeData.status === "fulfilled" && realtimeData.value) {
        // Filter the realtime data for our specific device
        const deviceRealtimeData = Array.isArray(realtimeData.value)
          ? realtimeData.value.find(
              (device) => device.device_id === parseInt(deviceId)
            )
          : realtimeData.value;
        setRealtimeStatus(deviceRealtimeData);
      }
    } catch (error) {
      console.error("Data loading error:", error);
      showCustomAlert(
        "Data Loading Failed",
        "Failed to load device data. Please check your connection and try again.",
        "error",
        {
          text: "Retry",
          onPress: () => initializeData(),
        }
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, router, deviceId, selectedPeriod]);

  // Handler for period toggle
  const handlePeriodChange = async (newPeriod) => {
    if (newPeriod === selectedPeriod || !accessToken) return;

    try {
      setAlertTrendsLoading(true);
      setSelectedPeriod(newPeriod);

      const timeData = await fetchTimeBasedAnalytics(
        accessToken,
        newPeriod,
        deviceId
      );
      setTimeBasedData(timeData);
    } catch (error) {
      console.error("Failed to fetch period data:", error);
      showCustomAlert(
        "Update Failed",
        "Failed to update alert trends data. Please try again.",
        "error"
      );
    } finally {
      setAlertTrendsLoading(false);
    }
  }; // Custom Alert Helper Functions
  const showCustomAlert = (
    title,
    message,
    type = "warning",
    primaryAction = null,
    secondaryAction = null
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      primaryAction,
      secondaryAction,
    });
  };

  const showDownloadOptions = (
    format,
    onShare,
    onDownload,
    onCancel = null
  ) => {
    setDownloadOptionsAlert({
      visible: true,
      format,
      onShare,
      onDownload,
      onCancel, // Add cancel callback
    });
  };

  // Enhanced download functionality with custom alerts
  const showToast = (message, duration = "SHORT") => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid[duration]);
    }
  };
  const handleDownload = async (format) => {
    if (downloading) {
      showCustomAlert(
        "Download in Progress",
        "Please wait for the current download to complete before starting a new one.",
        "warning"
      );
      return false;
    }

    console.log("Download triggered for format:", format);

    // Return a promise that resolves based on user action
    return new Promise((resolve) => {
      showDownloadOptions(
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
          // Cancel callback - resolve with false when user cancels
          resolve(false);
        }
      );
    });
  };
  const processDownload = async (format, action) => {
    if (downloading) return false;

    try {
      setDownloading(true);

      if (Platform.OS === "android") {
        showToast(`Preparing ${format.toUpperCase()} file...`, "LONG");
      }
      let result;
      // Download device data - try multiple periods to get available data
      // Independent of the UI period toggle which only affects chart display

      // Try different periods to get any available data
      const periodsToTry = ["weekly", "daily", "monthly"];
      let lastError = null;

      for (const period of periodsToTry) {
        try {
          console.log(`Attempting download with period: ${period}`);
          result = await downloadAnalytics(
            accessToken,
            period,
            format,
            deviceId
          );

          // If we get any data, break out of the loop
          if (result && (result.data || result)) {
            console.log(`Successfully got data with period: ${period}`);
            break;
          }
        } catch (error) {
          console.log(`Failed with period ${period}:`, error.message);
          lastError = error;
          continue; // Try next period
        }
      }

      // If we still don't have result after trying all periods, throw the last error
      if (!result) {
        throw lastError || new Error("No data available for this device");
      }

      // Handle the case where result exists but data might be in different format
      let fileData = result.data || result;

      // For empty or minimal data, create a placeholder
      if (!fileData || fileData === "" || fileData === "null") {
        if (format === "json") {
          fileData = JSON.stringify(
            {
              device_id: deviceId,
              message: "No analytics data available for this device",
              generated_at: new Date().toISOString(),
            },
            null,
            2
          );
        } else if (format === "csv") {
          fileData = `Device ID,Message,Generated At\n${deviceId},"No analytics data available",${new Date().toISOString()}`;
        } else if (format === "pdf") {
          // For PDF, we'll handle this in the error case since we can't easily generate PDF
          throw new Error("No PDF data available for this device");
        }
      } // Handle web platform separately
      if (Platform.OS === "web") {
        let blob;

        if (format === "csv") {
          blob = new Blob([fileData], { type: "text/csv" });
        } else if (format === "json") {
          blob = new Blob([fileData], { type: "application/json" });
        } else if (format === "pdf") {
          blob = new Blob([fileData], { type: "application/pdf" });
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `device_${deviceId}_analytics_complete_${
          new Date().toISOString().split("T")[0]
        }.${format}`;
        link.click();
        URL.revokeObjectURL(url);
        showCustomAlert(
          "Download Complete",
          `Your complete device analytics data has been downloaded as a ${format.toUpperCase()} file.`,
          "success"
        );
        return true;
      }

      // Handle native platforms
      if (!FileSystem.documentDirectory) {
        throw new Error("File system not available on this device");
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const fileName = `device_${deviceId}_analytics_complete_${timestamp}.${format}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const fileContent =
        format === "json"
          ? typeof fileData === "string"
            ? fileData
            : JSON.stringify(fileData, null, 2)
          : fileData;

      // For PDF, handle binary data properly
      if (format === "pdf") {
        if (action === "share") {
          if (await Sharing.isAvailableAsync()) {
            const pdfUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.writeAsStringAsync(pdfUri, fileData, {
              encoding: FileSystem.EncodingType.Base64,
            });

            await Sharing.shareAsync(pdfUri, {
              mimeType: "application/pdf",
              dialogTitle: `Save Device ${deviceId} Analytics PDF Report`,
              UTI: "com.adobe.pdf",
            });
            showCustomAlert(
              "PDF Ready to Save",
              "Your complete device analytics PDF report is ready! Choose your preferred location from the share menu to save it.",
              "success"
            );
            return true;
          } else {
            throw new Error("Sharing is not available on this device");
          }
        } else {
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
                await StorageAccessFramework.writeAsStringAsync(uri, fileData, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                showCustomAlert(
                  "PDF Saved",
                  `Your complete device analytics PDF report has been saved to Downloads:\n${fileName}`,
                  "success"
                );
                return true;
              }
            } catch (androidError) {
              console.log("Android PDF download failed:", androidError);
            }
          }
          showCustomAlert(
            "PDF Ready",
            `📄 PDF report created: ${fileName}\n\nUse "Share" to save it to your preferred location.`,
            "info",
            {
              text: "Share Now",
              onPress: () => processDownload(format, "share"),
            }
          );
          return true;
        }
      }

      await FileSystem.writeAsStringAsync(fileUri, fileContent);

      if (action === "download") {
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
              showCustomAlert(
                "File Saved",
                `Your complete device analytics file has been saved to Downloads:\n${fileName}`,
                "success"
              );
              return true;
            }
          } catch (androidError) {
            console.log("Android direct download failed:", androidError);
          }
        }
        showCustomAlert(
          "File Ready",
          `📁 File created: ${fileName}\n\nThe file is saved in the app directory. Use "Share" to save it to your preferred location.`,
          "info",
          {
            text: "Share Now",
            onPress: () => processDownload(format, "share"),
          }
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
            dialogTitle: `Save Device ${deviceId} Analytics ${format.toUpperCase()}`,
            UTI: UTI,
          });
          showCustomAlert(
            "Ready to Save",
            "Your complete device analytics file is ready! Choose your preferred location from the share menu to save it.",
            "success"
          );
          return true;
        } else {
          throw new Error("Sharing is not available on this device");
        }
      }

      return true;
    } catch (error) {
      console.error("Download/Share failed:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        format: format,
        deviceId: deviceId,
        accessToken: accessToken ? "present" : "missing",
      });
      let errorMessage =
        "An unexpected error occurred while processing your request.";
      if (
        error.message.includes("No analytics data") ||
        error.message.includes("No data available")
      ) {
        errorMessage =
          "No analytics data found for this device. The device may be new or have no recorded activity yet.";
      } else if (error.message.includes("network")) {
        errorMessage =
          "Network error occurred. Please check your connection and try again.";
      } else if (error.message.includes("permission")) {
        errorMessage =
          "Permission denied. Please grant file access permissions in your device settings.";
      } else if (error.response?.status === 404) {
        errorMessage =
          "Device data not found. Please check if the device exists and try again.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error occurred. Please try again later.";
      }

      // Show the actual error message for debugging
      const debugMessage = `${errorMessage}\n\nDebug: ${error.message}`;

      showCustomAlert("Operation Failed", debugMessage, "error", {
        text: "Retry",
        onPress: () => handleDownload(format),
      });

      return false;
    } finally {
      setDownloading(false);
    }
  };

  const toggleExportOptions = () => {
    setShowExportOptions(!showExportOptions);
  }; // Data processing for alert trends chart only
  // Removed device usage trends chart as per requirements
  const getAlertTrendsData = () => {
    // Check if timeBasedData has the proper structure for alerts
    if (!timeBasedData?.data || !Array.isArray(timeBasedData.data)) return null;

    // Find device data for our specific device or use first device
    const deviceData =
      timeBasedData.data.find(
        (device) => device.device_id === parseInt(deviceId)
      ) || timeBasedData.data[0];

    if (!deviceData?.periods || !Array.isArray(deviceData.periods)) return null;

    const periods = deviceData.periods;
    if (periods.length === 0) return null;

    // Extract labels and data from periods
    const labels = periods.map((period) => {
      // Format period name for display
      if (period.period_name) {
        // Extract date from period name (e.g., "Week 2024-06-10" -> "6/10")
        const parts = period.period_name.split(" ");
        if (parts.length > 1) {
          return parts[1]; // Use the date/period identifier directly
        }
      }
      // Fallback to period field
      return period.period ? period.period.substring(0, 10) : "N/A";
    });

    // Extract individual alert data arrays for multi-line chart
    const lowAlerts = periods.map((period) => period.low_alerts || 0);
    const emptyAlerts = periods.map((period) => period.empty_alerts || 0);
    const fullAlerts = periods.map((period) => period.full_alerts || 0);
    const tamperAlerts = periods.map((period) => period.tamper_alerts || 0);

    // Calculate totals for macros
    const totalLowAlerts = lowAlerts.reduce((a, b) => a + b, 0);
    const totalEmptyAlerts = emptyAlerts.reduce((a, b) => a + b, 0);
    const totalFullAlerts = fullAlerts.reduce((a, b) => a + b, 0);
    const totalTamperAlerts = tamperAlerts.reduce((a, b) => a + b, 0);

    const tamperConfig = getDeviceStatusConfig("tamper", null, isDark);
    const lowConfig = getDeviceStatusConfig("low", null, isDark);
    const emptyConfig = getDeviceStatusConfig("empty", null, isDark);
    const fullConfig = getDeviceStatusConfig("full", null, isDark);

    // Return data in the format expected by AreaLineChart for alert time-series
    return {
      labels,
      // NEW: Alert datasets structure for multi-line chart plotting
      alertDatasets: {
        full_alerts: fullAlerts,
        empty_alerts: emptyAlerts,
        low_alerts: lowAlerts,
        tamper_alerts: tamperAlerts,
      },
      macros: [
        {
          name: "Low",
          value: totalLowAlerts,
          color: lowConfig.color,
          unit: "",
        },
        {
          name: "Empty",
          value: totalEmptyAlerts,
          color: emptyConfig.color,
          unit: "",
        },
        {
          name: "Full",
          value: totalFullAlerts,
          color: fullConfig.color,
          unit: "",
        },
        {
          name: "Tamper",
          value: totalTamperAlerts,
          color: tamperConfig.color,
          unit: "",
        },
      ],
    };
  };

  const getCurrentDevice = () => {
    return statusDistribution?.devices?.find(
      (device) => device.device_id === parseInt(deviceId)
    );
  };
  const getStatusChartData = () => {
    // For device details page, we want to show the current device's status distribution,
    // not the overall statistics across all devices
    if (!statusDistribution?.devices) return [];

    // Find the current device's data
    const currentDevice = getCurrentDevice();

    if (!currentDevice?.status_counts) return [];

    const statusCounts = currentDevice.status_counts;

    // Only show tissue-level statuses: tamper, empty, low, full
    // Completely exclude normal, active, inactive, etc.
    const allowedStatuses = ["tamper", "empty", "low", "full"];

    const chartData = Object.entries(statusCounts)
      .filter(
        ([status, count]) =>
          count > 0 && allowedStatuses.includes(status.toLowerCase())
      ) // Only include tissue-level statuses with count > 0
      .map(([status, count]) => {
        const statusConfig = getDeviceStatusConfig(status, null, isDark);
        return {
          name: status.charAt(0).toUpperCase() + status.slice(1),
          population: count, // Use 'population' field as expected by DonutChart
          value: count, // Keep value for backward compatibility
          color: statusConfig.color,
          legendFontColor: themeColors.text,
          legendFontSize: 14,
        };
      });

    return chartData;
  };

  const getStatusGradient = (status) => {
    const statusConfig = getDeviceStatusConfig(status, isActive, isDark);
    return statusConfig.gradient;
  };
  const getBatteryLevel = () => {
    // Get battery percentage from realtime status
    const batteryPercentage = realtimeStatus?.battery_percentage;
    if (batteryPercentage && batteryPercentage > 0) {
      // Battery percentage is already calculated on the backend
      return Math.round(batteryPercentage);
    }

    // Try other sources for battery level
    const directBatteryLevel =
      realtimeStatus?.battery_level ||
      device?.battery_level ||
      analytics?.battery_level;

    if (directBatteryLevel && directBatteryLevel > 0) {
      return Math.round(directBatteryLevel);
    }

    return null; // Return null if no valid data
  };

  const getSignalStrength = () => {
    // Only use real data sources
    const signalStrength =
      realtimeStatus?.signal_strength ||
      device?.signal_strength ||
      analytics?.signal_strength;

    return signalStrength && signalStrength > 0
      ? Math.round(signalStrength)
      : null;
  };
  const styles = getStyles(themeColors, isDark);
  if (loading) {
    return (
      <LoadingScreen
        message="Loading Device Details"
        submessage="Fetching analytics and real-time data..."
        variant="fullscreen"
        iconName="device-analytics"
        customIcon={
          <MaterialCommunityIcons
            name="details"
            size={50}
            color={themeColors.primary}
          />
        }
        iconSize={60}
      />
    );
  }
  const statusChartData = getStatusChartData();
  const batteryLevel = getBatteryLevel();
  const signalStrength = getSignalStrength();
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? themeColors.surface : "#ffffff"}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header with Gradient */}
        <LinearGradient
          colors={
            isDark
              ? [themeColors.surface, themeColors.background]
              : ["#ffffff", themeColors.background]
          }
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark
                    ? `${themeColors.primary}30`
                    : `${themeColors.primary}15`,
                  borderColor: isDark
                    ? `${themeColors.primary}50`
                    : "transparent",
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={themeColors.primary}
              />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text
                style={[styles.headerTitle, { color: themeColors.heading }]}
              >
                Device Details
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={toggleExportOptions}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: showExportOptions
                      ? isDark
                        ? `${themeColors.primary}40`
                        : `${themeColors.primary}25`
                      : isDark
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`,
                    borderColor: showExportOptions
                      ? themeColors.primary
                      : isDark
                      ? themeColors.primary
                      : "transparent",
                    borderWidth: showExportOptions ? 1 : isDark ? 1 : 0,
                  },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showExportOptions ? "download" : "download-outline"}
                  size={24}
                  color={themeColors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Separator Line */}
        <View
          style={[
            styles.headerSeparator,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          ]}
        />

        {/* Hero Card */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={getStatusGradient(deviceStatus)}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroHeader}>
                <View style={styles.statusIcon}>
                  <MaterialCommunityIcons
                    name={
                      getDeviceStatusConfig(deviceStatus, isActive, isDark)
                        ?.icon || (isActive ? "check-circle" : "wifi-off")
                    }
                    size={32}
                    color="white"
                  />
                </View>
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={14} color="white" />
                  <Text style={styles.locationText}>
                    {room} • Floor {floor}
                  </Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>{deviceName}</Text>
              <Text style={styles.heroSubtitle}>ID: {deviceId}</Text>
              <View style={styles.heroStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {deviceStatus.toUpperCase()}
                  </Text>
                  <Text style={styles.statLabel}>Status</Text>
                </View>
                <View style={styles.statDivider} />
                {/* <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {isActive ? "YES" : "NO"}
                  </Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View> */}
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{getTotalUsage() || "0"}</Text>
                  <Text style={styles.statLabel}>Total Usage</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
        {/* Quick Info Cards */}
        <View style={styles.quickInfoContainer}>
          <View
            style={[
              styles.quickInfoCard,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <View
              style={[
                styles.quickInfoIcon,
                {
                  backgroundColor: getDeviceStatusConfig("normal", true, isDark)
                    .color,
                },
              ]}
            >
              <Ionicons name="battery-charging" size={20} color="white" />
            </View>
            <View style={styles.quickInfoContent}>
              <Text
                style={[styles.quickInfoLabel, { color: themeColors.text }]}
              >
                Battery Level
              </Text>
              <Text
                style={[styles.quickInfoValue, { color: themeColors.heading }]}
              >
                {batteryLevel !== null ? `${batteryLevel}%` : "N/A"}
              </Text>
              {batteryLevel !== null && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${batteryLevel}%`,
                        backgroundColor:
                          batteryLevel > 20
                            ? getDeviceStatusConfig("normal", true, isDark)
                                .color
                            : getDeviceStatusConfig("empty", null, isDark)
                                .color,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>
          <View
            style={[
              styles.quickInfoCard,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <View
              style={[
                styles.quickInfoIcon,
                {
                  backgroundColor: getDeviceStatusConfig("full", null, isDark)
                    .color,
                },
              ]}
            >
              <Ionicons name="wifi" size={20} color="white" />
            </View>
            <View style={styles.quickInfoContent}>
              <Text
                style={[styles.quickInfoLabel, { color: themeColors.text }]}
              >
                Signal Strength
              </Text>
              <Text
                style={[styles.quickInfoValue, { color: themeColors.heading }]}
              >
                {signalStrength !== null ? `${signalStrength}%` : "N/A"}
              </Text>
              {signalStrength !== null && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${signalStrength}%`,
                        backgroundColor: getDeviceStatusConfig(
                          "full",
                          null,
                          isDark
                        ).color,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Status Distribution Chart */}
        {/* {statusChartData.length > 0 ? (
          <View style={styles.chartSection}>
            <DonutChart
              data={statusChartData}
              title="Device Status History"
              centerValue={getCurrentDevice()?.total_entries || 0}
              centerLabel="Total Records"
            />
          </View>
        ) : (
          <View style={styles.chartSection}>
            <View
              style={[
                styles.noDataContainer,
                { backgroundColor: themeColors.surface },
              ]}
            >
              <MaterialCommunityIcons
                name="chart-donut"
                size={48}
                color={themeColors.textSecondary}
              />
              <Text style={[styles.noDataText, { color: themeColors.text }]}>
                No status data available
              </Text>
              <Text
                style={[
                  styles.noDataSubtext,
                  { color: themeColors.textSecondary },
                ]}
              >
                Device status distribution will appear here when data is
                available
              </Text>
            </View>
          </View>
        )} */}
        {/* Technical Details */}
        <View
          style={[styles.detailsCard, { backgroundColor: themeColors.surface }]}
        >
          <View style={styles.detailsHeader}>
            <View
              style={[
                styles.detailsIcon,
                { backgroundColor: themeColors.primary },
              ]}
            >
              <MaterialIcons name="settings" size={20} color="white" />
            </View>
            <Text style={[styles.detailsTitle, { color: themeColors.heading }]}>
              Technical Details
            </Text>
          </View>
          <View style={styles.detailsGrid}>
            <DetailRow
              icon="hardware-chip"
              iconColor={getDeviceStatusConfig("low", null, isDark).color}
              label="Device ID"
              value={deviceId}
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="calendar-outline"
              iconColor={getDeviceStatusConfig("full", null, isDark).color}
              label="Device Added"
              value={
                getCurrentDevice()?.timestamps?.device_added
                  ? new Date(
                      getCurrentDevice().timestamps.device_added
                    ).toLocaleDateString()
                  : "N/A"
              }
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="location"
              iconColor={getDeviceStatusConfig("normal", true, isDark).color}
              label="Location"
              value={`${room}, Floor ${floor}`}
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="time"
              iconColor={getDeviceStatusConfig("tamper", null, isDark).color}
              label="Last Updated"
              value={
                realtimeStatus?.last_updated
                  ? new Date(realtimeStatus.last_updated).toLocaleString()
                  : "N/A"
              }
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="cellular"
              iconColor={getDeviceStatusConfig("empty", null, isDark).color}
              label="Current Alert"
              value={realtimeStatus?.current_alert || "None"}
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="speedometer"
              iconColor={getDeviceStatusConfig("low", null, isDark).color}
              label="Battery Percentage"
              value={
                realtimeStatus?.battery_percentage
                  ? `${Math.round(realtimeStatus.battery_percentage)}%`
                  : "N/A"
              }
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="calendar"
              iconColor={getDeviceStatusConfig("normal", true, isDark).color}
              label="Device Status"
              value={(
                realtimeStatus?.current_status || deviceStatus
              ).toUpperCase()}
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="analytics-outline"
              iconColor={getDeviceStatusConfig("full", null, isDark).color}
              label="Total Usage Count"
              value={getTotalUsage().toString()}
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="document-text"
              iconColor={getDeviceStatusConfig("full", null, isDark).color}
              label="Tissue Type"
              value={
                device?.tissue_type === "hand_towel"
                  ? "Hand Towel"
                  : device?.tissue_type === "toilet_paper"
                  ? "Toilet Paper"
                  : "N/A"
              }
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="analytics"
              iconColor={getDeviceStatusConfig("low", null, isDark).color}
              label="Meter Capacity"
              value={device?.meter_capacity || "N/A"}
              themeColors={themeColors}
              styles={styles}
            />
            <DetailRow
              icon="settings"
              iconColor={getDeviceStatusConfig("tamper", null, isDark).color}
              label="Reference Value"
              value={device?.refer_value || device?.meter_capacity || "N/A"}
              themeColors={themeColors}
              styles={styles}
            />
          </View>
        </View>
        {/* Alert Trends Chart */}
        <View
          style={[styles.chartCard, { backgroundColor: themeColors.surface }]}
        >
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <View
                style={[
                  styles.chartIcon,
                  { backgroundColor: `${themeColors.primary}20` },
                ]}
              >
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color={themeColors.primary}
                />
              </View>
              <Text style={[styles.chartTitle, { color: themeColors.heading }]}>
                Alert Trends
              </Text>
            </View>
            {/* Normal Toggle Switch */}
            <View style={styles.toggleSwitchContainer}>
              <Text style={[styles.toggleLabel, { color: themeColors.text }]}>
                Daily
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor:
                      selectedPeriod === "weekly"
                        ? themeColors.primary
                        : themeColors.border,
                  },
                ]}
                onPress={() =>
                  handlePeriodChange(
                    selectedPeriod === "daily" ? "weekly" : "daily"
                  )
                }
                disabled={alertTrendsLoading}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: "white",
                      transform: [
                        { translateX: selectedPeriod === "weekly" ? 20 : 2 },
                      ],
                    },
                  ]}
                />
              </TouchableOpacity>
              <Text style={[styles.toggleLabel, { color: themeColors.text }]}>
                Weekly
              </Text>
            </View>
          </View>

          {getAlertTrendsData() ? (
            <>
              {alertTrendsLoading ? (
                <View style={styles.loadingContainer}>
                  <LoadingScreen
                    message="Updating Trends"
                    submessage={`Loading ${selectedPeriod} data...`}
                    variant="minimal"
                    iconName="chart-line"
                    iconSize={24}
                  />
                </View>
              ) : (
                <>
                  {/* Enhanced Alert Summary Cards */}
                  <View style={styles.alertSummaryContainer}>
                    {getAlertTrendsData().macros.map((macro, index) => (
                      <View
                        key={index}
                        style={[
                          styles.alertSummaryCard,
                          {
                            backgroundColor: `${macro.color}15`,
                            borderLeftColor: macro.color,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.alertSummaryIcon,
                            { backgroundColor: macro.color },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              macro.name === "Low"
                                ? "archive-outline"
                                : macro.name === "Empty"
                                ? "archive-cancel-outline"
                                : macro.name === "Full"
                                ? "archive"
                                : "shield-alert-outline"
                            }
                            size={16}
                            color="white"
                          />
                        </View>
                        <View style={styles.alertSummaryContent}>
                          <Text
                            style={[
                              styles.alertSummaryValue,
                              { color: themeColors.heading },
                            ]}
                          >
                            {macro.value}
                          </Text>
                          <Text
                            style={[
                              styles.alertSummaryLabel,
                              { color: themeColors.text },
                            ]}
                          >
                            {macro.name}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  <AreaLineChart
                    data={getAlertTrendsData()}
                    title=""
                    subtitle={`${
                      selectedPeriod.charAt(0).toUpperCase() +
                      selectedPeriod.slice(1)
                    } alert patterns`}
                    showMacros={false}
                    scrollable={true}
                  />
                </>
              )}
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={48}
                color={themeColors.textSecondary}
              />
              <Text style={[styles.noDataText, { color: themeColors.text }]}>
                No alert data available
              </Text>
              <Text
                style={[
                  styles.noDataSubtext,
                  { color: themeColors.textSecondary },
                ]}
              >
                Alert trends will appear here when data is available
              </Text>
            </View>
          )}
        </View>
        {/* Enhanced Export Data Section */}
        <View
          style={[styles.exportCard, { backgroundColor: themeColors.surface }]}
        >
          <View style={styles.exportHeader}>
            <View
              style={[
                styles.exportIconContainer,
                { backgroundColor: `${themeColors.primary}20` },
              ]}
            >
              <MaterialCommunityIcons
                name="download"
                size={20}
                color={themeColors.primary}
              />
            </View>
            <Text style={[styles.exportTitle, { color: themeColors.heading }]}>
              Export Complete Device Data
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.exportDescription, { color: themeColors.text }]}>
            Download comprehensive analytics for this device including all
            available data and trends.
          </Text>

          {showExportOptions ? (
            <View style={styles.exportOptionsContainer}>
              {/* Download Buttons */}
              <View style={styles.downloadButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    {
                      backgroundColor: downloading
                        ? themeColors.border
                        : `${themeColors.primary}15`,
                      borderColor: themeColors.primary,
                    },
                  ]}
                  onPress={() => handleDownload("csv")}
                  disabled={downloading}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="file-delimited-outline"
                    size={20}
                    color={
                      downloading
                        ? themeColors.textSecondary
                        : themeColors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.downloadButtonText,
                      {
                        color: downloading
                          ? themeColors.textSecondary
                          : themeColors.primary,
                      },
                    ]}
                  >
                    {downloading ? "..." : "CSV"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    {
                      backgroundColor: downloading
                        ? themeColors.border
                        : `${themeColors.primary}15`,
                      borderColor: themeColors.primary,
                    },
                  ]}
                  onPress={() => handleDownload("json")}
                  disabled={downloading}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="code-json"
                    size={20}
                    color={
                      downloading
                        ? themeColors.textSecondary
                        : themeColors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.downloadButtonText,
                      {
                        color: downloading
                          ? themeColors.textSecondary
                          : themeColors.primary,
                      },
                    ]}
                  >
                    {downloading ? "..." : "JSON"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    {
                      backgroundColor: downloading
                        ? themeColors.border
                        : `${themeColors.primary}15`,
                      borderColor: themeColors.primary,
                    },
                  ]}
                  onPress={() => handleDownload("pdf")}
                  disabled={downloading}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={20}
                    color={
                      downloading
                        ? themeColors.textSecondary
                        : themeColors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.downloadButtonText,
                      {
                        color: downloading
                          ? themeColors.textSecondary
                          : themeColors.primary,
                      },
                    ]}
                  >
                    {downloading ? "..." : "PDF"}
                  </Text>
                </TouchableOpacity>
              </View>

              {downloading && (
                <View style={styles.downloadingStatus}>
                  <MaterialCommunityIcons
                    name="download"
                    size={16}
                    color={themeColors.primary}
                  />
                  <Text
                    style={[
                      styles.downloadingText,
                      { color: themeColors.text },
                    ]}
                  >
                    Downloading... Please wait
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.hideExportButton,
                  { backgroundColor: themeColors.background },
                ]}
                onPress={toggleExportOptions}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="chevron-up"
                  size={20}
                  color={themeColors.text}
                />
                <Text
                  style={[styles.hideExportText, { color: themeColors.text }]}
                >
                  Hide Options
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.showExportButton,
                {
                  backgroundColor: `${themeColors.primary}15`,
                  borderColor: themeColors.primary,
                },
              ]}
              onPress={toggleExportOptions}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={themeColors.primary}
              />
              <Text
                style={[styles.showExportText, { color: themeColors.primary }]}
              >
                Show Export Options
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
      {/* Custom Alert Modals */}
      <CustomAlert
        visible={customAlert.visible}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
        primaryAction={customAlert.primaryAction}
        secondaryAction={customAlert.secondaryAction}
        themeColors={themeColors}
        isDark={isDark}
      />
      <DownloadOptionsAlert
        visible={downloadOptionsAlert.visible}
        onClose={() => {
          // Call cancel callback if it exists, then close the alert
          if (downloadOptionsAlert.onCancel) {
            downloadOptionsAlert.onCancel();
          }
          setDownloadOptionsAlert((prev) => ({ ...prev, visible: false }));
        }}
        format={downloadOptionsAlert.format}
        onShare={downloadOptionsAlert.onShare}
        onDownload={downloadOptionsAlert.onDownload}
        themeColors={themeColors}
        isDark={isDark}
      />
    </View>
  );
}

// Detail Row Component
const DetailRow = ({ icon, iconColor, label, value, themeColors, styles }) => (
  <View style={styles.detailRow}>
    <View style={[styles.detailIcon, { backgroundColor: `${iconColor}20` }]}>
      <Ionicons name={icon} size={16} color={iconColor} />
    </View>
    <View style={styles.detailContent}>
      <Text style={[styles.detailLabel, { color: themeColors.text }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: themeColors.heading }]}>
        {value}
      </Text>
    </View>
  </View>
);

// Styles
const getStyles = (themeColors, isDark) => ({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerGradient: {
    paddingTop: 44,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSeparator: {
    height: 1,
    width: "100%",
  },
  heroCardContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroContent: {
    gap: 16,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  locationText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  heroTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "500",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  statValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  quickInfoContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickInfoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  quickInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  quickInfoContent: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: isDark ? "#374151" : "#F3F4F6",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  chartSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chartIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  loadingContainer: {
    minHeight: 100,
  }, // Normal Toggle Switch Styles
  toggleSwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 45,
    textAlign: "center",
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Download Button Styles
  downloadButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  downloadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  downloadingStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 8,
    marginBottom: 12,
  },
  downloadingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  // Enhanced Toggle Styles (keeping for backward compatibility)
  modernToggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 2,
  },
  modernToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeToggleButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modernToggleText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  // Alert Summary Cards
  alertSummaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  alertSummaryCard: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertSummaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  alertSummaryContent: {
    flex: 1,
  },
  alertSummaryValue: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  alertSummaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.8,
    marginTop: 1,
  },
  periodToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noDataContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  noDataSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
    opacity: 0.7,
  },
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  detailsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  exportSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  // Enhanced Export Styles
  exportCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  exportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  exportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  exportDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  exportOptionsContainer: {
    gap: 16,
  },
  showExportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  showExportText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  hideExportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  hideExportText: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  exportToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  exportToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 40,
  },
});
