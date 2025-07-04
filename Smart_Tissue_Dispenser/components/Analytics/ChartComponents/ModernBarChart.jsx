
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Text as SvgText } from "react-native-svg";
import { useThemeContext } from "../../../context/ThemeContext";

const screenWidth = Dimensions.get("window").width - 40;

export const ModernBarChart = ({ data, title, showPercentage = false }) => {
  const { themeColors } = useThemeContext();
  const barWidth = 42;
  const chartHeight = 220;

  // Enhanced color palette for different alert types
  const alertColors = {
    empty: "#FF4757", // Red for empty
    low: "#FF9F00", // Orange for low
    full: "#10B981", // Green for full
    tamper: "#8B5CF6", // Purple for tamper
  };

  const barColors = [
    "#FF4757", // Red
    "#FF9F00", // Orange
    "#10B981", // Green
    "#8B5CF6", // Purple
    "#2D46E5", // Blue
    "#EC4899", // Pink
  ];

  // Determine chart color based on title content
  const getChartColor = () => {
    const titleLower = title?.toLowerCase() || "";
    if (titleLower.includes("empty")) return alertColors.empty;
    if (titleLower.includes("low")) return alertColors.low;
    if (titleLower.includes("full")) return alertColors.full;
    if (titleLower.includes("tamper")) return alertColors.tamper;
    return themeColors.primary;
  };

  const chartColor = getChartColor();

  // Handle empty or invalid data
  if (
    !data ||
    !data.datasets ||
    !data.datasets[0] ||
    !data.datasets[0].data ||
    data.datasets[0].data.length === 0
  ) {
    return (
      <View
        style={[
          styles.chartContainer,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            shadowColor: themeColors.shadow,
          },
        ]}
      >
        <View style={styles.chartHeader}>
          {title && (
            <Text style={[styles.chartTitle, { color: themeColors.heading }]}>
              {title}
            </Text>
          )}
        </View>
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyStateText,
              { color: themeColors.textSecondary },
            ]}
          >
            No data available for this selection
          </Text>
        </View>
      </View>
    );
  }

  const RoundedBarChart = ({ data, ...props }) => {
    return (
      <View>
        <BarChart
          {...props}
          data={{
            labels: data.labels || [],
            datasets: [
              {
                data: data.datasets[0].data || [],
              },
            ],
          }}
          width={screenWidth}
          height={chartHeight}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundGradientFrom: themeColors.surface,
            backgroundGradientTo: themeColors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => chartColor,
            labelColor: (opacity = 1) => themeColors.textSecondary,
            barPercentage: 0.7,
            fillShadowGradient: chartColor,
            fillShadowGradientOpacity: 1,
            propsForBackgroundLines: { strokeWidth: 0 },
            propsForLabels: {
              fontSize: 11,
              fontWeight: "600",
              fill: themeColors.textSecondary,
            },
            barRadius: 6,
            propsForVerticalLabels: {
              dy: 4,
            },
          }}
          verticalLabelRotation={0}
          style={styles.chart}
          showBarTops={false}
          showValuesOnTopOfBars={false}
          withInnerLines={false}
          withHorizontalLines={false}
          withVerticalLines={false}
          fromZero={true}
          decorator={() => {
            const maxValue = Math.max(...data.datasets[0].data, 1); // Prevent division by zero
            return data.datasets[0].data.map((value, index) => {
              const x =
                index * (screenWidth / data.labels.length) + barWidth / 2;
              const y =
                chartHeight - 30 - (value / maxValue) * (chartHeight - 60);
              return (
                <SvgText
                  key={index}
                  x={x}
                  y={y}
                  fill={themeColors.text}
                  fontSize="12"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {value}
                  {showPercentage ? "%" : ""}
                </SvgText>
              );
            });
          }}
        />
      </View>
    );
  };

  return (
    <View
      style={[
        styles.chartContainer,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          shadowColor: themeColors.shadow,
        },
      ]}
    >
      <View style={styles.chartHeader}>
        {title && (
          <Text style={[styles.chartTitle, { color: themeColors.heading }]}>
            {title}
          </Text>
        )}
      </View>
      <RoundedBarChart data={data} />
      <View style={styles.barLegendContainer}>
        {data.labels &&
          data.labels.map((label, index) => (
            <View key={index} style={styles.barLegendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      data.datasets[0].colors?.[index] ||
                      barColors[index] ||
                      chartColor,
                  },
                ]}
              />
              <View style={styles.barLegendTextContainer}>
                <Text
                  style={[styles.barLegendLabel, { color: themeColors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {label}
                </Text>
                <Text
                  style={[
                    styles.barLegendValue,
                    { color: themeColors.heading },
                  ]}
                >
                  {data.datasets[0].data[index] || 0}
                  {showPercentage ? "%" : ""}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    width: Dimensions.get("window").width, // Full width
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20, // Keep internal padding
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  chartHeader: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -20,
  },
  barLegendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  barLegendItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  barLegendTextContainer: {
    flex: 1,
  },
  barLegendLabel: {
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 1,
  },
  barLegendValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
