import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Pressable,
} from "react-native";
import LoadingScreen from "../../../components/common/LoadingScreen";
import DeviceHeader from "../../../components/User/DeviceHeader";
import { useAuth } from "../../../context/AuthContext";
import { useThemeContext } from "../../../context/ThemeContext";
import { useDeviceOperations } from "../../../hooks/useDeviceOperations";
import useDeviceStore from "../../../store/useDeviceStore";
import { getDeviceStatusConfig } from "../../../utils/deviceStatusConfig";
import SummaryCards from "../../../components/AdminAnalytics/SummaryCards";
import { DonutChart } from "../../../components/Analytics/ChartComponents";
import {
  getBatteryAndPowerAlertCounts,
  getTissueAlertCounts,
} from "../../../utils/alertCounts";
import {
  isTissueAlert,
  isBatteryAlert,
} from "../../../utils/deviceStatusConfig";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const Home = () => {
  const { accessToken } = useAuth();
  const { themeColors, isDark } = useThemeContext();
  const navigation = useNavigation();

  // Device operations (analytics)
  const { devices, loading, error, refreshing, loadDevices, clearError } =
    useDeviceOperations(accessToken); // Zustand store for real-time status and analytics
  const {
    analytics,
    realtimeStatus,
    fetchDeviceRealtimeStatus,
    refreshAllData,
    lastDataUpdate,
    realtimeLoading,
    realtimeError,
    clearRealtimeError,
  } = useDeviceStore();

  // Local UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const intervalRef = useRef(null);
  const [selectedAlertType, setSelectedAlertType] = useState("tissue");
  const [showAlertDevices, setShowAlertDevices] = useState(false);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Create dynamic styles
  const styles = createStyles(themeColors, isDark);
  // Fetch all data (analytics and real-time status) - Enhanced with synchronization
  const fetchAllData = useCallback(async () => {
    if (!loading && accessToken) {
      try {
        console.log("🏠 Home: Fetching all data for synchronization...");

        // Use the centralized refresh function for consistency with admin tabs
        await Promise.all([
          loadDevices(),
          refreshAllData(accessToken), // This ensures sync with admin components
        ]);

        if (isFirstLoad) setIsFirstLoad(false);
        console.log("✅ Home: Data fetch completed successfully");
      } catch (err) {
        console.error("❌ Home: Error fetching data:", err);
      }
    }
  }, [loading, accessToken, loadDevices, refreshAllData, isFirstLoad]);
  useEffect(() => {
    if (!loading && accessToken && isFirstLoad) {
      fetchAllData();
    }
  }, [fetchAllData, loading, accessToken, isFirstLoad]);
  // Enhanced auto-refresh real-time status every 30 seconds (aligned with admin components)
  useEffect(() => {
    if (!loading && accessToken && !isFirstLoad) {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Light refresh for real-time data only (same as AdminDash)
      intervalRef.current = setInterval(() => {
        console.log("🔄 Home: Auto-refreshing real-time status...");
        fetchDeviceRealtimeStatus(accessToken).catch(() => {});
      }, 30000); // 30 seconds - same as admin components

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [loading, accessToken, isFirstLoad, fetchDeviceRealtimeStatus]);
  // Clear errors on unmount
  useEffect(() => {
    return () => {
      if (error) clearError();
      if (realtimeError) clearRealtimeError();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [error, clearError, realtimeError, clearRealtimeError]);

  // Auto-sync with admin operations - listen for data updates
  useEffect(() => {
    if (lastDataUpdate && !isFirstLoad && !loading && accessToken) {
      console.log(
        "🔄 Home: Detected data update from admin operations, refreshing..."
      );
      // Light refresh when data changes from admin operations
      fetchDeviceRealtimeStatus(accessToken).catch(() => {});
    }
  }, [
    lastDataUpdate,
    isFirstLoad,
    loading,
    accessToken,
    fetchDeviceRealtimeStatus,
  ]);
  // Merge analytics, real-time status, and device info
  const mergedDevices = React.useMemo(() => {
    if (!analytics || !Array.isArray(analytics)) return [];

    console.log(`🏠 Home: Merging device data `);

    return analytics.map((device) => {
      const status =
        realtimeStatus?.find((s) => s.device_id === device.device_id) || {};
      const deviceInfo = devices?.find((d) => d.id === device.device_id) || {};

      return {
        ...device,
        // Device information
        device_name:
          status.device_name || deviceInfo.name || `Device ${device.device_id}`,
        name:
          status.device_name || deviceInfo.name || `Device ${device.device_id}`,
        // Real-time status data
        is_active: status.is_active !== undefined ? status.is_active : false,
        current_status: status.current_status || "unknown",
        current_alert: status.current_alert,
        current_tamper: status.current_tamper || false,
        current_count: status.current_count || 0,
        minutes_since_update: status.minutes_since_update,
        status_priority:
          status.status_priority !== undefined ? status.status_priority : -1,
        // Keep existing analytics data
        low_alert_count: device.low_alert_count || 0,
        tamper_count: device.tamper_count || 0,
        total_entries: device.total_entries || 0,
        last_alert_time: device.last_alert_time,
        room: deviceInfo.room || device.room,
        floor: deviceInfo.floor || device.floor,
      };
    });
  }, [analytics, realtimeStatus, devices]);

  // Sort devices by priority: tamper > critical > low > medium > high > active > inactive
  const sortedDevices = React.useMemo(() => {
    // Helper function to get priority for sorting using utility
    const getDevicePriority = (device) => {
      const statusConfig = getDeviceStatusConfig(
        device.current_status,
        device.is_active,
        isDark
      );
      return statusConfig.priority;
    };

    return [...mergedDevices].sort((a, b) => {
      // First sort by our custom priority
      const aPriority = getDevicePriority(a);
      const bPriority = getDevicePriority(b);

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // Then by last activity time (most recent first) for same priority levels
      const aTime = a.minutes_since_update || 0;
      const bTime = b.minutes_since_update || 0;
      if (aTime !== bTime) {
        return aTime - bTime; // Lower minutes = more recent = higher priority
      }

      // Then by total alerts
      const totalAlertsA = (a.low_alert_count || 0) + (a.tamper_count || 0);
      const totalAlertsB = (b.low_alert_count || 0) + (b.tamper_count || 0);
      return totalAlertsB - totalAlertsA;
    });
  }, [mergedDevices, isDark]);

  // --- NEW: Filtered device list based on selected alert type and search term ---
  const filteredDevices = React.useMemo(() => {
    if (!sortedDevices || sortedDevices.length === 0) return [];
    let devices = [];
    if (selectedAlertType === "tissue") {
      devices = sortedDevices.filter((device) => isTissueAlert(device));
    } else if (selectedAlertType === "battery") {
      devices = sortedDevices.filter((device) => isBatteryAlert(device));
    } else {
      devices = sortedDevices;
    }
    if (!searchTerm.trim()) return devices;
    const term = searchTerm.toLowerCase().trim();
    return devices.filter((device) => {
      const name = (device.name || device.device_name || "").toLowerCase();
      const id = (device.device_id || "").toString().toLowerCase();
      const room = (device.room || "").toLowerCase();
      const status = (device.current_status || "").toLowerCase();
      return (
        name.includes(term) ||
        id.includes(term) ||
        room.includes(term) ||
        status.includes(term)
      );
    });
  }, [sortedDevices, selectedAlertType, searchTerm]);

  // Corrected device statistics calculation with proper offline logic
  const deviceStats = React.useMemo(() => {
    if (!filteredDevices || filteredDevices.length === 0) {
      return {
        totalDevices: 0,
        activeDevices: 0,
        offlineDevices: 0,
        alertDevices: 0,
        totalLowAlerts: 0,
        totalTamper: 0,
        recentActivity24h: 0,
      };
    }

    // Enhanced Active devices calculation
    const activeDevicesCount = filteredDevices.filter((d) => {
      const isActiveFlag = d.is_active === true;
      const hasActiveStatus = [
        "normal",
        "active",
        "online",
        "tamper",
        "empty",
        "low",
        "full",
      ].includes(d.current_status?.toLowerCase());
      const hasRecentActivity =
        d.minutes_since_update !== null && d.minutes_since_update <= 30;
      const hasPositivePriority = d.status_priority > 0;

      return (
        isActiveFlag ||
        hasActiveStatus ||
        hasRecentActivity ||
        hasPositivePriority
      );
    }).length;

    // Corrected Offline devices calculation
    const offlineDevicesCount = filteredDevices.filter((d) => {
      // A device is offline if it's explicitly inactive OR has offline status OR has very stale data
      const isExplicitlyInactive = d.is_active === false;
      const hasOfflineStatus = [
        "inactive",
        "offline",
        "disconnected",
        "unknown",
      ].includes(d.current_status?.toLowerCase());
      const hasVeryStaleData =
        d.minutes_since_update !== null && d.minutes_since_update > 120; // 2+ hours is considered offline
      const hasNoRecentActivity =
        d.minutes_since_update === null && d.is_active !== true;

      // Device is offline if any of these conditions are true
      return (
        isExplicitlyInactive ||
        hasOfflineStatus ||
        hasVeryStaleData ||
        hasNoRecentActivity
      );
    }).length;

    // Make sure we don't double count - total should equal active + offline
    const calculatedOffline = Math.max(
      0,
      filteredDevices.length - activeDevicesCount
    );
    const finalOfflineCount = Math.min(offlineDevicesCount, calculatedOffline);
    const alertDevices = filteredDevices.filter((d) =>
      ["tamper", "empty", "low"].includes(d.current_status?.toLowerCase())
    ).length;

    const totalLowAlerts = filteredDevices.reduce(
      (sum, d) => sum + (d.low_alert_count || 0),
      0
    );
    const totalTamper = filteredDevices.reduce(
      (sum, d) => sum + (d.tamper_count || 0),
      0
    );

    // Calculate recent activity (last 24h)
    const now = new Date();
    const recentActivity24h = filteredDevices.filter((d) => {
      if (!d.last_alert_time) return false;
      try {
        const lastAlert = new Date(d.last_alert_time);
        const diffHours = (now - lastAlert) / (1000 * 60 * 60);
        return diffHours <= 24;
      } catch {
        return false;
      }
    }).length;

    return {
      totalDevices: filteredDevices.length,
      activeDevices: activeDevicesCount,
      offlineDevices: finalOfflineCount,
      alertDevices,
      totalLowAlerts,
      totalTamper,
      recentActivity24h,
    };
  }, [filteredDevices]);

  // --- NEW: Memoized alert distribution data for DonutChart ---
  const alertDistributionData = React.useMemo(() => {
    if (selectedAlertType === "tissue") {
      let emptyCount = 0,
        fullCount = 0,
        lowCount = 0,
        tamperCount = 0;
      if (
        realtimeStatus &&
        Array.isArray(realtimeStatus) &&
        realtimeStatus.length > 0
      ) {
        realtimeStatus.forEach((device) => {
          const status = device.current_status?.toLowerCase() || "";
          switch (status) {
            case "empty":
              emptyCount++;
              break;
            case "full":
              fullCount++;
              break;
            case "low":
              lowCount++;
              break;
            case "tamper":
              tamperCount++;
              break;
            default:
              break;
          }
        });
      }
      return [
        { name: "Empty", value: emptyCount, color: "#FF4757" },
        { name: "Low", value: lowCount, color: "#FF9F00" },
        { name: "Full", value: fullCount, color: "#10B981" },
        { name: "Tamper", value: tamperCount, color: "#8B5CF6" },
      ];
    } else if (selectedAlertType === "battery") {
      let criticalBatteryCount = 0,
        lowBatteryCount = 0,
        mediumBatteryCount = 0,
        goodBatteryCount = 0,
        powerOffCount = 0;
      if (
        realtimeStatus &&
        Array.isArray(realtimeStatus) &&
        realtimeStatus.length > 0
      ) {
        realtimeStatus.forEach((device) => {
          const isPowerOff = (powerStatus) => {
            if (powerStatus === null || powerStatus === undefined) return true;
            const status = String(powerStatus).trim().toLowerCase();
            return ["off", "no", "none", "", "0", "false"].includes(status);
          };
          const powerStatus = device.power_status;
          const deviceIsPowerOff = isPowerOff(powerStatus);
          const batteryCritical = device.battery_critical === 1;
          const batteryLow = device.battery_low === 1;
          const batteryPercentage =
            typeof device.battery_percentage === "number"
              ? device.battery_percentage
              : null;
          let batteryStatus = null;
          if (!deviceIsPowerOff && batteryPercentage !== null) {
            if (batteryPercentage <= 10) {
              batteryStatus = "critical";
            } else if (batteryPercentage > 10 && batteryPercentage <= 20) {
              batteryStatus = "low";
            } else if (batteryPercentage > 20 && batteryPercentage <= 50) {
              batteryStatus = "medium";
            } else if (batteryPercentage > 50) {
              batteryStatus = "good";
            }
          }
          if (deviceIsPowerOff) {
            powerOffCount++;
          } else if (batteryStatus === "critical" || batteryCritical) {
            criticalBatteryCount++;
          } else if (batteryStatus === "low" || batteryLow) {
            lowBatteryCount++;
          } else if (batteryStatus === "medium") {
            mediumBatteryCount++;
          } else if (batteryStatus === "good") {
            goodBatteryCount++;
          }
        });
      }
      return [
        {
          name: "Critical Battery",
          value: criticalBatteryCount,
          color: "#FF3B30",
        },
        { name: "Low Battery", value: lowBatteryCount, color: "#FF9F00" },
        { name: "Medium Battery", value: mediumBatteryCount, color: "#FFD600" },
        { name: "Good Battery", value: goodBatteryCount, color: "#10B981" },
        { name: "Power Off", value: powerOffCount, color: "#8B5CF6" },
      ];
    }
    return [];
  }, [realtimeStatus, selectedAlertType]);

  // --- NEW: Alert counts for summary cards ---
  const batteryAlertCounts = React.useMemo(
    () => getBatteryAndPowerAlertCounts(mergedDevices),
    [mergedDevices]
  );
  const tissueAlertCounts = React.useMemo(
    () => getTissueAlertCounts(mergedDevices),
    [mergedDevices]
  );

  // Unified stats calculation (same as AdminDash)
  const stats = React.useMemo(() => {
    const devicesArr = Array.isArray(devices) ? devices : [];
    const analyticsArr = Array.isArray(analytics) ? analytics : [];
    const realtimeArr = Array.isArray(realtimeStatus) ? realtimeStatus : [];

    // Map for fast lookup
    const analyticsMap = new Map(
      analyticsArr.map((a) => [a.device_id || a.id, a])
    );
    const statusMap = new Map(realtimeArr.map((s) => [s.device_id, s]));

    // Merge all devices (including new ones)
    const mergedDevices = devicesArr.map((device) => {
      const analyticsData = analyticsMap.get(device.id) || {};
      const status = statusMap.get(device.id) || {};

      return {
        ...device,
        ...analyticsData,
        is_active:
          status.is_active !== undefined
            ? status.is_active
            : analyticsData.is_active !== undefined
            ? analyticsData.is_active
            : false,
        current_status:
          status.current_status || analyticsData.current_status || "unknown",
        minutes_since_update:
          status.minutes_since_update ??
          analyticsData.minutes_since_update ??
          null,
        status_priority:
          status.status_priority ?? analyticsData.status_priority ?? -1,
        device_name:
          device.name || analyticsData.device_name || `Device ${device.id}`,
        name: device.name || analyticsData.device_name || `Device ${device.id}`,
        room: device.room || analyticsData.room || "",
        floor: device.floor || analyticsData.floor || "",
        power_status: status.power_status || analyticsData.power_status,
        pwrstatus: status.pwrstatus || analyticsData.pwrstatus,
        power_off_count: analyticsData.power_off_count || 0,
        battery_percentage:
          status.battery_percentage || analyticsData.battery_percentage,
        battery_low_count: analyticsData.battery_low_count || 0,
        battery_critical_count: analyticsData.battery_critical_count || 0,
        battery_alert_count: analyticsData.battery_alert_count || 0,
        low_alert_count: analyticsData.low_alert_count || 0,
        tamper_count: analyticsData.tamper_count || 0,
        total_entries: analyticsData.total_entries || 0,
        last_alert_time: analyticsData.last_alert_time,
        current_alert: status.current_alert,
        current_tamper: status.current_tamper || false,
        current_count: status.current_count || 0,
      };
    });

    const totalDevices = mergedDevices.length;

    // Power off/offline logic
    const isPowerOff = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return false;
      const status = String(powerStatus).trim().toLowerCase();
      return ["off", "no", "none", "", "0", "false"].includes(status);
    };

    // Offline: current_status offline/disconnected/inactive/unknown or power_status/pwrstatus off/no/none/0/false
    const offlineDevicesArr = mergedDevices.filter((d) => {
      const status = (d.current_status || "").toLowerCase();
      const pwr = (d.pwrstatus || d.power_status || "").toLowerCase();
      return (
        ["offline", "disconnected", "inactive", "unknown"].includes(status) ||
        isPowerOff(pwr)
      );
    });

    // Active: not in offline
    const activeDevicesArr = mergedDevices.filter((d) => {
      const status = (d.current_status || "").toLowerCase();
      const pwr = (d.pwrstatus || d.power_status || "").toLowerCase();
      return (
        !["offline", "disconnected", "inactive", "unknown"].includes(status) &&
        !isPowerOff(pwr)
      );
    });

    return {
      totalDevices,
      activeDevices: activeDevicesArr.length,
      offlineDevices: offlineDevicesArr.length,
      offlineDevicesList: offlineDevicesArr,
      criticalDevices:
        mergedDevices.filter(
          (d) => d.current_status?.toLowerCase() === "tamper"
        ).length || 0,
      recentActivity24h: 0, // You can add this if you want
      totalEntries:
        analyticsArr.reduce((sum, d) => sum + (d.total_entries || 0), 0) || 0,
      totalBatteryAlerts:
        analyticsArr.reduce(
          (sum, d) => sum + (d.battery_alert_count || 0),
          0
        ) || 0,
      totalTissueAlerts:
        analyticsArr.reduce((sum, d) => sum + (d.tissue_alert_count || 0), 0) ||
        0,
    };
  }, [devices, analytics, realtimeStatus]);

  // Load cached data on mount (like AdminDash)
  useEffect(() => {
    (async () => {
      try {
        const cachedAnalyticsStr = await AsyncStorage.getItem("home_analytics");
        const cachedRealtimeStatusStr = await AsyncStorage.getItem(
          "home_realtimeStatus"
        );
        if (cachedAnalyticsStr)
          useDeviceStore.setState({
            analytics: JSON.parse(cachedAnalyticsStr),
          });
        if (cachedRealtimeStatusStr)
          useDeviceStore.setState({
            realtimeStatus: JSON.parse(cachedRealtimeStatusStr),
          });
      } catch (e) {
        console.warn("Failed to load cached home data", e);
      } finally {
        setCacheLoaded(true);
      }
    })();
  }, []);

  // Save latest data to cache after fetch
  useEffect(() => {
    if (analytics && analytics.length > 0) {
      AsyncStorage.setItem("home_analytics", JSON.stringify(analytics));
    }
    if (realtimeStatus && realtimeStatus.length > 0) {
      AsyncStorage.setItem(
        "home_realtimeStatus",
        JSON.stringify(realtimeStatus)
      );
    }
  }, [analytics, realtimeStatus]);

  // Show loading screen until cache is loaded (prevents zeros flash)
  if (!cacheLoaded) {
    return (
      <LoadingScreen
        message="Loading Home Dashboard"
        submessage="Fetching your latest updates..."
        iconName="devices"
        variant="fullscreen"
        customIcon={
          <MaterialCommunityIcons
            name="devices"
            size={50}
            color={themeColors.primary}
          />
        }
      />
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Solar Planet Style Modern Summary */}
          <SolarPlanetDeviceSummary stats={stats} />
          {/* --- ALERTS TOGGLE (copied from AdminDash) --- */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: "92%",
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: isDark ? 1 : 0,
                borderColor: themeColors.border,
                shadowColor: isDark ? "#000" : "#aaa",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
                minHeight: 70,
                backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
              }}
            >
              <LinearGradient
                colors={
                  isDark
                    ? [themeColors.surface, themeColors.background]
                    : [
                        "#FFFFFF",
                        themeColors.primary + "08",
                        themeColors.primary + "12",
                        "#FFFFFF",
                      ]
                }
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 16,
                  zIndex: 0,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  backgroundColor: "transparent",
                  position: "relative",
                  minHeight: 90,
                  zIndex: 1,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 16,
                  }}
                >
                  <Ionicons
                    name="water"
                    size={20}
                    color={
                      selectedAlertType === "tissue"
                        ? themeColors.primary
                        : themeColors.text + "66"
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color:
                        selectedAlertType === "tissue"
                          ? themeColors.primary
                          : themeColors.text + "99",
                      fontWeight: "700",
                      fontSize: 15,
                      letterSpacing: -0.5,
                      textShadowColor:
                        selectedAlertType === "tissue"
                          ? themeColors.primary + "33"
                          : "transparent",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Tissue Alerts
                  </Text>
                </View>
                <Switch
                  value={selectedAlertType === "battery"}
                  onValueChange={(val) => {
                    setSelectedAlertType(val ? "battery" : "tissue");
                    setShowAlertDevices(false);
                  }}
                  trackColor={{
                    false: themeColors.primary + "33",
                    true: themeColors.primary,
                  }}
                  thumbColor={
                    selectedAlertType === "battery"
                      ? themeColors.primary
                      : "#fff"
                  }
                  style={{
                    marginHorizontal: 10,
                    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
                  }}
                  ios_backgroundColor={themeColors.primary + "33"}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginLeft: 16,
                  }}
                >
                  <Ionicons
                    name="battery-charging"
                    size={20}
                    color={
                      selectedAlertType === "battery"
                        ? themeColors.primary
                        : themeColors.text + "66"
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color:
                        selectedAlertType === "battery"
                          ? themeColors.primary
                          : themeColors.text + "99",
                      fontWeight: "700",
                      fontSize: 15,
                      letterSpacing: -0.5,
                      textShadowColor:
                        selectedAlertType === "battery"
                          ? themeColors.primary + "33"
                          : "transparent",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Battery Alerts
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* --- SUMMARY CARDS (copied from AdminDash) --- */}
          <SummaryCards
            realtimeStatus={realtimeStatus}
            selectedAlertType={selectedAlertType}
            analytics={analytics}
          />

          {/* --- DONUT CHART (copied from AdminDash) --- */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 12,
              marginTop: 8,
              marginBottom: 2,
            }}
          >
            <Ionicons
              name={
                selectedAlertType === "tissue"
                  ? "document-text-outline"
                  : "battery-charging"
              }
              size={22}
              color={selectedAlertType === "tissue" ? "#38BDF8" : "#FACC15"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 17,
                color: themeColors.text,
                letterSpacing: 0.2,
                marginLeft: 6,
                textShadowColor: themeColors.text + "22",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              Pie Chart Alert Distribution for{" "}
              {selectedAlertType === "tissue" ? "Tissue" : "Battery"}
            </Text>
            <Ionicons
              name="pie-chart"
              size={20}
              color={themeColors.primary}
              style={{ marginLeft: 8, opacity: 0.8 }}
            />
          </View>
          <View style={{ marginHorizontal: 8, marginVertical: 12 }}>
            <DonutChart data={alertDistributionData} />
          </View>

          {/* Error Display */}
          {(error || realtimeError) && !refreshing && !realtimeLoading && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={24}
                color="#FF4444"
              />
              <Text style={styles.errorText}>
                {typeof error === "string" ? error : "Error loading data"}
                {typeof realtimeError === "string" ? realtimeError : ""}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchAllData}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading more indicator */}
          {(loading || realtimeLoading) && !isFirstLoad && !refreshing && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={themeColors.primary} />
              <Text style={styles.loadingMoreText}>Loading devices...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

// Solar Planet Style Modern Device Summary Component
const SolarPlanetDeviceSummary = ({ stats }) => {
  const { themeColors, isDark } = useThemeContext();
  const styles = getSolarPlanetStyles(themeColors, isDark);
  const navigation = useNavigation();
  // Animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim1 = useRef(new Animated.Value(0)).current;
  const orbitAnim2 = useRef(new Animated.Value(0)).current;
  const orbitAnim3 = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Initial entrance animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous orbit animations
    const createOrbitAnimation = (animValue, duration) => {
      return Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      );
    };

    // Floating animation for the central element
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start all animations
    createOrbitAnimation(orbitAnim1, 8000).start();
    createOrbitAnimation(orbitAnim2, 12000).start();
    createOrbitAnimation(orbitAnim3, 16000).start();
    floatAnimation.start();

    return () => {
      floatAnimation.stop();
    };
  }, [scaleAnim, fadeAnim, floatAnim, orbitAnim1, orbitAnim2, orbitAnim3]);

  const getRotation = (animValue) =>
    animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const activePercentage =
    stats.totalDevices > 0
      ? (stats.activeDevices / stats.totalDevices) * 100
      : 0;
  const healthStatus = getHealthStatus(stats);
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          marginTop: 32, // Add space from the header
        },
      ]}
    >
      {/* Solar System Container - use flex to center everything */}
      <View style={styles.solarSystemFixed}>
        {/* --- SATELLITES: Offline at top-right, Active at bottom-left --- */}
        {/* Offline Satellite at top-right */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10,
            paddingRight: 8,
            pointerEvents: "box-none",
          }}
          pointerEvents="box-none"
        >
          <FloatingSatellite
            icon="wifi-off"
            value={stats.offlineDevices}
            label="Offline"
            color="#757575"
            position="topRight"
            delay={500}
            onPress={() => navigation.navigate("OfflineDevicesScreen")}
          />
        </View>

        {/* Active Satellite at bottom-left (opposite to offline) */}
        <View
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            zIndex: 10,
            paddingLeft: 8,
            paddingBottom: 8,
            pointerEvents: "box-none",
          }}
          pointerEvents="box-none"
        >
          <FloatingSatellite
            icon="check-circle"
            value={stats.activeDevices}
            label="Active"
            color="#4CAF50"
            position="bottomLeft"
            delay={0}
            onPress={() =>
              navigation.navigate("AlertDevicesScreen", {
                alertType: "active",
              })
            }
          />
        </View>
        {/* Orbit Rings */}
        <Animated.View
          style={[
            styles.orbitRing3,
            { transform: [{ rotate: getRotation(orbitAnim3) }] },
          ]}
        >
          <View style={styles.orbitDot3} />
        </Animated.View>
        <Animated.View
          style={[
            styles.orbitRing2,
            { transform: [{ rotate: getRotation(orbitAnim2) }] },
          ]}
        >
          <View style={styles.orbitDot2} />
        </Animated.View>
        <Animated.View
          style={[
            styles.orbitRing1,
            { transform: [{ rotate: getRotation(orbitAnim1) }] },
          ]}
        >
          <View style={styles.orbitDot1} />
        </Animated.View>
        {/* Central Sun/Planet - perfectly centered */}
        <Animated.View
          style={[
            styles.centralPlanetFixed,
            { transform: [{ translateY: floatTranslate }] },
          ]}
        >
          <Pressable
            onPress={() =>
              navigation.navigate("AlertDevicesScreen", { alertType: "all" })
            }
            style={({ pressed }) => [
              { borderRadius: 50, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={[
                themeColors.primary + "FF",
                themeColors.primary + "DD",
                themeColors.primary + "BB",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planetGradient}
            >
              <View style={styles.centralContent}>
                <Text style={styles.totalNumber}>
                  {stats.totalDevices || 0}
                </Text>
                <Text style={styles.totalLabel}>Devices</Text>
                <View style={styles.statusIndicator}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: healthStatus.color },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {healthStatus.text || "Unknown"}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* Cosmic Status Bar */}
      <View style={styles.cosmicStatusBar}>
        <View style={styles.statusItem}>
          <MaterialCommunityIcons name="pulse" size={16} color="#4CAF50" />
          <Text style={styles.statusItemText}>Real-time</Text>
        </View>
        <View style={styles.statusSeparator} />
        <View style={styles.statusItem}>
          <MaterialCommunityIcons
            name="cloud-sync"
            size={16}
            color={themeColors.primary}
          />
          <Text style={styles.statusItemText}>Synced</Text>
        </View>
        <View style={styles.statusSeparator} />
        <View style={styles.statusItem}>
          <MaterialCommunityIcons
            name="shield-check"
            size={16}
            color="#66BB6A"
          />
          <Text style={styles.statusItemText}>Secure</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Floating Satellite Component
const FloatingSatellite = ({
  icon,
  value,
  label,
  color,
  position,
  delay,
  onPress,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const styles = getSatelliteStyles(themeColors, isDark, position);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      delay,
      useNativeDriver: true,
    }).start();

    // Floating animation
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000 + delay,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000 + delay,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow animation for values > 0
    if (value > 0) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();
    }

    floatAnimation.start();

    return () => {
      floatAnimation.stop();
    };
  }, [delay, value, scaleAnim, floatAnim, glowAnim]);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ zIndex: 5 }}>
      <Animated.View
        style={[
          styles.satellite,
          {
            transform: [{ scale: scaleAnim }, { translateY: floatTranslate }],
            shadowColor: value > 0 ? color : "transparent",
            shadowOpacity: value > 0 ? glowOpacity : 0,
          },
        ]}
      >
        <View style={[styles.satelliteInner, { borderColor: color + "30" }]}>
          <View
            style={[styles.iconContainer, { backgroundColor: color + "20" }]}
          >
            <MaterialCommunityIcons name={icon} size={18} color={color} />
          </View>
          <Text style={[styles.value, { color: themeColors.heading }]}>
            {value || 0}
          </Text>
          <Text style={styles.label}>{label || ""}</Text>
          {/* Cosmic Ring */}
          {value > 0 && (
            <Animated.View
              style={[
                styles.cosmicRing,
                {
                  borderColor: color + "40",
                  opacity: glowOpacity,
                },
              ]}
            />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

// Helper function for health status
const getHealthStatus = (stats) => {
  if (stats.totalTamper > 0) {
    return { color: "#8B5CF6", text: "Tamper Alert" };
  }
  if (stats.totalLowAlerts > 5) {
    return { color: "#FF9800", text: "Warning" };
  }
  if (stats.offlineDevices > stats.activeDevices) {
    return { color: "#757575", text: "Poor" };
  }
  return { color: "#4CAF50", text: "Excellent" };
};

// Main styles for DeviceList
const createStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 20,
      flexGrow: 1,
    },
    refreshingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      backgroundColor: isDark ? colors.background + "CC" : "#FFFFFFCC",
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 68, 68, 0.15)" : "#FEE2E2",
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FF4444" + "30",
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: "#FF4444",
      marginLeft: 12,
      marginRight: 12,
    },
    retryButton: {
      backgroundColor: "#FF4444",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },
    deviceList: {
      paddingBottom: 20,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    deviceCount: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.6,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.heading,
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
      textAlign: "center",
      marginBottom: 20,
    },
    refreshButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "15",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    refreshButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },
    loadingMore: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
      gap: 12,
    },
    loadingMoreText: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
    },
  });

