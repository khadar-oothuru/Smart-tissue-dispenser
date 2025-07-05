import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  Switch,
} from "react-native";
// import DevicesList from "../../components/AdminDash/DeviceList";
// import Header from "../../components/AdminDash/Header";
import DeviceCardRaw from "../../components/AdminDash/DeviceCard";
import LoadingScreen from "../../components/common/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";
import { useDeviceStore } from "../../store/useDeviceStore";

import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import LandingPageTopRaw from "../../components/AdminDash/LandingPageTop";
import SummaryCardsRaw from "../../components/AdminAnalytics/SummaryCards";
import { LinearGradient } from "expo-linear-gradient";
import { DonutChart } from "../../components/Analytics/ChartComponents";
import { useNavigation } from "@react-navigation/native";

// Memoize heavy child components for performance
const DeviceCard = React.memo(DeviceCardRaw);
const LandingPageTop = React.memo(LandingPageTopRaw);
const SummaryCards = React.memo(SummaryCardsRaw);

export default function AdminDash() {
  const navigation = useNavigation();
  const { accessToken, loading: authLoading } = useAuth();
  const { themeColors, isDark } = useThemeContext();

  // Store hook - ensure it's always called consistently with default values
  const storeData = useDeviceStore();
  const {
    devices = [],
    fetchDevices,
    analytics: storeAnalytics = [],
    summaryData: storeSummaryData,
    realtimeStatus: storeRealtimeStatus = [],
    statusSummary,
    fetchAllAnalyticsData,
    fetchDeviceRealtimeStatus,
    fetchDeviceStatusSummary,
    analyticsLoading = false,
    realtimeLoading = false,
    refreshAllData,
    // lastDataUpdate,
  } = storeData || {};
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [selectedAlertType, setSelectedAlertType] = useState("tissue"); // "battery" or "tissue"
  const [showAlertDevices, setShowAlertDevices] = useState(false);
  const [overviewAlertType, setOverviewAlertType] = useState("empty");
  const intervalRef = useRef(null);

  // Unified dashboard data state for instant UI
  const [analytics, setAnalytics] = useState([]);
  const [summaryData, setSummaryData] = useState();
  const [realtimeStatus, setRealtimeStatus] = useState([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // OverviewTab-style alert types
  const overviewAlertTypes = [
    { key: "empty", label: "Empty", icon: "alert", color: "#FF4757" },
    { key: "low", label: "Low", icon: "alert-circle", color: "#FF9F00" },
    { key: "full", label: "Full", icon: "check-circle", color: "#10B981" },
    {
      key: "tamper",
      label: "Tamper",
      icon: "shield-alert-outline",
      color: "#8B5CF6",
    },
  ];

  // Alert Distribution Data (Realtime Only) - Memoized for performance
  const alertDistributionData = useMemo(() => {
    if (selectedAlertType === "tissue") {
      // Tissue alerts distribution
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
        {
          name: "Empty",
          population: emptyCount,
          value: emptyCount,
          color: "#FF4757",
        },
        {
          name: "Low",
          population: lowCount,
          value: lowCount,
          color: "#FF9F00",
        },
        {
          name: "Full",
          population: fullCount,
          value: fullCount,
          color: "#10B981",
        },
        {
          name: "Tamper",
          population: tamperCount,
          value: tamperCount,
          color: "#8B5CF6",
        },
      ];
    } else if (selectedAlertType === "battery") {
      // Battery alerts distribution - All levels including separate Battery Off
      let criticalBatteryCount = 0,
        lowBatteryCount = 0,
        mediumBatteryCount = 0,
        goodBatteryCount = 0,
        batteryOffCount = 0,
        powerOffCount = 0;

      if (
        realtimeStatus &&
        Array.isArray(realtimeStatus) &&
        realtimeStatus.length > 0
      ) {
        realtimeStatus.forEach((device) => {
          // Debug logging for first few devices
          if (device === realtimeStatus[0]) {
            console.log("Sample Device Data:", {
              device_id: device.device_id,
              power_status: device.power_status,
              battery_percentage: device.battery_percentage,
              battery_critical: device.battery_critical,
              battery_low: device.battery_low,
            });
          }

          // Enhanced power off detection logic - consistent with stats calculation
          const isPowerOff = (powerStatus) => {
            if (powerStatus === null || powerStatus === undefined) return false;
            const status = String(powerStatus).trim().toLowerCase();
            return ["off", "none", "", "0", "false"].includes(status); // Exclude "no" for consistency
          };

          const isNoPower = (powerStatus) => {
            if (powerStatus === null || powerStatus === undefined) return false;
            const status = String(powerStatus).trim().toLowerCase();
            return status === "no"; // Specifically check for "no power" state
          };

          // Power status logic
          const powerStatus = device.power_status;
          const deviceIsPowerOff = isPowerOff(powerStatus);
          const deviceIsNoPower = isNoPower(powerStatus);

          // Battery logic (exclude both power off and no power devices)
          const batteryCritical = device.battery_critical === 1;
          const batteryLow = device.battery_low === 1;
          const batteryPercentage =
            typeof device.battery_percentage === "number"
              ? device.battery_percentage
              : null;

          // Battery status classification based on percentage
          let batteryStatus = null;

          // Check for 0% battery first, regardless of power status
          if (batteryPercentage === 0) {
            batteryStatus = "battery_off";
          } else if (
            !deviceIsPowerOff &&
            !deviceIsNoPower &&
            batteryPercentage !== null
          ) {
            if (batteryPercentage > 0 && batteryPercentage <= 10) {
              batteryStatus = "critical";
            } else if (batteryPercentage > 10 && batteryPercentage <= 20) {
              batteryStatus = "low";
            } else if (batteryPercentage > 20 && batteryPercentage <= 50) {
              batteryStatus = "medium";
            } else if (batteryPercentage > 50) {
              batteryStatus = "good";
            }
          }

          // Count based on status - prioritize Battery Off over Power Off
          if (batteryStatus === "battery_off") {
            batteryOffCount++; // 0% battery gets its own category, even if power issues exist
          } else if (deviceIsPowerOff || deviceIsNoPower) {
            powerOffCount++; // Power status issues (renamed to "No Power")
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

      // Debug logging to see what's happening
      console.log("Battery Distribution Debug:", {
        totalDevices: realtimeStatus.length,
        batteryOffCount,
        criticalBatteryCount,
        lowBatteryCount,
        mediumBatteryCount,
        goodBatteryCount,
        powerOffCount,
      });

      return [
        {
          name: "Battery Off",
          population: batteryOffCount,
          value: batteryOffCount,
          color: "#8B5CF6",
        },
        {
          name: "Critical Battery",
          population: criticalBatteryCount,
          value: criticalBatteryCount,
          color: "#FF3B30",
        },
        {
          name: "Low Battery",
          population: lowBatteryCount,
          value: lowBatteryCount,
          color: "#FF9F00",
        },
        {
          name: "Medium Battery",
          population: mediumBatteryCount,
          value: mediumBatteryCount,
          color: "#FFD600",
        },
        {
          name: "Good Battery",
          population: goodBatteryCount,
          value: goodBatteryCount,
          color: "#10B981",
        },
        {
          name: "No Power",
          population: powerOffCount,
          value: powerOffCount,
          color: "#6B46C1",
        },
      ];
    }

    return [];
  }, [realtimeStatus, selectedAlertType]);

  const getAlertValue = (device, alertType) => {
    if (!device) return 0;
    const status = device.current_status?.toLowerCase() || "";
    const level = parseFloat(device.current_level) || 0;
    switch (alertType) {
      case "low":
        return Math.max(
          device.low_alert_count || 0,
          status === "low" ? 1 : 0,
          level > 10 && level <= 25 ? 1 : 0
        );
      case "empty":
        return Math.max(
          device.empty_alert_count || 0,
          status === "empty" ? 1 : 0,
          level <= 10 ? 1 : 0
        );
      case "full":
        return Math.max(
          device.full_alert_count || 0,
          status === "full" ? 1 : 0,
          level >= 90 ? 1 : 0
        );
      case "tamper":
        return Math.max(
          device.tamper_count || device.tamper_alert_count || 0,
          status === "tamper" ? 1 : 0
        );
      default:
        return 0;
    }
  };

  const getTop5DevicesData = () => {
    if (!analytics || !Array.isArray(analytics) || analytics.length === 0) {
      return {
        labels: ["No Data Available"],
        datasets: [{ data: [0], colors: ["#E5E7EB"] }],
      };
    }
    const deviceData = analytics
      .map((device) => {
        const alertValue = getAlertValue(device, overviewAlertType);
        const deviceLabel =
          device.device_name ||
          device.name ||
          `Device ${device.device_id || device.id}`;
        return { ...device, alertValue, deviceLabel };
      })
      .filter((device) => device.alertValue > 0)
      .sort((a, b) => b.alertValue - a.alertValue)
      .slice(0, 5);
    if (deviceData.length === 0) {
      return {
        labels: [`No ${overviewAlertType} alerts found`],
        datasets: [{ data: [0], colors: ["#E5E7EB"] }],
      };
    }
    return {
      labels: deviceData.map((d) => d.deviceLabel),
      datasets: [
        {
          data: deviceData.map((d) => d.alertValue),
          colors: deviceData.map(() => {
            const colors = {
              empty: "#FF4757",
              low: "#FF9F00",
              full: "#10B981",
              tamper: "#8B5CF6",
            };
            return colors[overviewAlertType] || themeColors.primary;
          }),
        },
      ],
    };
  };
  // Fetch data and cache to AsyncStorage
  const fetchData = useCallback(async () => {
    if (!authLoading && accessToken && fetchDevices && fetchAllAnalyticsData) {
      try {
        // Fetch devices and all analytics data including real-time status
        await Promise.all([
          fetchDevices(accessToken),
          fetchAllAnalyticsData(accessToken),
        ]);

        // Save latest data to AsyncStorage for instant load next time
        try {
          // Use storeData directly to avoid dependency loop
          await AsyncStorage.setItem(
            "adminDash_analytics",
            JSON.stringify(storeData.analytics || [])
          );
          await AsyncStorage.setItem(
            "adminDash_summaryData",
            JSON.stringify(storeData.summaryData || {})
          );
          await AsyncStorage.setItem(
            "adminDash_realtimeStatus",
            JSON.stringify(storeData.realtimeStatus || [])
          );
        } catch (_e) {
          // Failed to cache dashboard data
        }

        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
      } catch (_error) {
        // Error fetching data
      }
    }
  }, [
    authLoading,
    accessToken,
    fetchDevices,
    fetchAllAnalyticsData,
    isFirstLoad,
  ]); // Optimized refresh for real-time updates only
  const refreshRealtimeData = useCallback(async () => {
    if (
      !authLoading &&
      accessToken &&
      fetchDeviceRealtimeStatus &&
      fetchDeviceStatusSummary
    ) {
      try {
        await Promise.all([
          fetchDeviceRealtimeStatus(accessToken),
          fetchDeviceStatusSummary(accessToken),
        ]);
      } catch (_error) {
        // Error refreshing real-time data
      }
    }
  }, [
    authLoading,
    accessToken,
    fetchDeviceRealtimeStatus,
    fetchDeviceStatusSummary,
  ]);
  // Load cached data on mount for instant UI
  useEffect(() => {
    (async () => {
      try {
        const cachedAnalyticsStr = await AsyncStorage.getItem(
          "adminDash_analytics"
        );
        const cachedSummaryDataStr = await AsyncStorage.getItem(
          "adminDash_summaryData"
        );
        const cachedRealtimeStatusStr = await AsyncStorage.getItem(
          "adminDash_realtimeStatus"
        );
        if (cachedAnalyticsStr) setAnalytics(JSON.parse(cachedAnalyticsStr));
        if (cachedSummaryDataStr)
          setSummaryData(JSON.parse(cachedSummaryDataStr));
        if (cachedRealtimeStatusStr)
          setRealtimeStatus(JSON.parse(cachedRealtimeStatusStr));
      } catch (_e) {
        // Failed to load cached dashboard data
      } finally {
        setCacheLoaded(true);
      }
    })();
  }, []);

  // Update dashboard data from store after fetch
  useEffect(() => {
    if (storeAnalytics && storeAnalytics.length > 0)
      setAnalytics(storeAnalytics);
    if (storeSummaryData) setSummaryData(storeSummaryData);
    if (storeRealtimeStatus && storeRealtimeStatus.length > 0)
      setRealtimeStatus(storeRealtimeStatus);
  }, [storeAnalytics, storeSummaryData, storeRealtimeStatus]);

  // Initial load
  useEffect(() => {
    if (!authLoading && accessToken && isFirstLoad) {
      fetchData();
    }
  }, [accessToken, authLoading, isFirstLoad, fetchData]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    // Only set up interval if we have valid conditions
    if (authLoading || !accessToken || isFirstLoad || !refreshRealtimeData) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval with error handling
    intervalRef.current = setInterval(() => {
      try {
        refreshRealtimeData();
      } catch (_error) {
        // Error in interval refresh
      }
    }, 30000); // 30 seconds

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [authLoading, accessToken, isFirstLoad, refreshRealtimeData]); // Optimized pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Use the optimized refresh function for faster performance
      if (refreshAllData && accessToken) {
        await refreshAllData(accessToken);
      }
    } catch (_error) {
      // Manual refresh failed
    } finally {
      // Reduce delay for faster user experience
      setTimeout(() => {
        setRefreshing(false);
      }, 300);
    }
  }, [accessToken, refreshAllData]);
  const styles = getStyles(themeColors);
  // Memoized device stats calculation for better performance (PowerOff/Offline logic)
  const stats = useMemo(() => {
    // Merge logic similar to PowerOffDevicesScreen/OfflineDevicesScreen
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

    const totalDevices = Math.max(
      statusSummary?.summary?.total_devices ?? 0,
      mergedDevices.length
    );

    // Power off/offline logic - Updated to distinguish between "power off" and "no power"
    const isPowerOff = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return false;
      const status = String(powerStatus).trim().toLowerCase();
      return ["off", "none", "", "0", "false"].includes(status); // Removed "no" - it's a separate "no power" state
    };

    const isNoPower = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return false;
      const status = String(powerStatus).trim().toLowerCase();
      return status === "no"; // Specifically check for "no power" state
    };

    // Offline: current_status offline/disconnected/inactive/unknown or power_status/pwrstatus off/none/0/false
    // NOTE: "No Power" devices are counted separately and excluded from offline count
    const offlineDevicesArr = mergedDevices.filter((d) => {
      const status = (d.current_status || "").toLowerCase();
      const pwr = (d.pwrstatus || d.power_status || "").toLowerCase();
      return (
        ["offline", "disconnected", "inactive", "unknown"].includes(status) ||
        isPowerOff(pwr) // Only include "power off" devices, not "no power"
      );
    });

    // Active: not in offline and not "no power"
    const activeDevicesArr = mergedDevices.filter((d) => {
      const status = (d.current_status || "").toLowerCase();
      const pwr = (d.pwrstatus || d.power_status || "").toLowerCase();
      return (
        !["offline", "disconnected", "inactive", "unknown"].includes(status) &&
        !isPowerOff(pwr) &&
        !isNoPower(pwr) // Exclude "no power" devices from active
      );
    });

    // Calculate "No Power" devices separately
    const noPowerDevicesArr = mergedDevices.filter((d) => {
      const pwr = (d.pwrstatus || d.power_status || "").toLowerCase();
      return isNoPower(pwr);
    });

    return {
      totalDevices,
      activeDevices: activeDevicesArr.length,
      offlineDevices: offlineDevicesArr.length,
      offlineDevicesList: offlineDevicesArr,
      noPowerDevices: noPowerDevicesArr.length, // Add "No Power" count separately
      noPowerDevicesList: noPowerDevicesArr,
      criticalDevices:
        statusSummary?.summary?.tamper_devices ||
        mergedDevices.filter(
          (d) => d.current_status?.toLowerCase() === "tamper"
        ).length ||
        0,
      recentActivity24h: summaryData?.summary?.recent_entries_24h || 0,
      totalEntries:
        summaryData?.summary?.total_entries ||
        analytics?.reduce((sum, d) => sum + (d.total_entries || 0), 0) ||
        0,
      // Alert counts for toggles
      totalBatteryAlerts:
        analytics?.reduce((sum, d) => sum + (d.battery_alert_count || 0), 0) ||
        0,
      totalTissueAlerts:
        analytics?.reduce((sum, d) => sum + (d.tissue_alert_count || 0), 0) ||
        0,
    };
  }, [devices, analytics, realtimeStatus, statusSummary, summaryData]);

  // Calculate active devices from summary data for DevicesList component
  // const activeDeviceIds = useMemo(() => {
  //   return summaryData?.most_active_devices?.map((d) => d.device__id) || [];
  // }, [summaryData]);

  // Show loading screen until cache is loaded (prevents zeros flash)
  if (!cacheLoaded) {
    return (
      <LoadingScreen
        message="Loading Admin Dashboard"
        submessage="Fetching your latest updates..."
        iconName="notifications"
        variant="fullscreen"
        customIcon={
          <Ionicons name="grid-outline" size={50} color={themeColors.primary} />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]} // Android
              progressBackgroundColor={isDark ? themeColors.surface : "#FFFFFF"} // Android
            />
          }
        >
          {/* --- Device Overview Summary Card (your original card, always at the top) --- */}
          <LandingPageTop
            stats={stats}
            summaryData={summaryData}
            realtimeStatus={realtimeStatus}
            onRefresh={onRefresh}
            isLoading={authLoading || analyticsLoading || realtimeLoading}
            onPressTotalDevices={() => navigation.navigate("AllDevicesScreen")}
          />

          {/* --- ALERTS TOGGLE SECTION (single, clean version) --- */}
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

          {/* Show filtered DeviceCards for selected alert type */}
          {/* Always show tissue alerts first, toggle switches to battery */}
          {showAlertDevices && (
            <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
              {analytics
                .filter((d) =>
                  selectedAlertType === "battery"
                    ? (d.battery_alert_count || 0) > 0
                    : (d.tissue_alert_count || 0) > 0
                )
                .map((device, idx) => (
                  <DeviceCard
                    key={device.device_id || device.id || idx}
                    device={device}
                    index={idx}
                  />
                ))}
              {/* If no devices, show a message */}
              {analytics.filter((d) =>
                selectedAlertType === "battery"
                  ? (d.battery_alert_count || 0) > 0
                  : (d.tissue_alert_count || 0) > 0
              ).length === 0 && (
                <Text
                  style={{
                    color: themeColors.text + "99",
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  No devices with
                  {selectedAlertType === "battery" ? "battery" : "tissue"}
                  alerts.
                </Text>
              )}
            </View>
          )}

          {/* --- OverviewTab-style summary cards and Donut Chart below toggles --- */}
          <SummaryCards
            realtimeStatus={realtimeStatus}
            selectedAlertType={selectedAlertType}
            analytics={analytics}
          />
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
              Pie Chart Alert Distribution for
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
            {cacheLoaded && realtimeStatus && Array.isArray(realtimeStatus) ? (
              <DonutChart
                data={alertDistributionData}
                // title removed as requested
                // centerValue={analytics?.length || 0}
                // centerLabel="Total Devices"
              />
            ) : !cacheLoaded ? (
              // Show previous values (from cache) while loading new data
              <DonutChart
                data={alertDistributionData}
                // title removed as requested
                // centerValue={analytics?.length || 0}
                // centerLabel="Total Devices"
              />
            ) : (
              <ActivityIndicator size="small" color={themeColors.primary} />
            )}
          </View>

          {/*
          <DevicesList
            analytics={analytics}
            realtimeStatus={realtimeStatus}
            themeColors={themeColors}
            summaryData={summaryData}
            activeDeviceIds={activeDeviceIds}
            devices={devices}
          />
          */}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 20,
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
    },
  });
