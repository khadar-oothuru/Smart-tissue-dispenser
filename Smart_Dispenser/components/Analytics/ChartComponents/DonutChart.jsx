import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { G, Path, Circle, Text as SvgText } from "react-native-svg";
import { useThemeContext } from "../../../context/ThemeContext";

// Get screen width for responsive charts
const screenWidth = Dimensions.get("window").width;
const CHART_SIZE = screenWidth - 100;
const RADIUS = CHART_SIZE / 2 - 40;
const STROKE_WIDTH = 36;

function safeNumber(val, fallback = 0) {
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((safeNumber(angleInDegrees) - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  if ([start.x, start.y, end.x, end.y, radius].some((val) => isNaN(val))) {
    return "";
  }

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export const DonutChart = ({ data, title, centerValue, centerLabel }) => {
  const { themeColors, isDark } = useThemeContext(); // Enhanced status colors with proper empty/full colors
  const statusColors = {
    Tamper: "#8B5CF6", // Purple for tamper alerts
    Empty: "#FF4757", // Red for empty alerts
    Low: "#FF9F00", // Orange for low alerts
    Full: "#10B981", // Green for full level
    // Battery alert types
    "Critical Battery": "#FF3B30", // Red for critical battery
    "Low Battery": "#FF9F00", // Orange for low battery
    "Medium Battery": "#FFD600", // Yellow for medium battery
    "Good Battery": "#10B981", // Green for good battery
    "Power Off": "#757575", // Gray for power off
    // Alternate naming conventions
    tamper: "#8B5CF6",
    empty: "#FF4757",
    low: "#FF9F00",
    full: "#10B981",
    "critical battery": "#FF3B30",
    "low battery": "#FF9F00",
    "medium battery": "#FFD600",
    "good battery": "#10B981",
    "power off": "#757575",
    // Extra fallback for any case variant
    POWER_OFF: "#757575",
    power_off: "#757575",
    Power_Off: "#757575",
  };
  const colors = isDark
    ? ["#8B5CF6", "#FF4757", "#FF9F00", "#10B981", "#757575"]
    : ["#8B5CF6", "#FF4757", "#FF9F00", "#10B981", "#757575"];
  // For Alert Distribution chart, ensure all four statuses are always shown
  const isAlertDistribution =
    title?.includes("Alert") || title?.includes("Distribution");
  // Map incoming data to expected format and validate
  let safeData = Array.isArray(data)
    ? data
        .map((item, i) => ({
          ...item,
          value: safeNumber(
            item.value !== undefined ? item.value : item.population
          ),
          name: item.name || `Item ${i + 1}`,
        }))
        .filter((item) => {
          // Allow both tissue-level statuses and battery alert types
          const allowedStatuses = [
            "tamper",
            "empty",
            "low",
            "full",
            "critical battery",
            "low battery",
            "medium battery",
            "good battery",
            "power off",
          ];
          const statusName = item.name?.toLowerCase();
          return allowedStatuses.includes(statusName);
        })
    : [];

  // For Alert Distribution, ensure all required statuses are present even if not in data
  if (isAlertDistribution) {
    // Check if this is battery alerts or tissue alerts based on data content
    const hasBatteryAlerts = safeData.some(
      (item) =>
        item.name?.toLowerCase().includes("battery") ||
        item.name?.toLowerCase().includes("power")
    );

    if (hasBatteryAlerts) {
      // Battery alert types
      const requiredStatuses = [
        "Critical Battery",
        "Low Battery",
        "Medium Battery",
        "Good Battery",
        "Power Off",
      ];
      const existingNames = safeData.map((item) => item.name);

      requiredStatuses.forEach((status) => {
        if (!existingNames.includes(status)) {
          safeData.push({
            name: status,
            value: 0,
            population: 0,
          });
        }
      });

      // Sort to ensure consistent order: Critical Battery, Low Battery, Medium Battery, Good Battery, Power Off
      safeData.sort((a, b) => {
        const order = [
          "Critical Battery",
          "Low Battery",
          "Medium Battery",
          "Good Battery",
          "Power Off",
        ];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
    } else {
      // Tissue alert types
      const requiredStatuses = ["Empty", "Low", "Full", "Tamper"];
      const existingNames = safeData.map((item) => item.name);

      requiredStatuses.forEach((status) => {
        if (!existingNames.includes(status)) {
          safeData.push({
            name: status,
            value: 0,
            population: 0,
          });
        }
      });

      // Sort to ensure consistent order: Empty, Low, Full, Tamper
      safeData.sort((a, b) => {
        const order = ["Empty", "Low", "Full", "Tamper"];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
    }
  }
  const total = safeData.reduce((sum, item) => sum + item.value, 0);

  if (!safeData.length) {
    return (
      <View style={styles.chartContainer}>
        <Text style={{ textAlign: "center", color: "#999", fontSize: 16 }}>
          No data available
        </Text>
      </View>
    );
  } // If total is 0 but we have allowed statuses, show them with equal visible proportions
  const displayData =
    total === 0
      ? safeData.map((item) => ({
          ...item,
          value:
            safeData.length === 4 ? 25 : safeData.length === 5 ? 20 : 33.33, // 25% each for 4 tissue statuses, 20% each for 5 battery statuses, 33.33% each for 3 statuses
        }))
      : safeData;

  const displayTotal = displayData.reduce((sum, item) => sum + item.value, 0);

  // Prepare data with angles
  let startAngle = 0;
  const chartData = displayData.map((item, i) => {
    const percentage = (item.value / displayTotal) * 100;
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;
    const midAngle = startAngle + angle / 2;
    // Use status-specific color if available, otherwise fallback to palette
    const color =
      item.color ||
      statusColors[item.name] ||
      statusColors[item.name?.toLowerCase()] ||
      colors[i % colors.length];
    const result = {
      ...item,
      percentage:
        total === 0
          ? 0
          : Math.round(
              ((safeData.find((d) => d.name === item.name)?.value || 0) /
                total) *
                100
            ), // Show actual percentage, not display percentage
      color,
      startAngle,
      endAngle,
      midAngle,
    };
    startAngle = endAngle;
    return result;
  });

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
      {title && (
        <Text style={[styles.chartTitle, { color: themeColors.heading }]}>
          {title}
        </Text>
      )}

      <View style={styles.donutWrapper}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          <G rotation="0" origin={`${CHART_SIZE / 2}, ${CHART_SIZE / 2}`}>
            {chartData.map((slice, i) => {
              const d = describeArc(
                CHART_SIZE / 2,
                CHART_SIZE / 2,
                RADIUS,
                slice.startAngle,
                slice.endAngle
              );
              if (!d) return null;
              return (
                <Path
                  key={i}
                  d={d}
                  stroke={slice.color}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
            {/* Center circle to make it a donut */}
            <Circle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS - STROKE_WIDTH / 2}
              fill={themeColors.surface}
            />
            {/* Percentage bubbles */}
            {chartData.map((slice, i) => {
              const labelRadius = RADIUS - STROKE_WIDTH / 2 + 22;
              const { x, y } = polarToCartesian(
                CHART_SIZE / 2,
                CHART_SIZE / 2,
                labelRadius,
                slice.midAngle
              );
              if ([x, y].some((val) => isNaN(val))) return null;

              // Check if this is a battery-related item for smaller font size
              const isBatteryItem =
                slice.name?.toLowerCase().includes("battery") ||
                slice.name?.toLowerCase().includes("power");
              const fontSize = isBatteryItem ? "12" : "15";

              return (
                <G key={i}>
                  <Circle
                    cx={x}
                    cy={y}
                    r={22}
                    fill="#fff"
                    stroke={slice.color}
                    strokeWidth={2}
                  />
                  <SvgText
                    x={x}
                    y={y + 6}
                    fontSize={fontSize}
                    fontWeight="bold"
                    fill="#222"
                    textAnchor="middle"
                  >
                    {slice.percentage}%
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
        {centerValue && (
          <View style={styles.donutCenter}>
            <Text style={[styles.centerValue, { color: themeColors.primary }]}>
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

      <View style={styles.legendContainer}>
        {chartData.map((item, index) => {
          // Check if this is a battery-related item for smaller font size
          const isBatteryItem =
            item.name?.toLowerCase().includes("battery") ||
            item.name?.toLowerCase().includes("power");
          const legendFontSize = isBatteryItem ? 14 : 17;

          return (
            <View key={index} style={[styles.legendItem, { minHeight: 32 }]}>
              {" "}
              {/* Make legend item bigger */}
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: item.color,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    marginRight: 12,
                  },
                ]}
              />
              <Text
                style={[
                  styles.legendText,
                  {
                    color: themeColors.text,
                    fontSize: legendFontSize,
                    fontWeight: "700",
                    marginRight: 10,
                    minWidth: 60,
                  },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 16,
    borderRadius: 24,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.1,
    elevation: 6,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  donutWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 4,
  },

  donutCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -45 }, { translateY: -25 }],
  },

  centerValue: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    includeFontPadding: false,
  },

  centerLabel: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.7,
    marginTop: 2,
  },
  legendContainer: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    width: "48%",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  legendText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginRight: 6,
  },

  legendPercentage: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 35,
    textAlign: "right",
  },
});
