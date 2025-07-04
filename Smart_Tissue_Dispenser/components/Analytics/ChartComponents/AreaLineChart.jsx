import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../../../context/ThemeContext";
import { generateTrendAnalysis } from "../../../utils/chartAnalytics";

const screenWidth = Dimensions.get("window").width;

export const AreaLineChart = ({
  data,
  title,
  subtitle,
  showMacros = true,
  scrollable = true,
  alertData = null,
  weeklyData = null,
  chartType = "line",
  formatLabel = null,
  startDate = null,
  showPrediction = true,
  showHighestReach = true,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const [showPredictions, setShowPredictions] = useState(false);

  // Alert configurations for both tissue and battery alerts
  const alertConfigs = {
    // Tissue alerts
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
    // Battery alerts
    battery_low_alerts: {
      color: "#FF9F00",
      bgColor: "#FF9F0015",
      label: "Low Battery",
      unit: "",
    },
    battery_critical_alerts: {
      color: "#FF3B30",
      bgColor: "#FF3B3015",
      label: "Critical Battery",
      unit: "",
    },
    power_off_alerts: {
      color: "#8B5CF6",
      bgColor: "#8B5CF615",
      label: "Power Off",
      unit: "",
    },
    battery_off_alerts: {
      color: "#6366F1",
      bgColor: "#6366F115",
      label: "Battery Off",
      unit: "",
    },
  };

  // Generate trend analysis for prediction and highest reach
  const trendAnalysis = data?.alertDatasets
    ? generateTrendAnalysis(data.alertDatasets, data.labels)
    : null;

  // Check if we have valid chart data for plotting
  const hasValidChartData =
    data &&
    data.datasets &&
    data.datasets[0] &&
    data.datasets[0].data &&
    data.datasets[0].data.length > 0;

  // Function to create simple alert chart data without complex predictions
  const createAlertChartData = (alertTimeSeriesData) => {
    if (
      !alertTimeSeriesData ||
      !alertTimeSeriesData.labels ||
      !alertTimeSeriesData.alertDatasets
    ) {
      return null;
    }

    const datasets = [];
    const labels = alertTimeSeriesData.labels || [];

    // Process each alert type and create clean datasets
    Object.entries(alertTimeSeriesData.alertDatasets).forEach(
      ([alertType, data]) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const config = alertConfigs[alertType];
          if (config) {
            datasets.push({
              data: data,
              color: () => config.color,
              strokeWidth: 2,
            });
          }
        }
      }
    );

    return { labels, datasets };
  };

  // Use alert chart data if available and no regular data
  let chartData = hasValidChartData ? data : createAlertChartData(data);
  const shouldRenderChart =
    hasValidChartData || (chartData && chartData.datasets);

  // Format labels for better date display
  if (chartData && chartData.labels && chartData.labels.length > 0) {
    chartData = {
      ...chartData,
      labels: chartData.labels.map((label, idx) => {
        if (formatLabel) return formatLabel(label, idx);
        // Try to auto-format if label looks like a date string
        if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
          const d = new Date(label);
          if (!isNaN(d)) {
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
  // Enhanced horizontal scroll for better UX - always scrollable for better experience
  const labelCount = chartData?.labels?.length || data?.labels?.length || 0;
  const minChartWidth = screenWidth - 32;
  const expandedChartWidth = Math.max(minChartWidth, labelCount * 85); // More space per label

  // Always allow scrolling if chart is requested to be scrollable or if content would benefit
  const shouldEnableScrolling = scrollable || labelCount > 4;
  const chartWidth = shouldEnableScrolling ? expandedChartWidth : minChartWidth;

  // Function to render simplified prediction and highest reach insights
  const renderAnalyticsInsights = () => {
    if (!trendAnalysis || (!showPrediction && !showHighestReach)) return null;

    const { predictions, highestReach } = trendAnalysis;
    const hasInsights =
      Object.keys(predictions).length > 0 ||
      Object.keys(highestReach).length > 0;

    if (!hasInsights) return null;

    return (
      <View
        style={[
          styles.insightsContainer,
          {
            backgroundColor: themeColors.surface || themeColors.card,
            borderColor: themeColors.border,
          },
        ]}
      >
        <View style={styles.insightsHeader}>
          <MaterialCommunityIcons
            name="chart-line-variant"
            size={20}
            color={themeColors.primary}
          />
          <Text style={[styles.insightsTitle, { color: themeColors.heading }]}>
            Smart Analytics
          </Text>
          <TouchableOpacity
            style={[
              styles.predictionToggle,
              {
                backgroundColor: showPredictions
                  ? themeColors.primary
                  : themeColors.border,
              },
            ]}
            onPress={() => setShowPredictions(!showPredictions)}
          >
            <MaterialCommunityIcons
              name={showPredictions ? "eye-off" : "eye"}
              size={16}
              color={showPredictions ? "#FFFFFF" : themeColors.text}
            />
            <Text
              style={[
                styles.toggleText,
                { color: showPredictions ? "#FFFFFF" : themeColors.text },
              ]}
            >
              {showPredictions ? "Hide" : "Show"} Details
            </Text>
          </TouchableOpacity>
        </View>

        {showPredictions && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightsScrollContainer}
          >
            {/* Highest Reach Cards */}
            {showHighestReach &&
              Object.entries(highestReach).map(([alertType, reach]) => {
                if (!reach || reach.value === 0) return null;
                const config = alertConfigs[alertType];
                if (!config) return null;

                return (
                  <View
                    key={`highest-${alertType}`}
                    style={[
                      styles.insightCard,
                      {
                        backgroundColor: config.bgColor,
                        borderLeftColor: config.color,
                      },
                    ]}
                  >
                    <View style={styles.insightHeader}>
                      <MaterialCommunityIcons
                        name="trending-up"
                        size={16}
                        color={config.color}
                      />
                      <Text
                        style={[styles.insightLabel, { color: config.color }]}
                      >
                        Peak {config.label}
                      </Text>
                    </View>
                    <Text
                      style={[styles.insightValue, { color: config.color }]}
                    >
                      {reach.value}
                    </Text>
                    <Text
                      style={[
                        styles.insightSubtext,
                        { color: themeColors.text },
                      ]}
                    >
                      Highest point
                    </Text>
                  </View>
                );
              })}

            {/* Simplified Prediction Cards */}
            {showPrediction &&
              Object.entries(predictions).map(([alertType, prediction]) => {
                if (
                  !prediction ||
                  !prediction.forecast ||
                  prediction.forecast.length === 0
                )
                  return null;
                const config = alertConfigs[alertType];
                if (!config) return null;

                const nextForecast = prediction.forecast[0];
                const trendIcon =
                  prediction.trend === "increasing"
                    ? "trending-up"
                    : "trending-down";
                const trendColor =
                  prediction.trend === "increasing" ? "#FF6B6B" : "#4ECDC4";

                return (
                  <View
                    key={`prediction-${alertType}`}
                    style={[
                      styles.insightCard,
                      {
                        backgroundColor: config.bgColor,
                        borderLeftColor: config.color,
                      },
                    ]}
                  >
                    <View style={styles.insightHeader}>
                      <MaterialCommunityIcons
                        name={trendIcon}
                        size={16}
                        color={trendColor}
                      />
                      <Text
                        style={[styles.insightLabel, { color: config.color }]}
                      >
                        {config.label} Trend
                      </Text>
                    </View>
                    <Text
                      style={[styles.insightValue, { color: config.color }]}
                    >
                      ~{Math.round(nextForecast)}
                    </Text>
                    <Text
                      style={[
                        styles.insightSubtext,
                        { color: themeColors.text },
                      ]}
                    >
                      Next forecast
                    </Text>
                  </View>
                );
              })}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderChart = () => {
    return (
      <LineChart
        data={chartData || data}
        width={chartWidth}
        height={220}
        withDots={true}
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
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: themeColors.primary,
            fill: themeColors.primary,
          },
          paddingLeft: 16,
          paddingRight: 16,
        }}
        style={styles.chart}
        transparent={true}
      />
    );
  };
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
      {/* Enhanced chart with horizontal scrolling - always wrap in ScrollView when scrollable */}
      {shouldRenderChart &&
        (shouldEnableScrolling ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chartScrollView}
            contentContainerStyle={styles.chartContentContainer}
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

      {/* Analytics Insights - Prediction & Highest Reach */}
      {renderAnalyticsInsights()}

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
    marginVertical: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  header: {
    marginBottom: 12,
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
    marginHorizontal: 0, // Remove negative margins that cause overflow
    overflow: "hidden", // Ensure content doesn't overflow
  },
  chartScrollView: {
    marginHorizontal: 0, // Remove negative margins
    overflow: "hidden", // Ensure content doesn't overflow
  },
  chartContentContainer: {
    paddingHorizontal: 8,
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
  // Analytics Insights Styles
  insightsContainer: {
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    letterSpacing: -0.3,
    flex: 1,
  },
  predictionToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  predictionIndicator: {
    position: "absolute",
    top: 10,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  predictionLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  insightsScrollContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
    gap: 12,
  },
  insightCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    alignItems: "center",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    textAlign: "center",
  },
  insightValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.7,
    textAlign: "center",
  },
});
