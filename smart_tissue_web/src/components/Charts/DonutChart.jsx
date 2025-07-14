// components/Charts/DonutChart.jsx
import React from "react";
import useTheme from "../../hooks/useThemeContext";

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

const DonutChart = ({ data, title, centerValue, centerLabel, size = 300 }) => {
  const { themeColors, isDark } = useTheme();
  
  const CHART_SIZE = size;
  const RADIUS = CHART_SIZE / 2 - 40;
  const STROKE_WIDTH = 36;

  // Enhanced status colors with proper empty/full colors
  const statusColors = {
    Tamper: "#8B5CF6", // Purple for tamper alerts
    Empty: "#FF4757", // Red for empty alerts
    Low: "#FF9F00", // Orange for low alerts
    Full: "#10B981", // Green for full level
    // Battery alert types
    "Battery Off": "#8B5CF6", // Purple for battery off
    "Critical Battery": "#FF3B30", // Red for critical battery
    "Low Battery": "#FF9F00", // Orange for low battery
    "Medium Battery": "#FFD600", // Yellow for medium battery
    "Good Battery": "#10B981", // Green for good battery
    "No Power": "#6B46C1", // Dark purple for no power
    "Power Off": "#757575", // Gray for power off (legacy)
    // Alternate naming conventions
    tamper: "#8B5CF6",
    empty: "#FF4757",
    low: "#FF9F00",
    full: "#10B981",
    "battery off": "#8B5CF6",
    "critical battery": "#FF3B30",
    "low battery": "#FF9F00",
    "medium battery": "#FFD600",
    "good battery": "#10B981",
    "no power": "#6B46C1",
    "power off": "#757575",
    // Extra fallback for any case variant
    BATTERY_OFF: "#8B5CF6",
    battery_off: "#8B5CF6",
    Battery_Off: "#8B5CF6",
    NO_POWER: "#6B46C1",
    no_power: "#6B46C1",
    No_Power: "#6B46C1",
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
            "battery off",
            "critical battery",
            "low battery",
            "medium battery",
            "good battery",
            "no power",
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
        "Battery Off",
        "Critical Battery",
        "Low Battery",
        "Medium Battery",
        "Good Battery",
        "No Power",
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

      // Sort to ensure consistent order
      safeData.sort((a, b) => {
        const order = [
          "Battery Off",
          "Critical Battery",
          "Low Battery",
          "Medium Battery",
          "Good Battery",
          "No Power",
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
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500 dark:text-gray-400 text-base">No data available</p>
      </div>
    );
  }

  // If total is 0 but we have allowed statuses, show them with equal visible proportions
  const displayData =
    total === 0
      ? safeData.map((item) => ({
          ...item,
          value:
            safeData.length === 4 ? 25 : safeData.length === 5 ? 20 : 33.33,
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
            ),
      color,
      startAngle,
      endAngle,
      midAngle,
    };
    startAngle = endAngle;
    return result;
  });

  return (
    <div
      className="my-4 rounded-3xl p-4 shadow-lg border transition-all duration-300"
      style={{
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        boxShadow: `0 4px 12px ${themeColors.shadow}20`,
      }}
    >
      {title && (
        <h3
          className="text-xl font-extrabold text-center mb-2"
          style={{ 
            color: themeColors.heading, 
            letterSpacing: "-0.5px" 
          }}
        >
          {title}
        </h3>
      )}

      <div className="flex items-center justify-center relative my-1">
        <svg width={CHART_SIZE} height={CHART_SIZE}>
          <g transform={`translate(0, 0)`}>
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
                <path
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
            <circle
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
              const fontSize = isBatteryItem ? 12 : 15;

              return (
                <g key={`label-${i}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={22}
                    fill="#fff"
                    stroke={slice.color}
                    strokeWidth={2}
                  />
                  <text
                    x={x}
                    y={y + 6}
                    fontSize={fontSize}
                    fontWeight="bold"
                    fill="#222"
                    textAnchor="middle"
                  >
                    {slice.percentage}%
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {centerValue && (
          <div className="absolute flex flex-col items-center justify-center">
            <div
              className="text-3xl font-extrabold"
              style={{ 
                color: themeColors.primary, 
                letterSpacing: "-0.5px" 
              }}
            >
              {centerValue}
            </div>
            {centerLabel && (
              <div
                className="text-sm font-medium opacity-70 mt-1"
                style={{ color: themeColors.text }}
              >
                {centerLabel}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-between px-1">
        {chartData.map((item, index) => {
          // Check if this is a battery-related item for smaller font size
          const isBatteryItem =
            item.name?.toLowerCase().includes("battery") ||
            item.name?.toLowerCase().includes("power");
          const legendFontSize = isBatteryItem ? "14px" : "17px";

          return (
            <div
              key={index}
              className="flex items-center w-1/2 mb-1.5 py-0.5 px-1"
              style={{ minHeight: "32px" }}
            >
              <div
                className="mr-3"
                style={{
                  backgroundColor: item.color,
                  width: "18px",
                  height: "18px",
                  borderRadius: "9px",
                                }}
              />
              <span
                className="font-bold truncate"
                style={{
                  color: themeColors.text,
                  fontSize: legendFontSize,
                  minWidth: "60px",
                }}
              >
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonutChart;