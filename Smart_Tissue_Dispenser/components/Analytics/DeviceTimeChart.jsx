// components/Analytics/DeviceTimeChart.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";

import { AreaLineChart } from "./ChartComponents/index";
// import AlertBreakdown from "./AlertBreakdown";
import {
  formatChartDate,
  generateSequentialDates,
} from "../../utils/chartDateUtils";

const DeviceTimeChart = ({ deviceData, alertType = "tissue" }) => {
  const { themeColors, isDark } = useThemeContext();

  // Debug component updates
  React.useEffect(() => {
    // Log the actual periods data structure for debugging
    if (deviceData?.periods && deviceData.periods.length > 0) {
    }
  }, [deviceData, alertType]);

  // Helper function to get status configuration
  const getDeviceStatusConfig = (status, device, isDark) => {
    const darkModeColors = {
      tamper: "#A855F7",
      empty: "#EF4444",
      low: "#F97316",
      full: "#22C55E",
    };

    const lightModeColors = {
      tamper: "#8B5CF6",
      empty: "#DC2626",
      low: "#FF9800",
      full: "#4CAF50",
    };

    const colors = isDark ? darkModeColors : lightModeColors;
    return { color: colors[status.toLowerCase()] || "#6B7280" };
  };

  // Transform device data into alert trends format for AreaLineChart
  const getAlertTrendsData = () => {
    if (!deviceData?.periods || !Array.isArray(deviceData.periods)) {
      return null;
    }

    const periods = deviceData.periods;
    if (periods.length === 0) {
      return null;
    }

    // Extract labels and data from periods with proper date formatting
    let labels = periods.map((period, index) => {
      // Use backend period_name and period fields according to backend structure
      // Backend sends: period_name like "Week 2024-W25", period like "2024-W25"
      return formatChartDate(period.period_name, period.period, index);
    });

    // Final check: if all labels are the same, generate guaranteed unique sequential dates
    const uniqueLabels = [...new Set(labels)];
    if (uniqueLabels.length === 1 && periods.length > 1) {
      const periodType = periods[0]?.period_name?.includes("Week")
        ? "weekly"
        : periods[0]?.period_name?.includes("Day")
        ? "daily"
        : periods[0]?.period_name?.includes("Month")
        ? "monthly"
        : "weekly";
      labels = generateSequentialDates(periods, periodType);
    }

    if (alertType === "battery") {
      // Extract battery alert data arrays for multi-line chart
      const batteryLowAlerts = periods.map(
        (period) => period.battery_low_alerts || 0
      );
      const batteryCriticalAlerts = periods.map(
        (period) => period.battery_critical_alerts || 0
      );
      const powerOffAlerts = periods.map(
        (period) => period.power_off_alerts || 0
      );
      // Add Battery Off alerts (battery_percentage = 0)
      const batteryOffAlerts = periods.map(
        (period) => period.battery_off_alerts || 0
      );

      // Calculate totals for macros
      const totalBatteryLow = batteryLowAlerts.reduce((a, b) => a + b, 0);
      const totalBatteryCritical = batteryCriticalAlerts.reduce(
        (a, b) => a + b,
        0
      );
      const totalPowerOff = powerOffAlerts.reduce((a, b) => a + b, 0);
      const totalBatteryOff = batteryOffAlerts.reduce((a, b) => a + b, 0);

      const batteryLowConfig = { color: "#FF9F00" };
      const batteryCriticalConfig = { color: "#FF3B30" };
      const powerOffConfig = { color: "#8B5CF6" };
      const batteryOffConfig = { color: "#6366F1" }; // Indigo color for Battery Off

      // Return data for battery alerts
      return {
        labels,
        // Battery alert datasets structure for multi-line chart plotting
        alertDatasets: {
          battery_off_alerts: batteryOffAlerts,
          battery_critical_alerts: batteryCriticalAlerts,
          battery_low_alerts: batteryLowAlerts,
          power_off_alerts: powerOffAlerts,
        },
        macros: [
          {
            name: "Battery Off",
            value: totalBatteryOff,
            color: batteryOffConfig.color,
            unit: "",
          },
          {
            name: "Critical Battery",
            value: totalBatteryCritical,
            color: batteryCriticalConfig.color,
            unit: "",
          },
          {
            name: "Low Battery",
            value: totalBatteryLow,
            color: batteryLowConfig.color,
            unit: "",
          },
          {
            name: "Power Off",
            value: totalPowerOff,
            color: powerOffConfig.color,
            unit: "",
          },
        ],
      };
    } else {
      // Extract tissue alert data arrays for multi-line chart (existing logic)
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

      // Return data for tissue alerts
      return {
        labels,
        // Alert datasets structure for multi-line chart plotting
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
    }
  };

  return (
    <View
      style={[
        styles.glassDeviceChartSection,
        {
          backgroundColor: isDark
            ? themeColors.surface
            : themeColors.background,
          borderColor: isDark ? themeColors.border : "rgba(255, 255, 255, 0.2)",
        },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? [themeColors.surface, themeColors.background]
            : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.6)"]
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Device Header with Glass Effect */}
      <View style={styles.glassDeviceHeader}>
        <View
          style={[
            styles.deviceIconContainer,
            {
              backgroundColor: themeColors.primary + "18",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="devices"
            size={28}
            color={themeColors.primary}
          />
        </View>
        <View style={styles.deviceHeaderText}>
          <Text
            style={[styles.glassDeviceTitle, { color: themeColors.heading }]}
          >
            {deviceData.device_name
              ? deviceData.device_name
              : `Device ${deviceData.device_id}`}
          </Text>
          <Text
            style={[
              styles.glassDeviceSubtitle,
              { color: themeColors.text + "99" },
            ]}
          >
            Room {deviceData.room} • Floor {deviceData.floor}
          </Text>
        </View>
      </View>
      {deviceData.periods.length > 0 && (
        <>
          {/* Use AreaLineChart for alert trends visualization */}
          {getAlertTrendsData() ? (
            <View style={styles.chartContainer}>
              {(() => {
                const chartData = getAlertTrendsData();

                return (
                  <AreaLineChart
                    data={chartData}
                    title={
                      alertType === "battery"
                        ? "Battery Alert Trends"
                        : "Tissue Alert Trends"
                    }
                    showPrediction={true}
                    showHighestReach={true}
                    scrollable={true}
                    formatLabel={(label, idx) => {
                      // Labels are already formatted in getAlertTrendsData
                      return label;
                    }}
                  />
                );
              })()}

              {/* Display alert macros below the chart with glass effect */}
              {(() => {
                const chartData = getAlertTrendsData();
                return (
                  chartData?.macros &&
                  chartData.macros.length > 0 && (
                    <View style={styles.glassMacrosContainer}>
                      <View style={styles.macrosGrid}>
                        {chartData.macros.map((macro, index) => (
                          <View
                            key={index}
                            style={[
                              styles.glassMacroItem,
                              {
                                backgroundColor: isDark
                                  ? themeColors.surface
                                  : themeColors.background,
                                borderColor: isDark
                                  ? themeColors.border
                                  : "rgba(255, 255, 255, 0.3)",
                              },
                            ]}
                          >
                            <LinearGradient
                              colors={
                                isDark
                                  ? [
                                      themeColors.surface,
                                      themeColors.background,
                                    ]
                                  : [macro.color + "15", macro.color + "05"]
                              }
                              style={StyleSheet.absoluteFillObject}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            />
                            <View
                              style={[
                                styles.macroIndicator,
                                { backgroundColor: macro.color },
                              ]}
                            />
                            <Text
                              style={[
                                styles.glassMacroValue,
                                {
                                  color: isDark
                                    ? themeColors.heading
                                    : macro.color,
                                },
                              ]}
                            >
                              {macro.value}
                            </Text>
                            <Text
                              style={[
                                styles.glassMacroName,
                                { color: themeColors.text },
                              ]}
                            >
                              {macro.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )
                );
              })()}
            </View>
          ) : (
            // Fallback to original chart if alert data is not available
            <View style={styles.chartContainer}>
              <AreaLineChart
                data={{
                  labels: deviceData.periods.slice(-6).map((p) => {
                    // Try to show full date if possible
                    if (p.period && /^\d{4}-\d{2}-\d{2}/.test(p.period)) {
                      const d = new Date(p.period);
                      if (!isNaN(d)) {
                        return d.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                        });
                      }
                    }
                    return p.period;
                  }),
                  datasets: [
                    {
                      data: deviceData.periods
                        .slice(-6)
                        .map((p) => p.total_entries),
                    },
                  ],
                }}
                title="Entry Trends"
              />
            </View>
          )}

          {/* <AlertBreakdown
            periods={deviceData.periods.slice(-4)}
            alertType={alertType}
          /> */}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Glass-Style Device Chart Section
  glassDeviceChartSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
  },
  glassDeviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  deviceHeaderText: {
    flex: 1,
  },
  glassDeviceTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  glassDeviceSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },

  // Chart Container
  chartContainer: {
    marginBottom: 12,
  },

  // Glass-Style Macros
  glassMacrosContainer: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  glassMacroItem: {
    width: "48%", // Ensure 2 items per row with proper spacing
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 6, // Reduced margin between rows
  },
  glassMacroValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  glassMacroName: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
    opacity: 0.9,
  },

  // Legacy styles (keeping for compatibility)
  deviceChartSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 8,
    padding: 16,
    overflow: "hidden",
  },
  deviceChartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  deviceChartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  deviceChartSubtitle: {
    fontSize: 14,
    marginLeft: 8,
  },
  macrosContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legacyMacrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  macroItem: {
    flex: 1,
    minWidth: "22%",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  macroIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  macroName: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default DeviceTimeChart;
