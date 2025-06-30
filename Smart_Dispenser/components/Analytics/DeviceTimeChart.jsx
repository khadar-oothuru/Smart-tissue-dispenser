// components/Analytics/DeviceTimeChart.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
// import { AreaLineChart } from '../AdminAnalytics/ChartComponents';
import { AreaLineChart } from "../Analytics/ChartComponents/index";
import AlertBreakdown from "./AlertBreakdown";

const DeviceTimeChart = ({ deviceData }) => {
  const { themeColors, isDarkMode } = useThemeContext();

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

    const tamperConfig = getDeviceStatusConfig("tamper", null, isDarkMode);
    const lowConfig = getDeviceStatusConfig("low", null, isDarkMode);
    const emptyConfig = getDeviceStatusConfig("empty", null, isDarkMode);
    const fullConfig = getDeviceStatusConfig("full", null, isDarkMode);

    // Return data in the format expected by AreaLineChart for alert time-series
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
  };

  return (
    <View
      style={[
        styles.deviceChartSection,
        { backgroundColor: themeColors.surface || "#fff" },
      ]}
    >
      {/* Device Name at the Top */}
      <View style={styles.deviceChartHeader}>
        <MaterialCommunityIcons
          name="devices"
          size={24}
          color={themeColors.primary}
        />
        <Text style={[styles.deviceChartTitle, { color: themeColors.heading }]}>
          {deviceData.device_name
            ? deviceData.device_name
            : `Device ${deviceData.device_id}`}
        </Text>
        <Text style={[styles.deviceChartSubtitle, { color: themeColors.text }]}>
          Room {deviceData.room}, Floor {deviceData.floor}
        </Text>
      </View>

      {deviceData.periods.length > 0 && (
        <>
          {/* Use AreaLineChart for alert trends visualization */}
          {getAlertTrendsData() ? (
            <View>
              <AreaLineChart
                data={getAlertTrendsData()}
                title="Alert Trends"
                formatLabel={(label, idx) => {
                  // Try to show full date or a better label
                  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
                    const d = new Date(label);
                    if (!isNaN(d)) {
                      return d.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      });
                    }
                  }
                  return label;
                }}
              />

              {/* Display alert macros below the chart */}
              {getAlertTrendsData().macros &&
                getAlertTrendsData().macros.length > 0 && (
                  <View style={styles.macrosContainer}>
                    <View style={styles.macrosGrid}>
                      {getAlertTrendsData().macros.map((macro, index) => (
                        <View
                          key={index}
                          style={[
                            styles.macroItem,
                            { backgroundColor: themeColors.surface || "#fff" },
                          ]}
                        >
                          <View
                            style={[
                              styles.macroIndicator,
                              { backgroundColor: macro.color },
                            ]}
                          />
                          <Text
                            style={[
                              styles.macroValue,
                              { color: themeColors.heading },
                            ]}
                          >
                            {macro.value}
                          </Text>
                          <Text
                            style={[
                              styles.macroName,
                              { color: themeColors.text },
                            ]}
                          >
                            {macro.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
            </View>
          ) : (
            // Fallback to original chart if alert data is not available
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
          )}

          <AlertBreakdown periods={deviceData.periods.slice(-4)} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  deviceChartSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 8,
    padding: 16,
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
  },
  deviceChartSubtitle: {
    fontSize: 14,
    marginLeft: 8,
  },
  macrosContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  macrosGrid: {
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
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
