// components/Analytics/OverviewTab.js
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import SummaryCards from "../AdminAnalytics/SummaryCards";
import { useRouter } from "expo-router";
import { DonutChart, ModernBarChart } from "./ChartComponents/index";
import { useThemeContext } from "../../context/ThemeContext";
import { createShadow } from "../../utils/webStyles";

const OverviewTab = ({ analytics, summaryData }) => {
  const { themeColors, isDark } = useThemeContext();
  const [selectedAlertType, setSelectedAlertType] = useState("empty");
  const router = useRouter();

  // Add debug logging for props
  console.log("OverviewTab - Analytics data:", analytics);
  console.log("OverviewTab - Summary data:", summaryData); // Enhanced alert distribution with proper empty/full status handling
  const getAlertDistributionData = () => {
    const distribution = summaryData?.alert_distribution || {};

    console.log("Alert Distribution Data:", distribution);
    console.log("Analytics Data:", analytics);

    // Initialize all counters
    let emptyCount = 0;
    let fullCount = 0;
    let lowCount = 0;
    let tamperCount = 0;

    // Count from analytics data if available
    if (analytics && Array.isArray(analytics) && analytics.length > 0) {
      analytics.forEach((device) => {
        const status = device.current_status?.toLowerCase() || "";
        const level = parseFloat(device.current_level) || 0;

        // Debug each device
        console.log(
          `Device ${
            device.device_id || device.id
          }: status=${status}, level=${level}`
        );

        // Count based on current_status first
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
            // If status is not clear, use level-based logic
            if (level <= 10) {
              emptyCount++;
            } else if (level >= 90) {
              fullCount++;
            } else if (level <= 25) {
              lowCount++;
            }
            break;
        }

        // Count tamper alerts separately (additional check)
        if (
          (device.tamper_count > 0 || device.tamper_alert_count > 0) &&
          status !== "tamper"
        ) {
          tamperCount++;
        }
      });
    }

    // Use backend data if available, otherwise use calculated data
    const finalEmptyCount =
      distribution.empty !== undefined ? distribution.empty : emptyCount;
    const finalFullCount =
      distribution.full !== undefined ? distribution.full : fullCount;
    const finalLowCount =
      distribution.low !== undefined ? distribution.low : lowCount;
    const finalTamperCount =
      distribution.tamper !== undefined ? distribution.tamper : tamperCount;

    console.log("Final counts:", {
      empty: finalEmptyCount,
      full: finalFullCount,
      low: finalLowCount,
      tamper: finalTamperCount,
    });

    // Always return all status types with proper data structure for the chart
    const result = [
      {
        name: "Empty",
        population: finalEmptyCount,
        value: finalEmptyCount,
        color: "#FF4757", // Red for empty
      },
      {
        name: "Low",
        population: finalLowCount,
        value: finalLowCount,
        color: "#FF9F00", // Orange for low
      },
      {
        name: "Full",
        population: finalFullCount,
        value: finalFullCount,
        color: "#10B981", // Green for full
      },
      {
        name: "Tamper",
        population: finalTamperCount,
        value: finalTamperCount,
        color: "#8B5CF6", // Purple for tamper
      },
    ];

    console.log("Alert distribution result:", result);
    return result;
  }; // Enhanced Top 5 devices data with alert type selection
  const getTop5DevicesData = () => {
    if (!analytics || !Array.isArray(analytics) || analytics.length === 0) {
      console.log("No analytics data available for Top 5 devices");
      return {
        labels: ["No Data Available"],
        datasets: [{ data: [0], colors: ["#E5E7EB"] }],
      };
    }

    console.log(
      `Calculating Top 5 devices for alert type: ${selectedAlertType}`
    ); // Filter and sort devices based on selected alert type
    const deviceData = analytics
      .map((device) => {
        const alertValue = getAlertValue(device, selectedAlertType);
        // Use device name if available, otherwise fall back to device ID
        const deviceLabel =
          device.device_name ||
          device.name ||
          `Device ${device.device_id || device.id}`;

        console.log(
          `${deviceLabel}: ${selectedAlertType} alerts = ${alertValue}`
        );

        return {
          ...device,
          alertValue,
          deviceLabel,
        };
      })
      .filter((device) => device.alertValue > 0) // Only show devices with actual alert counts
      .sort((a, b) => b.alertValue - a.alertValue)
      .slice(0, 5);

    console.log("Filtered device data:", deviceData);

    // If no devices have alerts of the selected type, show message
    if (deviceData.length === 0) {
      return {
        labels: [`No ${selectedAlertType} alerts found`],
        datasets: [{ data: [0], colors: ["#E5E7EB"] }],
      };
    }

    const result = {
      labels: deviceData.map((d) => d.deviceLabel),
      datasets: [
        {
          data: deviceData.map((d) => d.alertValue),
          colors: deviceData.map(() => getBarColor(selectedAlertType)),
        },
      ],
    };

    console.log("Top 5 devices result:", result);
    return result;
  }; // Helper function to get alert value based on selected type
  const getAlertValue = (device, alertType) => {
    if (!device) return 0;

    const status = device.current_status?.toLowerCase() || "";
    const level = parseFloat(device.current_level) || 0;

    switch (alertType) {
      case "low":
        // Check low alert count or if status indicates low
        const lowAlerts = device.low_alert_count || 0;
        const isStatusLow = status === "low" ? 1 : 0;
        const isLevelLow = level > 10 && level <= 25 ? 1 : 0;
        return Math.max(lowAlerts, isStatusLow, isLevelLow);

      case "empty":
        // Count both empty alert count and current empty status
        const emptyAlerts = device.empty_alert_count || 0;
        const isCurrentlyEmpty = status === "empty" ? 1 : 0;
        const isLevelEmpty = level <= 10 ? 1 : 0;
        return Math.max(emptyAlerts, isCurrentlyEmpty, isLevelEmpty);

      case "full":
        // Count both full alert count and current full status
        const fullAlerts = device.full_alert_count || 0;
        const isCurrentlyFull = status === "full" ? 1 : 0;
        const isLevelFull = level >= 90 ? 1 : 0;
        return Math.max(fullAlerts, isCurrentlyFull, isLevelFull);

      case "tamper":
        const tamperAlerts =
          device.tamper_count || device.tamper_alert_count || 0;
        const isStatusTamper = status === "tamper" ? 1 : 0;
        return Math.max(tamperAlerts, isStatusTamper);

      default:
        return 0;
    }
  };

  // Helper function to get bar color based on alert type
  const getBarColor = (alertType) => {
    const colors = {
      empty: "#FF4757",
      low: "#FF9F00",
      full: "#10B981",
      tamper: "#8B5CF6",
    };
    return colors[alertType] || themeColors.primary;
  }; // Alert type options for toggle
  const alertTypes = [
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
  const styles = getStyles(themeColors, isDark);

  const alertDistributionData = getAlertDistributionData();
  const top5DevicesData = getTop5DevicesData();

  return (
    <View>
      <SummaryCards
        summaryData={summaryData}
        onTotalDevicesPress={() => router.push("/(Admintab)/AllDevicesScreen")}
      />
      <View style={styles.chartContainer}>
        <DonutChart
          data={alertDistributionData}
          title="Alert Status Distribution"
          centerValue={analytics?.length || 0}
          centerLabel="Total Devices"
        />
      </View>
      {/* Alert Type Toggle for Top 5 Devices */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleTitle}>Top 5 Devices by Alert Type</Text>
        <View style={styles.toggleButtons}>
          {alertTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.toggleButton,
                selectedAlertType === type.key && [
                  styles.toggleButtonActive,
                  {
                    backgroundColor: type.color + "20",
                    borderColor: type.color,
                  },
                ],
              ]}
              onPress={() => setSelectedAlertType(type.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={type.icon}
                size={14}
                color={
                  selectedAlertType === type.key ? type.color : themeColors.text
                }
              />
              <Text
                style={[
                  styles.toggleButtonText,
                  selectedAlertType === type.key && { color: type.color },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.chartContainer}>
        <ModernBarChart
          data={top5DevicesData}
          title={`Top 5 Devices - ${
            alertTypes.find((t) => t.key === selectedAlertType)?.label
          } Alerts`}
          showPercentage={false}
        />
      </View>
    </View>
  );
};

const getStyles = (themeColors, isDark) =>
  StyleSheet.create({
    toggleContainer: {
      marginHorizontal: 8,
      marginVertical: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      ...createShadow({
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      }),
    },
    chartContainer: {
      marginHorizontal: 8,
      marginVertical: 12,
    },
    toggleTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: themeColors.heading,
      marginBottom: 12,
      textAlign: "center",
    },
    toggleButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    toggleButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.background,
      flex: 1,
      justifyContent: "center",
      marginHorizontal: 1,
      minHeight: 40,
    },
    toggleButtonActive: {
      borderWidth: 2,
    },
    toggleButtonText: {
      fontSize: 10,
      fontWeight: "600",
      color: themeColors.text,
      marginLeft: 2,
      textAlign: "center",
      flexShrink: 1,
    },
  });

export default OverviewTab;