// Card styles with enhanced alert analytics items
const getCardStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    touchable: {
      borderRadius: 20,
    },
    card: {
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: { width: 0, height: isDark ? 6 : 4 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: isDark ? 12 : 8,
      elevation: isDark ? 8 : 4,
      borderWidth: isDark ? 2 : 1,
      borderColor: isDark ? colors.border + "60" : "#E5E7EB",
      // Background will be set dynamically based on status
    },
    statusGradientBar: {
      height: isDark ? 5 : 4,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 20,
      paddingBottom: 16,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
      position: "relative",
      elevation: isDark ? 4 : 2,
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: { width: 0, height: isDark ? 3 : 1 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: isDark ? 6 : 3,
    },
    connectionDot: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: isDark ? colors.surface + "EE" : "#FFFFFF",
    },
    deviceInfo: {
      flex: 1,
      minHeight: 70,
      justifyContent: "space-between",
    },
    deviceName: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : colors.heading,
      marginBottom: 6,
      lineHeight: 22,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
      gap: 6,
    },
    deviceLocation: {
      fontSize: 15,
      color: isDark ? "#E8E8E8" : colors.text,
      opacity: isDark ? 0.9 : 0.8,
      lineHeight: 18,
      fontWeight: "500",
    },
    deviceId: {
      fontSize: 12,
      color: isDark ? "#D0D0D0" : colors.text,
      opacity: isDark ? 0.8 : 0.6,
      fontFamily: "monospace",
      marginTop: 2,
      fontWeight: "500",
    },
    statusContainer: {
      alignItems: "flex-end",
      justifyContent: "flex-start",
      minWidth: 120,
      paddingTop: 4,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
      marginBottom: 4,
      borderWidth: isDark ? 1.5 : 1,
      borderColor: "transparent",
      elevation: isDark ? 3 : 1,
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: { width: 0, height: isDark ? 2 : 0.5 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: isDark ? 4 : 2,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.1,
    },
    activityIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 0,
    },
    activityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    activityText: {
      fontSize: 13,
      fontWeight: "600",
      flex: 1,
      lineHeight: 16,
    },
    signalStrength: {
      marginLeft: 10,
    },
    lastActivityContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#2C2F33" : "#F8F9FA",
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 16,
      borderRadius: 16,
      borderWidth: isDark ? 1 : 1,
      borderColor: isDark ? "#3C4043" : colors.text + "08",
      elevation: isDark ? 1 : 0,
      shadowColor: isDark ? "#000" : "transparent",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.05 : 0,
      shadowRadius: 2,
    },
    activityIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? "#36393F" : "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? "#40444B" : "transparent",
    },
    activityInfo: {
      flex: 1,
    },
    lastActivityLabel: {
      fontSize: 11,
      color: isDark ? "#C8C8C8" : colors.text,
      marginBottom: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      opacity: isDark ? 0.8 : 0.7,
    },
    lastActivityTime: {
      fontSize: 15,
      color: isDark ? "#F0F0F0" : colors.heading,
      fontWeight: "600",
    },
    viewAnalyticsButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? colors.primary + "25" : colors.primary + "15",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 4,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.primary + "40" : "transparent",
    },
    viewAnalyticsText: {
      fontSize: 13,
      color: isDark ? "#FFFFFF" : colors.primary,
      fontWeight: "600",
    },
  });

