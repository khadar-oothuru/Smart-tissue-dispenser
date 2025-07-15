import React, { useState, useEffect, useCallback, useMemo } from "react";
import useTheme from "../../hooks/useThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useDeviceStore from "../../store/useDeviceStore";
import { toast } from "react-toastify";
import { getDeviceStatusConfig } from "../../utils/deviceUtils";
import { formatTimeAgo } from "../../utils/timeUtils";
import {
  Users,
  Smartphone,
  AlertTriangle,
  Battery,
  Activity,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  BarChart3,
  FileText,
  Settings,
  Wifi,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Droplets,
  Power,
  ShieldAlert,
  WifiOff,
  Database,
  Globe,
  AlertOctagon,
  Eye,
  EyeOff,
} from "lucide-react";

import LandingPageTop, {
  getBatteryAndPowerAlertCounts,
  getTissueAlertCounts,
} from "../AdminDashboard/LandingPageTop";

import DeviceStatusDistribution from "../DeviceStatusDistribution";

const AdminDashboard = () => {
  // Use theme context
  const { themeColors } = useTheme();
  const { accessToken } = useAuth();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [selectedAlertType, setSelectedAlertType] = useState("tissue"); // "battery", "tissue", or "power"
  const location = useLocation();
  // Sync selectedAlertType with route for battery alerts
  useEffect(() => {
    if (location.pathname.startsWith("/admin/battery-alerts")) {
      if (selectedAlertType !== "battery") setSelectedAlertType("battery");
    }
    // Do not force 'tissue' on dashboard, preserve last user selection
  }, [location.pathname, selectedAlertType]);
  const [showAlertDevices, setShowAlertDevices] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handler for device card click (now navigates to AlertDevicesScreen)
  const navigate = useNavigate();
  const handleDeviceCardClick = (deviceType) => {
    // deviceType can be: all, active, offline, etc.
    // For battery alert types, navigate to BatteryAlertsScreen
    if (deviceType === "low-battery") {
      navigate("/admin/battery-alerts/low-battery");
      return;
    }
    if (deviceType === "total-battery-alerts" || deviceType === "all-battery") {
      navigate("/admin/battery-alerts/all-battery");
      return;
    }
    const batteryTypes = ["critical-battery", "battery-off", "good-battery"];
    if (batteryTypes.includes(deviceType)) {
      navigate(`/admin/battery-alerts/${deviceType}`);
      return;
    }
    if (deviceType === "poweroff" || deviceType === "power-off") {
      navigate("/admin/power-off-devices");
      return;
    }
    let alertType = "all";
    if (deviceType === "active") {
      alertType = "active";
    } else if (deviceType === "offline") {
      // Only show true offline devices (not battery off, not power off)
      alertType = "offline";
    } else if (deviceType === "empty") {
      alertType = "empty";
    } else if (deviceType === "low") {
      alertType = "low";
    } else if (deviceType === "tamper") {
      alertType = "tamper";
    } else if (deviceType === "full") {
      alertType = "full";
    } else if (deviceType === "alerts") {
      alertType = "alerts";
    }
    // default is "all"
    navigate(`/admin/alert-devices/${alertType}`);
  };

  // Use the device store
  const deviceStore = useDeviceStore();
  const {
    devices = [],
    analytics = [],
    realtimeStatus = [],
    summaryData,
    loading,
    fetchDevices,
    fetchAllAnalyticsData,
    refreshAllData,
    loadCachedData,
  } = deviceStore;

  // --- Local Storage & Caching Logic ---
  // Helper to cache and restore dashboard data
  function useDashboardCache(key, data, setData) {
    useEffect(() => {
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          setData(JSON.parse(cached));
        } catch (e) {
          // ignore
        }
      }
    }, []);
    useEffect(() => {
      if (data) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    }, [data, key]);
  }

  // Use local state to allow cache restoration
  const [dashboardDataCache, setDashboardDataCache] = useState(null);
  const [realtimeStatusCache, setRealtimeStatusCache] = useState(null);

  // Fallbacks for cache, but do NOT reference dashboardData before it's defined
  let dashboardDataToShow = dashboardDataCache;
  let realtimeStatusToShow = realtimeStatusCache;

  // Load cached data on mount for instant UI (keep for legacy support)
  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  // Load cached data on mount for instant UI (keep for legacy support)
  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  // Merge analytics, real-time status, and device info similar to mobile app
  const mergedDevices = useMemo(() => {
    const devicesArray = Array.isArray(devices) ? devices : [];
    const analyticsArray = Array.isArray(analytics) ? analytics : [];
    const realtimeArray = Array.isArray(realtimeStatus) ? realtimeStatus : [];

    // Create lookup maps
    const analyticsMap = new Map(
      analyticsArray.map((a) => [a.device_id || a.id, a])
    );
    const realtimeMap = new Map(
      realtimeArray.map((r) => [r.device_id || r.id, r])
    );

    // Merge device data
    return devicesArray.map((device) => {
      const deviceId = device.id || device.device_id;
      const analyticsData = analyticsMap.get(deviceId) || {};
      const realtimeData = realtimeMap.get(deviceId) || {};

      return {
        ...device,
        ...analyticsData,
        ...realtimeData,
        device_id: deviceId,
        device_name: device.name || device.device_name || `Device ${deviceId}`,
      };
    });
  }, [devices, analytics, realtimeStatus]);

  // Calculate dashboard statistics using unified logic from mobile app (admindash)
  const dashboardStats = useMemo(() => {
    const totalDevices = Array.isArray(mergedDevices)
      ? mergedDevices.length
      : 0;
    let powerOffDevices = 0;
    let lowBatteryDevices = 0;
    let emptyDevices = 0;
    let lowDevices = 0;
    let tamperDevices = 0;
    let criticalDevices = 0;
    let totalTissueAlerts = 0;
    let powerTotalAlertsCount = 0;

    // --- Mobile app logic for active/offline/no-power ---
    // Helper functions
    // Unified isPowerOff: can take a device object or a raw value
    const isPowerOff = (input) => {
      // If input is an object, check all relevant fields
      if (typeof input === "object" && input !== null) {
        const powerFields = [
          input.power_status,
          input.pwrstatus,
          input.status,
          input.current_status,
        ];
        return powerFields.some((val) => {
          if (!val || typeof val !== "string") return false;
          const s = val.toLowerCase().trim();
          return [
            "power off",
            "power_off",
            "off",
            "none",
            "0",
            "false",
            "no",
          ].includes(s);
        });
      }
      // Otherwise treat as a raw value
      if (input === null || input === undefined) return false;
      const status = String(input).trim().toLowerCase();
      return [
        "off",
        "none",
        "",
        "0",
        "false",
        "power off",
        "power_off",
        "no",
      ].includes(status);
    };
    const isNoPower = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return false;
      const status = String(powerStatus).trim().toLowerCase();
      return status === "no";
    };

    // Consider devices with status 'inactive', 'offline', 'disconnected', or 'unknown' as offline (case-insensitive)
    const offlineDevicesArr = mergedDevices.filter((d) => {
      const statusRaw = d.current_status || d.status;
      if (!statusRaw || typeof statusRaw !== "string") return false;
      const status = statusRaw.toLowerCase().trim();
      return ["inactive", "offline", "disconnected", "unknown"].includes(
        status
      );
    });
    const activeDevicesArr = mergedDevices.filter((d) => {
      const status = (d.current_status || d.status || "").toLowerCase();
      return (
        !["offline", "disconnected", "inactive", "unknown"].includes(status) &&
        !isPowerOff(d) &&
        !isNoPower(d.pwrstatus || d.power_status)
      );
    });
    const noPowerDevicesArr = mergedDevices.filter((d) => {
      const pwr = (d.pwrstatus || d.power_status || "").toLowerCase();
      return isNoPower(pwr);
    });

    // Other stats
    mergedDevices.forEach((device) => {
      // Power Off
      if (
        device.power_status === false ||
        device.power_status === 0 ||
        device.status === "Power Off"
      )
        powerOffDevices += 1;

      // Battery
      if (device.battery_level !== undefined) {
        if (device.battery_level <= 10) criticalDevices += 1;
        else if (device.battery_level <= 20) lowBatteryDevices += 1;
      }

      // Tissue
      if (device.tissue_level !== undefined) {
        if (device.tissue_level === 0) emptyDevices += 1;
        else if (device.tissue_level <= 20) lowDevices += 1;
      }

      // Tamper
      if (device.tamper_alert || device.status === "Tamper Alert")
        tamperDevices += 1;

      // Alerts
      if (device.status === "Empty") totalTissueAlerts += 1;
      if (device.status === "Low") totalTissueAlerts += 1;
      if (device.status === "Tamper Alert") totalTissueAlerts += 1;
      if (device.status === "Critical Battery") powerTotalAlertsCount += 1;
      if (device.status === "Low Battery") powerTotalAlertsCount += 1;
      if (device.status === "Power Off") powerTotalAlertsCount += 1;
    });

    // System health logic (unified)
    let systemHealth = "Unknown";
    if (totalDevices > 0) {
      const activePercentage = (activeDevicesArr.length / totalDevices) * 100;
      const criticalPercentage = (criticalDevices / totalDevices) * 100;
      if (activePercentage >= 90 && criticalPercentage < 5)
        systemHealth = "Excellent";
      else if (activePercentage >= 80 && criticalPercentage < 10)
        systemHealth = "Good";
      else if (activePercentage >= 70 && criticalPercentage < 20)
        systemHealth = "Fair";
      else if (activePercentage >= 50 && criticalPercentage < 30)
        systemHealth = "Poor";
      else systemHealth = "Critical";
    }

    return {
      totalDevices,
      activeDevices: activeDevicesArr.length,
      offlineDevices: offlineDevicesArr.length,
      noPowerDevices: noPowerDevicesArr.length,
      powerOffDevices,
      lowBatteryDevices,
      emptyDevices,
      lowDevices,
      tamperDevices,
      criticalDevices,
      totalTissueAlerts,
      powerTotalAlertsCount,
      systemHealth,
      recentActivity24h: summaryData?.total_entries_today || 0,
      totalEntries: summaryData?.total_entries || 0,
      uptime: "99.9%", // This would come from backend
      todayUsage: summaryData?.usage_percentage_today || 0,
    };
  }, [mergedDevices, summaryData]);

  // Helper function to get alert message
  const getAlertMessage = (device) => {
    const statusConfig = getDeviceStatusConfig(device);
    const status = statusConfig.status;

    if (status === "Empty") return "Tissue roll empty";
    if (status === "Low") return "Tissue level low";
    if (status === "Tamper Alert") return "Tamper alert detected";
    if (status === "Critical Battery") return "Critical battery level";
    if (status === "Low Battery") return "Low battery level";
    if (status === "Power Off") return "Device offline";

    return "Device status update";
  };

  // Helper function to get alert type
  const getAlertType = (device) => {
    const statusConfig = getDeviceStatusConfig(device);
    const priority = statusConfig.priority;

    if (priority <= 2) return "error";
    if (priority <= 5) return "warning";
    return "info";
  };

  // Enhanced dashboard data with real backend integration
  const dashboardData = useMemo(
    () => ({
      ...dashboardStats,
      analytics: mergedDevices,
      recentAlerts: mergedDevices
        .filter((device) => {
          const statusConfig = getDeviceStatusConfig(device);
          return statusConfig.priority <= 5; // Only show devices with priority issues
        })
        .slice(0, 10) // Limit to 10 recent alerts
        .map((device) => ({
          id: device.id,
          device_name: device.device_name,
          message: getAlertMessage(device),
          timestamp: formatTimeAgo(
            device.last_alert_time || device.last_updated
          ),
          type: getAlertType(device),
        })),
    }),
    [dashboardStats, mergedDevices]
  );

  // Fetch data function with improved error handling
  const fetchData = useCallback(async () => {
    if (!accessToken) return;

    try {
      setRefreshing(true);
      console.log("AdminDashboard: Initial data fetch started...");
      const startTime = Date.now();

      // Use Promise.allSettled instead of Promise.all to handle partial failures
      const results = await Promise.allSettled([
        fetchDevices(accessToken),
        fetchAllAnalyticsData(accessToken),
      ]);

      // Check for any failures
      const failures = results.filter((result) => result.status === "rejected");

      if (failures.length > 0) {
        // Some requests failed
        console.warn(
          `AdminDashboard: ${failures.length} of ${results.length} initial data fetches failed`
        );

        // Log the specific errors
        failures.forEach((failure, index) => {
          const dataType = index === 0 ? "devices" : "analytics";
          console.error(
            `AdminDashboard: Failed to fetch ${dataType}:`,
            failure.reason
          );
        });

        // Show a warning toast if there were partial failures
        if (failures.length < results.length) {
          toast.warning(
            "Some dashboard data could not be loaded. The dashboard may show incomplete information."
          );
        } else {
          // All requests failed
          toast.error(
            "Failed to load dashboard data. Please try refreshing the page."
          );
        }
      } else {
        // All requests succeeded
        const duration = Date.now() - startTime;
        console.log(
          `AdminDashboard: All data fetched successfully in ${duration}ms`
        );
      }
    } catch (error) {
      console.error("AdminDashboard: Error fetching data:", error);
      toast.error(
        "Failed to load dashboard data. Please try refreshing the page."
      );

      // Log detailed error information
      console.error("Initial data fetch error details:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setRefreshing(false);
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  }, [accessToken, fetchDevices, fetchAllAnalyticsData, isFirstLoad]);

  // Initial data fetch
  useEffect(() => {
    if (accessToken && isFirstLoad) {
      fetchData();
    }
  }, [accessToken, isFirstLoad, fetchData]);

  // (Moved auto-refresh useEffect below handleRefresh definition)

  // Define handleRefresh with improved error handling
  const handleRefresh = useCallback(async () => {
    if (!accessToken) return;

    try {
      setRefreshing(true);
      console.log("AdminDashboard: Starting manual refresh...");
      const startTime = Date.now();

      await refreshAllData(accessToken);

      const duration = Date.now() - startTime;
      console.log(`AdminDashboard: Manual refresh completed in ${duration}ms`);

      // Show toast notification for successful refresh
      toast.success("Dashboard data refreshed successfully");
    } catch (error) {
      console.error("AdminDashboard: Refresh error:", error);

      // Show user-friendly error message
      const errorMessage = error.message?.includes("timeout")
        ? "Dashboard refresh timed out. The server might be busy, please try again later."
        : "Failed to refresh dashboard data. Please try again.";

      toast.error(errorMessage);

      // Log detailed error information
      console.error("Refresh error details:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, refreshAllData]);

  // Unified auto-refresh: refresh all dashboard and alert data every 30 seconds
  useEffect(() => {
    if (!accessToken || isFirstLoad) return;
    // Call refresh immediately on mount
    handleRefresh();
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [accessToken, isFirstLoad, handleRefresh]);

  // Alert Distribution Data (same as React Native version)
  const alertDistributionData = useMemo(() => {
    if (selectedAlertType === "tissue") {
      const { emptyCount, lowCount, tamperCount } =
        getTissueAlertCounts(realtimeStatus);

      // Calculate full count (devices that are not empty or low)
      const fullCount = Math.max(
        0,
        dashboardData.totalDevices - emptyCount - lowCount
      );

      return [
        { name: "Empty", value: emptyCount, color: "#FF4757" },
        { name: "Low", value: lowCount, color: "#FF9F00" },
        { name: "Full", value: fullCount, color: "#10B981" },
        { name: "Tamper", value: tamperCount, color: "#8B5CF6" },
      ];
    } else if (selectedAlertType === "battery") {
      const { criticalBatteryCount, lowBatteryCount, batteryOffCount } =
        getBatteryAndPowerAlertCounts(realtimeStatus);

      // Calculate good battery count
      const goodBatteryCount = Math.max(
        0,
        dashboardData.totalDevices -
          criticalBatteryCount -
          lowBatteryCount -
          batteryOffCount
      );

      return [
        {
          name: "Critical Battery",
          value: criticalBatteryCount,
          color: "#FF3B30",
        },
        { name: "Low Battery", value: lowBatteryCount, color: "#FF9F00" },
        { name: "Good Battery", value: goodBatteryCount, color: "#10B981" },
        { name: "Battery Off", value: batteryOffCount, color: "#757575" },
      ];
    } else if (selectedAlertType === "power") {
      const {
        noPowerCount,
        powerOffCount,
        criticalBatteryCount,
        lowBatteryCount,
      } = getBatteryAndPowerAlertCounts(realtimeStatus);

      // Calculate good power count
      const goodPowerCount = Math.max(
        0,
        dashboardData.totalDevices -
          noPowerCount -
          powerOffCount -
          criticalBatteryCount -
          lowBatteryCount
      );

      return [
        { name: "No Power", value: noPowerCount, color: "#FF3B30" },
        { name: "Power Off", value: powerOffCount, color: "#FF9F00" },
        {
          name: "Critical Battery",
          value: criticalBatteryCount,
          color: "#FF6B00",
        },
        { name: "Good Power", value: goodPowerCount, color: "#10B981" },
      ];
    }
  }, [realtimeStatus, selectedAlertType, dashboardData.totalDevices]);

  // (Removed duplicate auto-refresh useEffect)

  // No early return! Render modal conditionally below main return.
  // Theme-aware StatCard
  const StatCard = ({
    title,
    value,
    icon,
    color,
    trend,
    description,
    link,
  }) => {
    const IconComponent = icon;
    return (
      <div
        className="group relative overflow-hidden rounded-3xl p-4 shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          boxShadow: `0 4px 12px ${themeColors.shadow}20`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="p-3 rounded-xl shadow-lg"
              style={{
                background: color || themeColors.primary,
                color: "#fff",
                boxShadow: `0 2px 8px ${themeColors.shadow}22`,
              }}
            >
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: themeColors.muted }}
              >
                {title}
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: themeColors.heading }}
              >
                {value}
              </p>
              {description && (
                <p
                  className="text-xs mt-1"
                  style={{ color: themeColors.text, opacity: 0.7 }}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          {trend && (
            <div
              className="flex items-center space-x-1"
              style={{ color: themeColors.success }}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">{trend}</span>
            </div>
          )}
        </div>
        {link && (
          <Link
            to={link}
            className="absolute inset-0 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        )}
      </div>
    );
  };

  // Theme-aware QuickActionCard
  const QuickActionCard = ({ title, description, icon, color, link }) => {
    const IconComponent = icon;
    return (
      <Link
        to={link}
        className="group relative overflow-hidden rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          boxShadow: `0 4px 12px ${themeColors.shadow}20`,
        }}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div
              className="p-3 rounded-xl shadow-lg"
              style={{
                background: color || themeColors.primary,
                color: "#fff",
                boxShadow: `0 2px 8px ${themeColors.shadow}22`,
              }}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: themeColors.heading }}
              >
                {title}
              </h3>
              <p
                className="text-sm"
                style={{ color: themeColors.text, opacity: 0.7 }}
              >
                {description}
              </p>
            </div>
          </div>
          <ChevronRight
            className="h-5 w-5 group-hover:text-purple-500 transition-colors"
            style={{ color: themeColors.muted }}
          />
        </div>
      </Link>
    );
  };

  // Theme-aware AlertCard (updated for modern card style)
  const AlertCard = ({ alert }) => {
    const getAlertIcon = (type) => {
      switch (type) {
        case "error":
          return (
            <XCircle
              className="h-5 w-5"
              style={{ color: themeColors.danger }}
            />
          );
        case "warning":
          return (
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: themeColors.warning }}
            />
          );
        case "success":
          return (
            <CheckCircle
              className="h-5 w-5"
              style={{ color: themeColors.success }}
            />
          );
        default:
          return (
            <AlertCircle
              className="h-5 w-5"
              style={{ color: themeColors.primary }}
            />
          );
      }
    };

    const getAlertColor = (type) => {
      switch (type) {
        case "error":
          return themeColors.danger + "22";
        case "warning":
          return themeColors.warning + "22";
        case "success":
          return themeColors.success + "22";
        default:
          return themeColors.primary + "22";
      }
    };

    return (
      <div
        className="p-4 rounded-2xl border transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 mb-3"
        style={{
          background: themeColors.surface,
          borderColor: getAlertColor(alert.type),
          boxShadow: `0 4px 12px ${themeColors.shadow}10`,
        }}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
          <div className="flex-1">
            <p
              className="text-base font-semibold"
              style={{ color: themeColors.heading }}
            >
              {alert.device_name}
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: themeColors.text, opacity: 0.85 }}
            >
              {alert.message}
            </p>
            <p
              className="text-xs mt-2 flex items-center"
              style={{ color: themeColors.muted }}
            >
              <Clock className="h-3 w-3 mr-1" />
              {alert.timestamp}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Calculate alert counts for summary cards and modals (always use latest realtimeStatus)
  const alertCounts = useMemo(() => {
    const status = Array.isArray(realtimeStatus) ? realtimeStatus : [];
    const tissueAlerts = getTissueAlertCounts(status);
    const batteryAlerts = getBatteryAndPowerAlertCounts(status);
    const goodBatteryCount = status.filter((device) => {
      const batteryPercentage =
        typeof device.battery_percentage === "number"
          ? device.battery_percentage
          : null;
      return (
        !device.battery_off &&
        batteryPercentage !== null &&
        batteryPercentage > 20
      );
    }).length;
    return {
      ...tissueAlerts,
      ...batteryAlerts,
      goodBatteryCount,
    };
  }, [realtimeStatus]);

  const DeviceCard = ({ device }) => {
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "empty":
          return themeColors.danger;
        case "low":
          return themeColors.warning;
        case "full":
          return themeColors.success;
        case "tamper":
          return themeColors.primary;
        default:
          return themeColors.muted;
      }
    };

    const getBatteryColor = (percentage) => {
      if (percentage <= 15) return themeColors.danger;
      if (percentage <= 30) return themeColors.warning;
      return themeColors.success;
    };

    return (
      <div
        className="rounded-2xl p-4 shadow-lg border transition-all duration-300 hover:shadow-xl"
        style={{
          background: themeColors.surface,
          borderColor: themeColors.primary,
          borderWidth: 2,
          boxShadow: `0 4px 12px ${themeColors.shadow}20`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold" style={{ color: themeColors.heading }}>
            {device.device_name}
          </h4>
          <div
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              background: getStatusColor(device.current_status) + "22",
              color: getStatusColor(device.current_status),
            }}
          >
            {device.current_status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: themeColors.muted }}>Room:</span>
            <span className="ml-2" style={{ color: themeColors.text }}>
              {device.room}
            </span>
          </div>
          <div>
            <span style={{ color: themeColors.muted }}>Floor:</span>
            <span className="ml-2" style={{ color: themeColors.text }}>
              {device.floor}
            </span>
          </div>
          <div>
            <span style={{ color: themeColors.muted }}>Level:</span>
            <span className="ml-2" style={{ color: themeColors.text }}>
              {device.current_level}%
            </span>
          </div>
          <div>
            <span style={{ color: themeColors.muted }}>Battery:</span>
            <span
              className="ml-2 font-medium"
              style={{ color: getBatteryColor(device.battery_percentage) }}
            >
              {device.battery_percentage}%
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: device.is_active
                  ? themeColors.success
                  : themeColors.danger,
              }}
            />
            <span className="text-xs" style={{ color: themeColors.muted }}>
              {device.is_active ? "Online" : "Offline"}
            </span>
          </div>
          <span className="text-xs" style={{ color: themeColors.muted }}>
            {device.minutes_since_update}m ago
          </span>
        </div>
      </div>
    );
  };

  // Theme-aware Alert Toggle Component (updated for modern card style)
  const AlertToggle = () => {
    return (
      <div
        className="rounded-3xl p-6 shadow-lg border mb-6 transition-all duration-300 hover:shadow-xl "
        style={{
          background: themeColors.surface,
          borderColor: themeColors.border,
          boxShadow: `0 4px 12px ${themeColors.shadow}20`,
        }}
      >
        <div className="flex items-center justify-center space-x-8">
          <div className="flex items-center space-x-3">
            <Droplets
              className="h-5 w-5"
              style={{
                color:
                  selectedAlertType === "tissue"
                    ? themeColors.primary
                    : themeColors.muted,
              }}
            />
            <span
              className="font-medium"
              style={{
                color:
                  selectedAlertType === "tissue"
                    ? themeColors.primary
                    : themeColors.muted,
              }}
            >
              Tissue Alerts
            </span>
          </div>

          <button
            type="button"
            aria-label="Toggle alert type"
            className="relative w-16 h-8 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 mx-2 border"
            style={{
              background: themeColors.surface,
              border: `1px solid ${themeColors.border}`,
              boxShadow: `0 2px 8px ${themeColors.shadow}22`,
            }}
            onClick={() =>
              setSelectedAlertType(
                selectedAlertType === "tissue" ? "battery" : "tissue"
              )
            }
          >
            <span
              className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
              style={{
                transform:
                  selectedAlertType === "tissue"
                    ? "translateX(0)"
                    : "translateX(32px)",
                background:
                  selectedAlertType === "tissue"
                    ? themeColors.primary
                    : themeColors.warning,
                color: themeColors.surface,
              }}
            >
              {selectedAlertType === "tissue" ? (
                <Droplets size={18} className="text-white" />
              ) : (
                <Battery size={18} className="text-white" />
              )}
            </span>
          </button>

          <div className="flex items-center space-x-3">
            <Battery
              className="h-5 w-5"
              style={{
                color:
                  selectedAlertType === "battery"
                    ? themeColors.warning
                    : themeColors.muted,
              }}
            />
            <span
              className="font-medium"
              style={{
                color:
                  selectedAlertType === "battery"
                    ? themeColors.warning
                    : themeColors.muted,
              }}
            >
              Battery Alerts
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowAlertDevices(!showAlertDevices)}
            className="inline-flex items-center px-4 py-2 rounded-lg transition-colors font-semibold shadow-lg"
            style={{
              background: themeColors.primary,
              color: themeColors.surface,
              fontWeight: 600,
              boxShadow: `0 2px 8px ${themeColors.shadow}22`,
            }}
          >
            {showAlertDevices ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showAlertDevices ? "Hide" : "Show"}{" "}
            {selectedAlertType === "tissue" ? "Tissue" : "Battery"} Alert
            Devices
          </button>
        </div>
      </div>
    );
  };

  const SummaryCards = () => {
    // Add onClick for navigation to AlertDevicesScreen for each card
    let summaryData;
    if (selectedAlertType === "battery") {
      // --- Battery Alert Counts (exclusive, matching device screen) ---

      // Battery Off: 0% and <= 20
      const batteryOffCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter((device) => {
            const bp = device.battery_percentage;
            return bp === 0 && bp <= 20;
          }).length
        : 0;

      // Critical Battery: 1% - 10% (not off, not >20)
      const criticalBatteryCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter((device) => {
            const bp = device.battery_percentage;
            return (
              typeof bp === "number" &&
              bp >= 1 &&
              bp <= 10 &&
              bp !== 0 &&
              bp <= 20
            );
          }).length
        : 0;

      // Low Battery: 11% - 20% (not off, not critical, not >20)
      const lowBatteryCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter((device) => {
            const bp = device.battery_percentage;
            return (
              typeof bp === "number" &&
              bp > 10 &&
              bp <= 20 &&
              bp !== 0 &&
              !(bp >= 1 && bp <= 10) &&
              bp <= 20
            );
          }).length
        : 0;

      // Total Battery Alerts: only critical, low, and battery off
      const totalBatteryAlerts =
        criticalBatteryCount + lowBatteryCount + batteryOffCount;

      // --- Summary Data for Battery Alerts ---
      summaryData = [
        {
          title: "Battery Off",
          value: batteryOffCount,
          icon: Battery,
          color: themeColors.primary,
          type: "battery-off",
        },
        {
          title: "Critical Battery",
          value: criticalBatteryCount,
          icon: Battery,
          color: themeColors.danger,
          type: "critical-battery",
        },
        {
          title: "Low Battery",
          value: lowBatteryCount,
          icon: Battery,
          color: themeColors.warning,
          type: "low-battery",
        },
        {
          title: "Total Battery Alerts",
          value: totalBatteryAlerts,
          icon: AlertTriangle,
          color: themeColors.warning,
          type: "total-battery-alerts",
        },
      ];
    } else {
      // Calculate full devices count strictly by current_status === 'full'
      const fullDevicesCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter(
            (device) => (device.current_status || "").toLowerCase() === "full"
          ).length
        : 0;
      // Calculate empty and low counts directly from realtimeStatus for accuracy
      const emptyDevicesCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter(
            (device) => (device.current_status || "").toLowerCase() === "empty"
          ).length
        : 0;
      const lowDevicesCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter(
            (device) => (device.current_status || "").toLowerCase() === "low"
          ).length
        : 0;
      const tamperDevicesCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter(
            (device) => (device.current_status || "").toLowerCase() === "tamper"
          ).length
        : 0;
      summaryData = [
        {
          title: "Empty Devices",
          value: emptyDevicesCount,
          icon: AlertOctagon,
          color: themeColors.danger,
          type: "empty",
        },
        {
          title: "Low Level",
          value: lowDevicesCount,
          icon: AlertTriangle,
          color: themeColors.warning,
          type: "low",
        },
        {
          title: "Tamper Alerts",
          value: tamperDevicesCount,
          icon: ShieldAlert,
          color: themeColors.primary,
          type: "tamper",
        },
        {
          title: "Full Devices",
          value: fullDevicesCount,
          icon: CheckCircle,
          color: themeColors.success,
          type: "full",
        },
      ];
    }

    // ...existing code...

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryData.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className="rounded-2xl p-4 shadow-lg border transition-all duration-300 cursor-pointer"
              style={{
                background: themeColors.surface,
                borderColor: themeColors.border,
                boxShadow: `0 4px 12px ${themeColors.shadow}20`,
              }}
              onClick={() =>
                handleDeviceCardClick(
                  item.type // always use the type directly for navigation
                )
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: themeColors.muted }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: themeColors.heading }}
                  >
                    {item.value}
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{ background: item.color + "22", color: item.color }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Remove the blocking loading spinner entirely

  return (
    <React.Fragment>
      {/* Removed showAllDevices modal, now handled by AlertDevicesScreen route */}
      <div
        className="space-y-6 p-6 min-h-screen"
        style={{
          background: themeColors.background,
          color: themeColors.text,
          transition: "background 0.3s, color 0.3s",
        }}
      >
        {/* No blocking loading spinner - background refresh only */}

        {/* Landing Page Top Component - matches mobile app */}
        <LandingPageTop
          stats={dashboardStats}
          realtimeStatus={realtimeStatusCache || realtimeStatus}
          onRefresh={handleRefresh}
          isLoading={false} // Never show loading spinner
          onDeviceCardClick={handleDeviceCardClick}
          isRefreshing={refreshing}
        />

        {/* Enhanced Alert Type Selector - toggle button style for Tissue and Battery Alerts */}
        <div className="flex justify-center mb-6">
          <div
            className="rounded-2xl p-4 shadow-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-xl "
            style={{
              background:
                selectedAlertType === "tissue"
                  ? themeColors.primary + "11"
                  : themeColors.warning + "11",
              borderColor: themeColors.border,
              transition: "background 0.3s, border-color 0.3s",
            }}
          >
            <div className="flex items-center justify-center">
              <span
                className="font-bold text-sm mr-3"
                style={{
                  color:
                    selectedAlertType === "tissue"
                      ? themeColors.primary
                      : themeColors.muted,
                }}
              >
                Tissue
              </span>
              <button
                type="button"
                aria-label="Toggle alert type"
                className="relative w-16 h-8 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 mx-2 border"
                style={{
                  background:
                    selectedAlertType === "tissue"
                      ? themeColors.primary + "22"
                      : themeColors.warning + "22",
                  border: `1px solid ${themeColors.border}`,
                  boxShadow: `0 2px 8px ${themeColors.shadow}22`,
                  transition: "background 0.3s, border 0.3s",
                }}
                onClick={() =>
                  setSelectedAlertType(
                    selectedAlertType === "tissue" ? "battery" : "tissue"
                  )
                }
              >
                <span
                  className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
                  style={{
                    transform:
                      selectedAlertType === "tissue"
                        ? "translateX(0)"
                        : "translateX(32px)",
                    background:
                      selectedAlertType === "tissue"
                        ? themeColors.primary
                        : themeColors.warning,
                    color: themeColors.surface,
                  }}
                >
                  {selectedAlertType === "tissue" ? (
                    <Droplets size={18} className="text-white" />
                  ) : (
                    <Battery size={18} className="text-white" />
                  )}
                </span>
              </button>
              <span
                className="font-bold text-sm ml-3"
                style={{
                  color:
                    selectedAlertType === "battery"
                      ? themeColors.warning
                      : themeColors.muted,
                }}
              >
                Battery
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards Component - matches mobile app */}
        <SummaryCards
          dashboardData={dashboardDataCache || dashboardData}
          realtimeStatus={realtimeStatusCache || realtimeStatus}
          selectedAlertType={selectedAlertType}
          isLoading={false}
          themeColors={themeColors}
        />

        {/* Charts Section with Recent Alerts on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alert Distribution Chart */}
          <DeviceStatusDistribution
            realtimeStatus={realtimeStatusCache || realtimeStatus}
            selectedAlertType={selectedAlertType}
            onRefresh={handleRefresh}
            isLoading={false}
          />

          {/* Recent Alerts Section (now in right column) */}
          <div
            className="rounded-3xl p-4 shadow-lg border flex flex-col transition-all duration-300"
            style={{
              background: themeColors.surface,
              borderColor: themeColors.border,
              boxShadow: `0 4px 12px ${themeColors.shadow}20`,
              transition: "background 0.3s, border-color 0.3s",
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                className="text-lg font-bold"
                style={{ color: themeColors.heading }}
              >
                Recent Alerts
              </h3>
              <Link
                to="/admin/alert-devices/alerts"
                className="font-medium text-sm"
                style={{ color: themeColors.primary }}
              >
                View All
              </Link>
            </div>

            <div className="space-y-3 flex-1">
              {(dashboardDataCache || dashboardData).recentAlerts
                ?.slice(0, 5)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:shadow-md"
                    style={{
                      background: themeColors.surface,
                      borderRadius: 18,
                      border: themeColors.border,

                      cursor: "pointer",
                      boxShadow: `0 2px 8px ${themeColors.shadow}10`,
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background:
                            alert.type === "error"
                              ? themeColors.danger
                              : alert.type === "warning"
                              ? themeColors.warning
                              : themeColors.primary,
                        }}
                      />
                      <div>
                        <div
                          className="font-medium"
                          style={{ color: themeColors.heading }}
                        >
                          {alert.device_name}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: themeColors.muted }}
                        >
                          {alert.message}
                        </div>
                      </div>
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: themeColors.muted }}
                    >
                      {alert.timestamp}
                    </div>
                  </div>
                )) || (
                <div
                  className="text-center py-8"
                  style={{ color: themeColors.muted }}
                >
                  No recent alerts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions removed as requested */}
      </div>
    </React.Fragment>
  );
};

export default AdminDashboard;
