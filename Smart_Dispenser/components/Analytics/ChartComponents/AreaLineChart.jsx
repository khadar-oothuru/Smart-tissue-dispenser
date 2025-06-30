import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useThemeContext } from "../../../context/ThemeContext";

const screenWidth = Dimensions.get("window").width;

export const AreaLineChart = ({
  data,
  title,
  subtitle,
  showMacros = true,
  scrollable = true, // Always enable horizontal scroll for better UX
  alertData = null, // Alert counts for macros only
  weeklyData = null, // Weekly breakdown data
  chartType = "line", // "line" for time-series data, "alert" for alert breakdown
  formatLabel = null, // Optional: function to format labels
  startDate = null, // Optional: start date for label calculation
}) => {
  const { themeColors, isDark } = useThemeContext();

  // Alert configurations matching AlertBreakdown component
  const alertConfigs = {
    tamper_alerts: {
      color: "#8B5CF6",
      bgColor: "#8B5CF615",
      label: "Tamper",
      unit: "",
    },
    empty_alerts: {
      color: "#DC2626",
      bgColor: "#DC262615",
      label: "Empty",
      unit: "",
    },
    low_alerts: {
      color: "#FF9800",
      bgColor: "#FF980015",
      label: "Low",
      unit: "",
    },
    full_alerts: {
      color: "#4CAF50",
      bgColor: "#4CAF5015",
      label: "Full",
      unit: "",
    },
  };
  // Check if we have valid chart data for plotting
  const hasValidChartData =
    data &&
    data.datasets &&
    data.datasets[0] &&
    data.datasets[0].data &&
    data.datasets[0].data.length > 0;

  // Function to create multi-line chart data for alerts
  const createAlertChartData = (alertTimeSeriesData) => {
    if (
      !alertTimeSeriesData ||
      !alertTimeSeriesData.labels ||
      !alertTimeSeriesData.alertDatasets
    ) {
      return null;
    }

    return {
      labels: alertTimeSeriesData.labels,
      datasets: [
        {
          data: alertTimeSeriesData.alertDatasets.full_alerts || [],
          color: () => alertConfigs.full_alerts.color,
          strokeWidth: 2,
        },
        {
          data: alertTimeSeriesData.alertDatasets.empty_alerts || [],
          color: () => alertConfigs.empty_alerts.color,
          strokeWidth: 2,
        },
        {
          data: alertTimeSeriesData.alertDatasets.low_alerts || [],
          color: () => alertConfigs.low_alerts.color,
          strokeWidth: 2,
        },
        {
          data: alertTimeSeriesData.alertDatasets.tamper_alerts || [],
          color: () => alertConfigs.tamper_alerts.color,
          strokeWidth: 2,
        },
      ],
    };
  };

  // Use alert chart data if available and no regular data
  let chartData = hasValidChartData ? data : createAlertChartData(data);
  const shouldRenderChart =
    hasValidChartData || (chartData && chartData.datasets);

  // Format labels for better date display if possible
  if (chartData && chartData.labels && chartData.labels.length > 0) {
    chartData = {
      ...chartData,
      labels: chartData.labels.map((label, idx) => {
        if (formatLabel) return formatLabel(label, idx);
        // Try to auto-format if label looks like a date string (e.g. 2025-06-30)
        if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
          const d = new Date(label);
          if (!isNaN(d)) {
            return d.toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
            });
          }
        }
        // If label is just a month (e.g. 'Jun'), try to add day from startDate and idx
        if (/^[A-Za-z]{3,}$/.test(label) && startDate) {
          const base = new Date(startDate);
          if (!isNaN(base)) {
            const d = new Date(base);
            d.setDate(base.getDate() + idx);
            return d.toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
            });
          }
        }
        return label;
      }),
    };
  }

  if (!shouldRenderChart && !alertData) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.card }]}>
        <Text style={[styles.noDataText, { color: themeColors.text }]}>
          No data available
        </Text>
      </View>
    );
  }
  // Always allow horizontal scroll if more than 5 labels
  const labelCount = chartData?.labels?.length || data?.labels?.length || 0;
  const chartWidth =
    scrollable && labelCount > 5
      ? Math.max(screenWidth - 48, labelCount * 60)
      : screenWidth - 48;

  const renderChart = () => (
    <LineChart
      data={chartData || data}
      width={chartWidth}
      height={220}
      withDots={false}
      withShadow={true}
      withInnerLines={true}
      withOuterLines={false}
      withVerticalLines={false}
      withHorizontalLines={true}
      fromZero={true}
      segments={4}
      bezier
      chartConfig={{
        backgroundGradientFrom: themeColors.card,
        backgroundGradientTo: themeColors.card,
        fillShadowGradientFrom: themeColors.primary,
        fillShadowGradientTo: isDark ? themeColors.surface : "#f7f0e8",
        fillShadowGradientFromOpacity: 0.6,
        fillShadowGradientToOpacity: 0.05,
        color: () => themeColors.primary,
        labelColor: () => themeColors.text,
        strokeWidth: 3,
        propsForBackgroundLines: {
          stroke: isDark ? themeColors.border : "#ECECEC",
          strokeWidth: 1,
        },
        propsForLabels: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
      style={styles.chart}
      transparent={true}
    />
  );
  return (
    <View style={[styles.container, { backgroundColor: themeColors.card }]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, { color: themeColors.heading }]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: themeColors.text }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {/* Only render chart if we have valid chart data */}
      {shouldRenderChart &&
        (scrollable && chartWidth > screenWidth - 48 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chartScrollView}
          >
            {renderChart()}
          </ScrollView>
        ) : (
          renderChart()
        ))}
      {/* If no chart data but we have alertData, show a message */}
      {!shouldRenderChart && alertData && (
        <View style={styles.noChartDataContainer}>
          <Text style={[styles.noChartDataText, { color: themeColors.text }]}>
            📊 Alert breakdown below - No time series data available for chart
          </Text>
        </View>
      )}
      {/* Show alert-based macros if alertData is provided - ALL ALERTS */}
      {showMacros && alertData && (
        <View
          style={[
            styles.macros,
            { borderTopColor: isDark ? themeColors.border : "#EEE" },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.macroScrollContainer}
          >
            {Object.entries(alertConfigs).map(([alertType, config]) => {
              const alertCount = alertData[alertType] || 0;
              return (
                <TouchableOpacity
                  key={`alert-${alertType}`}
                  style={[
                    styles.macroCard,
                    { backgroundColor: config.bgColor },
                  ]}
                  activeOpacity={0.85}
                >
                  <View style={styles.macroTopRow}>
                    <View
                      style={[
                        styles.macroDot,
                        { backgroundColor: config.color },
                      ]}
                    />
                    <Text style={[styles.macroValue, { color: config.color }]}>
                      {alertCount}
                    </Text>
                  </View>
                  <Text
                    style={[styles.macroLabel, { color: config.color + "CC" }]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      {/* Weekly Data Section */}
      {weeklyData && (
        <View style={styles.weeklySection}>
          <Text
            style={[styles.weeklySectionTitle, { color: themeColors.heading }]}
          >
            Weekly Breakdown
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weeklyScrollContainer}
          >
            {weeklyData.map((week, index) => (
              <View
                key={`week-${index}`}
                style={[
                  styles.weeklyCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.weeklyTitle, { color: themeColors.heading }]}
                >
                  {week.week}
                </Text>
                <Text
                  style={[styles.weeklyTotal, { color: themeColors.primary }]}
                >
                  {week.total} Total
                </Text>
                <View style={styles.weeklyAlertsHorizontal}>
                  {Object.entries(alertConfigs).map(([alertType, config]) => {
                    const count = week.alerts?.[alertType] || 0;
                    if (count === 0) return null;
                    return (
                      <View
                        key={alertType}
                        style={styles.weeklyAlertItemHorizontal}
                      >
                        <View
                          style={[
                            styles.weeklyAlertDot,
                            { backgroundColor: config.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.weeklyAlertText,
                            { color: themeColors.text },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    opacity: 0.75,
  },
  chart: {
    borderRadius: 16,
    marginTop: 8,
    marginHorizontal: -8,
  },
  chartScrollView: {
    marginHorizontal: -8,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    padding: 40,
  },
  noChartDataContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    borderRadius: 12,
    marginVertical: 10,
  },
  noChartDataText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    fontStyle: "italic",
  },
  macros: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 20,
  },
  macroScrollContainer: {
    flexDirection: "row",
    paddingLeft: 4,
    paddingRight: 12,
    gap: 12,
  },
  macroCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    width: 90,
  },
  macroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.8,
    textAlign: "center",
  },
  // Weekly section styles
  weeklySection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  weeklySectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  weeklyScrollContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
    gap: 16,
  },
  weeklyCard: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  weeklyTotal: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  weeklyAlertsHorizontal: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  weeklyAlertItemHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  weeklyAlertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weeklyAlertText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