// Solar Planet styles
const getSolarPlanetStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 0,
      marginBottom: 30,
      minHeight: 320,
      alignItems: "center",
      justifyContent: "center",
    },
    // New: Make a perfect square and use flex to center everything
    solarSystemFixed: {
      width: 260,
      height: 260,
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      alignSelf: "center",
      display: "flex",
    },
    // Orbit rings
    orbitRing1: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 1,
      borderColor: colors.primary + "30",
      borderStyle: "dashed",
      alignSelf: "center",
    },
    orbitRing2: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 1,
      borderColor: colors.primary + "20",
      borderStyle: "dashed",
      alignSelf: "center",
    },
    orbitRing3: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 1,
      borderColor: colors.primary + "10",
      borderStyle: "dashed",
      alignSelf: "center",
    },
    // Orbit dots
    orbitDot1: {
      position: "absolute",
      top: -4,
      left: "50%",
      marginLeft: -4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#4CAF50",
    },
    orbitDot2: {
      position: "absolute",
      top: -3,
      right: -3,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FF9800",
    },
    orbitDot3: {
      position: "absolute",
      bottom: -3,
      left: -3,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#E91E63",
    },
    // Central planet
    // New: Centered planet using flex, not absolute
    centralPlanetFixed: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      backgroundColor: "transparent",
    },
    planetGradient: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      elevation: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    centralContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    totalNumber: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#FFFFFF",
      marginBottom: 2,
    },
    totalLabel: {
      fontSize: 10,
      color: "#FFFFFF",
      opacity: 0.9,
      marginBottom: 4,
    },
    statusIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginRight: 2,
    },
    statusText: {
      fontSize: 8,
      color: "#FFFFFF",
      opacity: 0.9,
      fontWeight: "500",
    },
    // Progress constellation
    progressConstellation: {
      marginTop: 20,
      alignItems: "center",
    },
    progressLabel: {
      fontSize: 12,
      color: colors.text,
      marginBottom: 8,
      fontWeight: "500",
    },
    progressBar: {
      width: width - 80,
      height: 6,
      backgroundColor: isDark ? colors.text + "20" : "#E5E7EB",
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 6,
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
    },
    progressGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.primary + "30",
      borderRadius: 3,
      opacity: 0.3,
    },
    progressText: {
      fontSize: 11,
      color: colors.text,
      opacity: 0.7,
    },
    // Cosmic status bar
    cosmicStatusBar: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: isDark ? colors.surface : "#FFFFFF",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.text + "10",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    statusItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    statusItemText: {
      fontSize: 11,
      color: colors.text,
      fontWeight: "500",
    },
    statusSeparator: {
      width: 1,
      height: 12,
      backgroundColor: colors.text + "20",
      marginHorizontal: 12,
    },
  });

// Satellite styles
const getSatelliteStyles = (colors, isDark, position) => {
  // Place satellites: both at the top, spaced horizontally by parent container
  return StyleSheet.create({
    satellite: {
      position: "relative",
      zIndex: 5,
      elevation: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      borderRadius: 32,
      backgroundColor: "transparent",
      marginTop: 0,
      marginBottom: 0,
    },
    satelliteInner: {
      backgroundColor: isDark ? colors.surface + "F2" : "#FFFFFFF2",
      borderRadius: 32,
      padding: 10,
      alignItems: "center",
      minWidth: 64,
      minHeight: 64,
      borderWidth: 2,
      borderColor: colors.primary + "18",
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 4,
      backgroundColor: colors.primary + "18",
    },
    value: {
      fontSize: 17,
      fontWeight: "bold",
      marginBottom: 0,
      color: colors.heading,
    },
    label: {
      fontSize: 11,
      color: colors.text,
      opacity: 0.7,
      textAlign: "center",
    },
    cosmicRing: {
      position: "absolute",
      top: -8,
      left: -8,
      right: -8,
      bottom: -8,
      borderRadius: 40,
      borderWidth: 2,
    },
  });
};

export default Home;
