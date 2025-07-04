// components/Analytics/ChartComponents.js
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useThemeContext } from "../../context/ThemeContext";

const screenWidth = Dimensions.get("window").width;

// Chart config factory function
const createChartConfig = (themeColors, isDark) => ({
  backgroundGradientFrom: themeColors.background,
  backgroundGradientTo: themeColors.background,
  decimalPlaces: 0,
  color: (opacity = 1) =>
    isDark
      ? `rgba(248, 83, 6, ${opacity})` // Using your dark theme primary color
      : `rgba(58, 176, 255, ${opacity})`, // Using your light theme primary color
  labelColor: (opacity = 1) =>
    isDark
      ? `rgba(209, 209, 209, ${opacity})` // Using your dark theme text color
      : `rgba(123, 132, 147, ${opacity})`, // Using your light theme text color
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: themeColors.primary,
    fill: themeColors.background,
  },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: isDark ? themeColors.border : "#F2F2F7",
    strokeWidth: 1,
  },
});

// Modern Donut Chart
export const DonutChart = ({ data, title, centerValue, centerLabel }) => {
  const { themeColors, isDark } = useThemeContext();
  // Updated colors for new status system: tamper, empty, low, full
  const colors = isDark
    ? ["#8B5CF6", "#DC2626", "#FF9800", "#4CAF50", "#3B82F6", "#10B981"]
    : ["#8B5CF6", "#DC2626", "#FF9800", "#4CAF50", "#3B82F6", "#10B981"];

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
    legendFontColor: themeColors.text,
    legendFontSize: 15,
    legendFontWeight: "600",
  }));

  return (
    <View
      style={[
        styles.chartContainer,
        {
          backgroundColor: isDark
            ? themeColors.surface
            : themeColors.background,
          shadowColor: isDark ? "#000" : "#000",
          shadowOpacity: isDark ? 0.2 : 0.06,
        },
      ]}
    >
      {title && (
        <Text style={[styles.chartTitle, { color: themeColors.heading }]}>
          {title}
        </Text>
      )}
      <View style={styles.donutWrapper}>
        <PieChart
          data={chartData}
          width={screenWidth - 64}
          height={260}
          chartConfig={{
            ...createChartConfig(themeColors, isDark),
            color: (opacity = 1) => themeColors.primary,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          hasLegend={false}
          absolute
          style={styles.chart}
          innerRadius="70%"
        />
        {centerValue && (
          <View style={styles.donutCenter}>
            <Text style={[styles.centerValue, { color: themeColors.heading }]}>
              {centerValue}
            </Text>
            {centerLabel && (
              <Text style={[styles.centerLabel, { color: themeColors.text }]}>
                {centerLabel}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Custom Legend */}
      <View style={styles.legendContainer}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: themeColors.heading }]}>
              {item.name}
            </Text>
            {item.percentage && (
              <Text
                style={[styles.legendPercentage, { color: themeColors.text }]}
              >
                {item.percentage}%
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// Modern Bar Chart with rounded bars
export const ModernBarChart = ({ data, title, showPercentage = true }) => {
  const { themeColors, isDark } = useThemeContext();

  const RoundedBarChart = ({ data, ...props }) => {
    const barWidth = 60;
    const barRadius = 20;

    return (
      <View>
        <BarChart
          {...props}
          data={data}
          width={screenWidth - 32}
          height={280}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundGradientFrom: themeColors.background,
            backgroundGradientTo: themeColors.background,
            decimalPlaces: 0,
            color: (opacity = 1) => themeColors.primary,
            labelColor: (opacity = 1) => themeColors.text,
            barPercentage: 0.7,
            fillShadowGradient: themeColors.primary,
            fillShadowGradientOpacity: 1,
            propsForBackgroundLines: {
              strokeWidth: 0,
            },
            propsForLabels: {
              fontSize: 0, // Hide default labels
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
            return data.datasets[0].data.map((value, index) => (
              <View key={index}>
                {showPercentage && (
                  <SvgText
                    x={
                      index * ((screenWidth - 32) / data.labels.length) +
                      barWidth / 2
                    }
                    y={220 - (value / 100) * 200 - 10}
                    fill="white"
                    fontSize="16"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {value}%
                  </SvgText>
                )}
              </View>
            ));
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
          backgroundColor: isDark
            ? themeColors.surface
            : themeColors.background,
          shadowColor: isDark ? "#000" : "#000",
          shadowOpacity: isDark ? 0.2 : 0.06,
        },
      ]}
    >
      {title && (
        <Text style={[styles.chartTitle, { color: themeColors.heading }]}>
          {title}
        </Text>
      )}
      <RoundedBarChart data={data} />

      {/* Custom Legend */}
      <View
        style={[
          styles.barLegendContainer,
          { borderTopColor: isDark ? themeColors.border : "#F2F2F7" },
        ]}
      >
        {data.legend &&
          data.legend.map((item, index) => (
            <View key={index} style={styles.barLegendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: item.color }]}
              />
              <View style={styles.barLegendTextContainer}>
                <Text
                  style={[
                    styles.barLegendLabel,
                    { color: themeColors.heading },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.barLegendValue, { color: themeColors.text }]}
                >
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </View>
  );
};

// Area Line Chart with gradient fill
export const AreaLineChart = ({ data, title, subtitle, showMacros = true }) => {
  const { themeColors, isDark } = useThemeContext();

  return (
    <View
      style={[
        styles.chartContainer,
        {
          backgroundColor: isDark
            ? themeColors.surface
            : themeColors.background,
          shadowColor: isDark ? "#000" : "#000",
          shadowOpacity: isDark ? 0.2 : 0.06,
        },
      ]}
    >
      <View style={styles.chartHeader}>
        {title && (
          <Text style={[styles.chartTitle, { color: themeColors.heading }]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.chartSubtitle, { color: themeColors.text }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <LineChart
        data={data}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundGradientFrom: themeColors.background,
          backgroundGradientTo: themeColors.background,
          fillShadowGradientFrom: themeColors.primary,
          fillShadowGradientTo: isDark ? themeColors.surface : "#FFE4CC",
          fillShadowGradientFromOpacity: 0.6,
          fillShadowGradientToOpacity: 0.1,
          color: (opacity = 1) => themeColors.primary,
          labelColor: (opacity = 1) => themeColors.text,
          strokeWidth: 3,
          propsForBackgroundLines: {
            stroke: isDark ? themeColors.border : "#F2F2F7",
            strokeWidth: 1,
            strokeDasharray: "0",
          },
          propsForDots: {
            r: "0", // Hide dots for cleaner look
          },
          propsForLabels: {
            fontSize: 12,
            fontWeight: "400",
          },
        }}
        bezier
        style={styles.chart}
        withDots={false}
        withShadow={false}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        fromZero={true}
        segments={4}
        transparent={true}
      />

      {/* Macro indicators */}
      {showMacros && data.macros && (
        <View
          style={[
            styles.macroContainer,
            { borderTopColor: isDark ? themeColors.border : "#F2F2F7" },
          ]}
        >
          {data.macros.map((macro, index) => (
            <View key={index} style={styles.macroItem}>
              <View style={styles.macroRow}>
                <View
                  style={[styles.macroDot, { backgroundColor: macro.color }]}
                />
                <Text
                  style={[styles.macroValue, { color: themeColors.heading }]}
                >
                  {macro.value}g
                </Text>
              </View>
              <Text style={[styles.macroLabel, { color: themeColors.text }]}>
                {macro.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Continuing from StatCard...
export const StatCard = ({ value, label, icon, color }) => {
  const { themeColors, isDark } = useThemeContext();

  return (
    <View
      style={[statStyles.container, { backgroundColor: themeColors.inputbg }]}
    >
      {icon && <View style={statStyles.iconContainer}>{icon}</View>}
      <Text style={[statStyles.value, { color: color || themeColors.heading }]}>
        {value}
      </Text>
      <Text style={[statStyles.label, { color: themeColors.text }]}>
        {label}
      </Text>
    </View>
  );
};

// Progress Ring Component
export const ProgressRing = ({
  progress,
  size = 200,
  strokeWidth = 20,
  color,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const ringColor = color || themeColors.primary;

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Background circle */}
        <Svg.Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? themeColors.border : "#F2F2F7"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Svg.Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={progressStyles.centerContent}>
        <Text
          style={[progressStyles.progressText, { color: themeColors.heading }]}
        >
          {progress}%
        </Text>
      </View>
    </View>
  );
};

// Metric Summary Component
export const MetricSummary = ({ title, value, unit, trend, trendValue }) => {
  const { themeColors, isDark } = useThemeContext();

  return (
    <View
      style={[
        metricStyles.container,
        {
          backgroundColor: isDark
            ? themeColors.surface
            : themeColors.background,
          shadowColor: isDark ? "#000" : "#000",
          shadowOpacity: isDark ? 0.2 : 0.04,
        },
      ]}
    >
      <Text style={[metricStyles.title, { color: themeColors.text }]}>
        {title}
      </Text>
      <View style={metricStyles.valueContainer}>
        <Text style={[metricStyles.value, { color: themeColors.heading }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[metricStyles.unit, { color: themeColors.text }]}>
            {unit}
          </Text>
        )}
      </View>
      {trend && (
        <View style={metricStyles.trendContainer}>
          <View
            style={[
              metricStyles.trendIcon,
              {
                backgroundColor: trend === "up" ? "#34C759" : "#FF3B30",
              },
            ]}
          >
            <Text style={metricStyles.trendArrow}>
              {trend === "up" ? "↑" : "↓"}
            </Text>
          </View>
          <Text style={[metricStyles.trendValue, { color: themeColors.text }]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
};

// Custom component for rounded bars (optional enhancement)
export const RoundedBar = ({ x, y, width, height, color }) => {
  const { themeColors } = useThemeContext();
  const radius = Math.min(width / 2, 20);

  return (
    <Svg>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color || themeColors.primary}
        rx={radius}
        ry={radius}
      />
    </Svg>
  );
};

// Updated styles
const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 12,
    borderRadius: 24,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  chartSubtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  chart: {
    borderRadius: 16,
    marginHorizontal: -10,
  },
  donutWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerValue: {
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
  },
  centerLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  legendContainer: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  legendPercentage: {
    fontSize: 16,
    fontWeight: "600",
  },
  barLegendContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  barLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  barLegendTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barLegendLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  barLegendValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  macroContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
});

const statStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    minWidth: 100,
    marginHorizontal: 6,
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});

const progressStyles = StyleSheet.create({
  centerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 36,
    fontWeight: "700",
  },
});

const metricStyles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  value: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 18,
    marginLeft: 4,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  trendIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  trendArrow: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  trendValue: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default {
  DonutChart,
  ModernBarChart,
  AreaLineChart,
  StatCard,
  ProgressRing,
  MetricSummary,
  RoundedBar,
};

//? for this code i want modifycations like modern ui and in that donut those text will be side shown and for that  modern chart and bar chart will be like rounded bars and donut chart will be like 3d effect and animations and also legend will be like cards and also download buttons will be like modern ui with icons and also i want to add some more features like dark mode and light mode in that chart components and also i want to add some more features like dark mode and light mode in that chart components and shown name of the devices in that top 5 devices name shown there  write a code for this now and update properly and give me a whole code to me
