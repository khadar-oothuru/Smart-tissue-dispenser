import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { PieChart, BarChart } from "react-native-chart-kit";

import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useDeviceStore } from "../store/useDeviceStore";

const { width: screenWidth } = Dimensions.get("window");

export default function DeviceStatusDistribution({
  deviceId,
  showTitle = true,
}) {
  const { themeColors, isDark } = useThemeContext();
  const { accessToken } = useAuth();

  const {
    statusDistribution,
    distributionLoading,
    distributionError,
    fetchDeviceStatusDistribution,
  } = useDeviceStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const styles = createStyles(themeColors, isDark);

  // Load status distribution data
  const loadStatusDistribution = useCallback(async () => {
    if (!accessToken) return;

    try {
      await fetchDeviceStatusDistribution(accessToken);
    } catch (error) {
      console.error("Failed to load status distribution:", error);
    }
  }, [accessToken, fetchDeviceStatusDistribution]);

  // Refresh functionality
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatusDistribution();
    setRefreshing(false);
  }, [loadStatusDistribution]);

  useEffect(() => {
    loadStatusDistribution();
  }, [loadStatusDistribution]);

  // Filter data for specific device if deviceId is provided
  const deviceData =
    deviceId && statusDistribution?.devices
      ? statusDistribution.devices.find(
          (d) => d.device_id === parseInt(deviceId)
        )
      : null; // Get status color - ONLY tissue-level statuses allowed
  const getStatusColor = (status) => {
    const colors = {
      tamper: "#8B5CF6", // Purple - Highest priority
      empty: "#DC2626", // Red - Second priority (tissue empty)
      low: "#F59E0B", // Orange - Third priority
      full: "#22C55E", // Green - Lowest priority
      // Removed normal, inactive - only tissue-level statuses allowed
    };
    return colors[status] || "#9CA3AF"; // Default gray for unknown status
  }; // Get status icon - ONLY tissue-level statuses allowed
  const getStatusIcon = (status) => {
    const icons = {
      tamper: "warning",
      empty: "close-circle",
      low: "archive-outline",
      full: "archive",
      // Removed normal, inactive - only tissue-level statuses allowed
    };
    return icons[status] || "help";
  };
  // Prepare pie chart data - ONLY tissue-level statuses allowed
  const preparePieChartData = (statusCounts) => {
    // Only show tissue-level statuses: tamper, empty, low, full
    const allowedStatuses = ["tamper", "empty", "low", "full"];

    return Object.entries(statusCounts)
      .filter(
        ([status, count]) =>
          count > 0 && allowedStatuses.includes(status.toLowerCase())
      )
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        population: count,
        color: getStatusColor(status),
        legendFontColor: themeColors.text,
        legendFontSize: 12,
      }));
  };
  // Prepare bar chart data - ONLY tissue-level statuses allowed
  const prepareBarChartData = (statusCounts) => {
    // Only show tissue-level statuses: tamper, empty, low, full
    const allowedStatuses = ["tamper", "empty", "low", "full"];

    const filteredEntries = Object.entries(statusCounts).filter(
      ([status, count]) =>
        count > 0 && allowedStatuses.includes(status.toLowerCase())
    );

    const labels = filteredEntries.map(
      ([status]) => status.charAt(0).toUpperCase() + status.slice(1)
    );
    const data = filteredEntries.map(([, count]) => count);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          colors: filteredEntries.map(
            ([status]) =>
              () =>
                getStatusColor(status)
          ),
        },
      ],
    };
  };

  if (distributionLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Loading status distribution...</Text>
      </View>
    );
  }

  if (distributionError) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons
          name="error-outline"
          size={48}
          color={themeColors.error}
        />
        <Text style={styles.errorTitle}>
          Unable to Load Status Distribution
        </Text>
        <Text style={styles.errorMessage}>{distributionError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show specific device data if deviceId is provided
  if (deviceId && deviceData) {
    const pieData = preparePieChartData(deviceData.status_counts);

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {showTitle && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Device Status Distribution</Text>
            <Text style={styles.headerSubtitle}>
              {deviceData.device_name} - Room {deviceData.room}, Floor
              {deviceData.floor}
            </Text>
          </View>
        )}
        {/* Current Status Card */}
        <View style={styles.currentStatusCard}>
          <LinearGradient
            colors={[
              getStatusColor(deviceData.current_status),
              getStatusColor(deviceData.current_status) + "80",
            ]}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <MaterialIcons
                name={getStatusIcon(deviceData.current_status)}
                size={32}
                color="white"
              />
              <Text style={styles.currentStatusText}>
                {deviceData.current_status.charAt(0).toUpperCase() +
                  deviceData.current_status.slice(1)}
              </Text>
            </View>
            <Text style={styles.statusDescription}>Current Device Status</Text>
            {deviceData.current_values && (
              <View style={styles.currentValues}>
                <Text style={styles.valueText}>
                  Alert: {deviceData.current_values.alert || "N/A"}
                </Text>
                <Text style={styles.valueText}>
                  Count: {deviceData.current_values.count || 0}
                </Text>
                <Text style={styles.valueText}>
                  Tamper: {deviceData.current_values.tamper ? "Yes" : "No"}
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{deviceData.total_entries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {deviceData.recent_activity.entries_24h}
            </Text>
            <Text style={styles.statLabel}>Last 24h</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {deviceData.recent_activity.alerts_24h}
            </Text>
            <Text style={styles.statLabel}>Alerts 24h</Text>
          </View>
        </View>
        {/* Pie Chart */}
        {pieData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Status Distribution</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: themeColors.surface,
                backgroundGradientFrom: themeColors.surface,
                backgroundGradientTo: themeColors.surface,
                color: () => themeColors.text,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
            />
          </View>
        )}
        {/* Status Breakdown - ONLY tissue-level statuses */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Detailed Breakdown</Text>
          {Object.entries(deviceData.status_counts)
            .filter(([status, count]) => {
              const allowedStatuses = ["tamper", "empty", "low", "full"];
              return (
                count > 0 && allowedStatuses.includes(status.toLowerCase())
              );
            })
            .map(([status, count]) => (
              <View key={status} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(status) },
                    ]}
                  />
                  <Text style={styles.breakdownStatus}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </View>
                <View style={styles.breakdownRight}>
                  <Text style={styles.breakdownCount}>{count}</Text>
                  <Text style={styles.breakdownPercentage}>
                    ({deviceData.status_percentages[status]}%)
                  </Text>
                </View>
              </View>
            ))}
        </View>
        {/* Timestamps */}
        <View style={styles.timestampCard}>
          <Text style={styles.timestampTitle}>Timeline Information</Text>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>Last Updated:</Text>
            <Text style={styles.timestampValue}>
              {deviceData.timestamps.last_updated
                ? new Date(deviceData.timestamps.last_updated).toLocaleString()
                : "Never"}
            </Text>
          </View>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>Last Status Change:</Text>
            <Text style={styles.timestampValue}>
              {deviceData.timestamps.last_status_change
                ? new Date(
                    deviceData.timestamps.last_status_change
                  ).toLocaleString()
                : "No changes detected"}
            </Text>
          </View>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>First Entry:</Text>
            <Text style={styles.timestampValue}>
              {deviceData.timestamps.first_entry
                ? new Date(deviceData.timestamps.first_entry).toLocaleString()
                : "No data"}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Show all devices overview if no specific deviceId
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {showTitle && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            All Devices Status Distribution
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={20} color={themeColors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Overall Statistics */}
      {statusDistribution?.overall_statistics && (
        <View style={styles.overallStatsCard}>
          <Text style={styles.overallStatsTitle}>System Overview</Text>
          <View style={styles.overallStatsGrid}>
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue}>
                {statusDistribution.overall_statistics.total_devices}
              </Text>
              <Text style={styles.overallStatLabel}>Total Devices</Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: "#22C55E" }]}>
                {statusDistribution.overall_statistics.active_devices}
              </Text>
              <Text style={styles.overallStatLabel}>Active</Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: "#DC2626" }]}>
                {statusDistribution.overall_statistics.status_summary.critical}
              </Text>
              <Text style={styles.overallStatLabel}>Critical</Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: "#6B7280" }]}>
                {statusDistribution.overall_statistics.inactive_devices}
              </Text>
              <Text style={styles.overallStatLabel}>Inactive</Text>
            </View>
          </View>
        </View>
      )}

      {/* Device List */}
      <View style={styles.deviceListCard}>
        <Text style={styles.deviceListTitle}>Individual Device Status</Text>
        {statusDistribution?.devices?.map((device) => (
          <TouchableOpacity
            key={device.device_id}
            style={styles.deviceItem}
            onPress={() =>
              setSelectedDevice(
                selectedDevice === device.device_id ? null : device.device_id
              )
            }
          >
            <View style={styles.deviceItemHeader}>
              <View style={styles.deviceItemLeft}>
                <View
                  style={[
                    styles.deviceStatusIndicator,
                    { backgroundColor: getStatusColor(device.current_status) },
                  ]}
                />
                <View>
                  <Text style={styles.deviceItemName}>
                    {device.device_name}
                  </Text>
                  <Text style={styles.deviceItemLocation}>
                    Room {device.room}, Floor {device.floor}
                  </Text>
                </View>
              </View>
              <View style={styles.deviceItemRight}>
                <Text
                  style={[
                    styles.deviceItemStatus,
                    { color: getStatusColor(device.current_status) },
                  ]}
                >
                  {device.current_status.charAt(0).toUpperCase() +
                    device.current_status.slice(1)}
                </Text>
                <Ionicons
                  name={
                    selectedDevice === device.device_id
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color={themeColors.text}
                />
              </View>
            </View>

            {selectedDevice === device.device_id && (
              <View style={styles.deviceItemExpanded}>
                <View style={styles.deviceStatsRow}>
                  <Text style={styles.deviceStatLabel}>Total Entries: </Text>
                  <Text style={styles.deviceStatValue}>
                    {device.total_entries}
                  </Text>
                </View>
                <View style={styles.deviceStatsRow}>
                  <Text style={styles.deviceStatLabel}>24h Activity: </Text>
                  <Text style={styles.deviceStatValue}>
                    {device.recent_activity.entries_24h}
                  </Text>
                </View>
                <View style={styles.deviceStatsRow}>
                  <Text style={styles.deviceStatLabel}>24h Alerts: </Text>
                  <Text style={styles.deviceStatValue}>
                    {device.recent_activity.alerts_24h}
                  </Text>
                </View>

                {/* Mini status breakdown */}
                <View style={styles.miniBreakdown}>
                  {Object.entries(device.status_counts)
                    .filter(([_, count]) => count > 0)
                    .map(([status, count]) => (
                      <View key={status} style={styles.miniBreakdownItem}>
                        <View
                          style={[
                            styles.miniStatusIndicator,
                            { backgroundColor: getStatusColor(status) },
                          ]}
                        />
                        <Text style={styles.miniBreakdownText}>
                          {status}: {count} ({device.status_percentages[status]}
                          %)
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.heading,
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    errorMessage: {
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.heading,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.text,
      marginTop: 4,
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    currentStatusCard: {
      marginBottom: 20,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    statusGradient: {
      padding: 20,
    },
    statusHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    currentStatusText: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
      marginLeft: 12,
    },
    statusDescription: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.8)",
      marginBottom: 16,
    },
    currentValues: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    valueText: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.9)",
      fontWeight: "500",
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginHorizontal: 4,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.heading,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.text,
      fontWeight: "500",
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.heading,
      marginBottom: 16,
      textAlign: "center",
    },
    breakdownCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    breakdownTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.heading,
      marginBottom: 16,
    },
    breakdownRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "20",
    },
    breakdownLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    breakdownStatus: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    breakdownRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    breakdownCount: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.heading,
      marginRight: 8,
    },
    breakdownPercentage: {
      fontSize: 14,
      color: colors.text,
    },
    timestampCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    timestampTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.heading,
      marginBottom: 16,
    },
    timestampRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    timestampLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
    },
    timestampValue: {
      fontSize: 14,
      color: colors.heading,
      fontWeight: "600",
      textAlign: "right",
      flex: 1,
      marginLeft: 12,
    },
    overallStatsCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    overallStatsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.heading,
      marginBottom: 16,
      textAlign: "center",
    },
    overallStatsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    overallStatItem: {
      alignItems: "center",
      flex: 1,
    },
    overallStatValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.heading,
      marginBottom: 4,
    },
    overallStatLabel: {
      fontSize: 12,
      color: colors.text,
      fontWeight: "500",
      textAlign: "center",
    },
    deviceListCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    deviceListTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.heading,
      marginBottom: 16,
    },
    deviceItem: {
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: colors.background,
      overflow: "hidden",
    },
    deviceItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
    },
    deviceItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    deviceStatusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    deviceItemName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.heading,
    },
    deviceItemLocation: {
      fontSize: 12,
      color: colors.text,
      marginTop: 2,
    },
    deviceItemRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    deviceItemStatus: {
      fontSize: 14,
      fontWeight: "600",
      marginRight: 8,
    },
    deviceItemExpanded: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border + "20",
      backgroundColor: colors.surface,
    },
    deviceStatsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    deviceStatLabel: {
      fontSize: 14,
      color: colors.text,
    },
    deviceStatValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.heading,
    },
    miniBreakdown: {
      marginTop: 12,
    },
    miniBreakdownItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    miniStatusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    miniBreakdownText: {
      fontSize: 12,
      color: colors.text,
    },
  });
