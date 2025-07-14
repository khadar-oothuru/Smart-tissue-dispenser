import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../hooks/useThemeContext";
import { generateTrendAnalysis } from "../../utils/chartAnalytics";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  const { themeColors, isDark } = useTheme();
  const [showPredictions, setShowPredictions] = useState(false);

  // Register chart area background plugin (must be before any early return)
  React.useEffect(() => {
    const plugin = {
      id: "chartAreaBackground",
      beforeDraw: (chart) => {
        if (chart?.options?.plugins?.chartAreaBackground) {
          const { ctx, chartArea } = chart;
          ctx.save();
          ctx.fillStyle = chart.options.plugins.chartAreaBackground.color;
          ctx.fillRect(
            chartArea.left,
            chartArea.top,
            chartArea.right - chartArea.left,
            chartArea.bottom - chartArea.top
          );
          ctx.restore();
        }
      },
    };
    ChartJS.register(plugin);
    return () => {
      try {
        ChartJS.unregister(plugin);
      } catch {
        /* ignore */
      }
    };
  }, [isDark, themeColors.card]);

  // Alert configurations
  const alertConfigs = {
    // Tissue alerts
    tamper_alerts: {
      color: "#8B5CF6",
      bgColor: isDark ? "rgba(139, 92, 246, 0.25)" : "rgba(139, 92, 246, 0.08)",
      label: "Tamper",
      unit: "",
    },
    empty_alerts: {
      color: "#DC2626",
      bgColor: isDark ? "rgba(220, 38, 38, 0.25)" : "rgba(220, 38, 38, 0.08)",
      label: "Empty",
      unit: "",
    },
    low_alerts: {
      color: "#FF9800",
      bgColor: isDark ? "rgba(255, 152, 0, 0.25)" : "rgba(255, 152, 0, 0.08)",
      label: "Low",
      unit: "",
    },
    full_alerts: {
      color: "#4CAF50",
      bgColor: isDark ? "rgba(76, 175, 80, 0.25)" : "rgba(76, 175, 80, 0.08)",
      label: "Full",
      unit: "",
    },
    // Battery alerts
    battery_low_alerts: {
      color: "#FF9F00",
      bgColor: isDark ? "rgba(255, 159, 0, 0.25)" : "rgba(255, 159, 0, 0.08)",
      label: "Low Battery",
      unit: "",
    },
    battery_critical_alerts: {
      color: "#FF3B30",
      bgColor: isDark ? "rgba(255, 59, 48, 0.25)" : "rgba(255, 59, 48, 0.08)",
      label: "Critical Battery",
      unit: "",
    },
    power_off_alerts: {
      color: "#8B5CF6",
      bgColor: isDark ? "rgba(139, 92, 246, 0.25)" : "rgba(139, 92, 246, 0.08)",
      label: "Power Off",
      unit: "",
    },
    battery_off_alerts: {
      color: "#6366F1",
      bgColor: isDark ? "rgba(99, 102, 241, 0.25)" : "rgba(99, 102, 241, 0.08)",
      label: "Battery Off",
      unit: "",
    },
  };

  // Generate trend analysis
  const trendAnalysis = data?.alertDatasets
    ? generateTrendAnalysis(data.alertDatasets, data.labels)
    : null;

  // Check if we have valid chart data
  const hasValidChartData =
    data &&
    data.datasets &&
    data.datasets[0] &&
    data.datasets[0].data &&
    data.datasets[0].data.length > 0;

  // Create alert chart data
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

    Object.entries(alertTimeSeriesData.alertDatasets).forEach(
      ([alertType, data]) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const config = alertConfigs[alertType];
          if (config) {
            datasets.push({
              label: config.label,
              data: data,
              borderColor: config.color,
              backgroundColor: config.bgColor,
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            });
          }
        }
      }
    );

    return { labels, datasets };
  };

  let chartData = hasValidChartData ? data : createAlertChartData(data);
  const shouldRenderChart =
    hasValidChartData || (chartData && chartData.datasets);

  // Format labels
  if (chartData && chartData.labels && chartData.labels.length > 0) {
    chartData = {
      ...chartData,
      labels: chartData.labels.map((label, idx) => {
        if (formatLabel) return formatLabel(label, idx);
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
      <div
        className="my-4 rounded-3xl p-5 border border-gray-100 dark:border-gray-800"
        style={{ backgroundColor: themeColors.card }}
      >
        <p
          className="text-center py-10 text-base font-medium"
          style={{ color: themeColors.text }}
        >
          No data available
        </p>
      </div>
    );
  }

  // Calculate dynamic width based on data points
  const calculateChartWidth = () => {
    if (!chartData || !chartData.labels) return "100%";
    const dataPoints = chartData.labels.length;
    const minWidthPerPoint = 60; // Minimum pixels per data point
    const calculatedWidth = dataPoints * minWidthPerPoint;
    const minWidth = 800; // Minimum chart width
    return scrollable && calculatedWidth > minWidth ? calculatedWidth : "100%";
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark
          ? "rgba(0, 0, 0, 0.9)"
          : "rgba(255, 255, 255, 0.9)",
        titleColor: isDark ? "#fff" : "#000",
        bodyColor: isDark ? "#fff" : "#000",
        borderColor: themeColors.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
      // Add chart area background plugin
      chartAreaBackground: {
        color: isDark ? themeColors.card : "#fff",
      },
    },
    layout: {
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? "#E5E7EB" : themeColors.text,
          font: {
            size: 12,
            weight: "500",
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)",
          drawBorder: false,
        },
        ticks: {
          color: isDark ? "#E5E7EB" : themeColors.text,
          font: {
            size: 12,
            weight: "500",
          },
        },
      },
    },
  };

  // Render analytics insights
  const renderAnalyticsInsights = () => {
    if (!trendAnalysis || (!showPrediction && !showHighestReach)) return null;

    const { predictions, highestReach } = trendAnalysis;
    const hasInsights =
      Object.keys(predictions).length > 0 ||
      Object.keys(highestReach).length > 0;

    if (!hasInsights) return null;

    return (
      <div
        className="mt-5 mb-4 rounded-2xl p-4 border"
        style={{
          backgroundColor: themeColors.surface || themeColors.card,
          borderColor: themeColors.border,
          borderLeftWidth: "4px",
          borderLeftColor: themeColors.primary,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <TrendingUp
              className="w-5 h-5 mr-2"
              style={{ color: themeColors.primary }}
            />
            <h3
              className="text-base font-semibold tracking-tight"
              style={{ color: themeColors.heading }}
            >
              Smart Analytics
            </h3>
          </div>
          <button
            className="flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              backgroundColor: showPredictions
                ? themeColors.primary
                : themeColors.border,
              color: showPredictions ? "#FFFFFF" : themeColors.text,
            }}
            onClick={() => setShowPredictions(!showPredictions)}
          >
            {showPredictions ? (
              <EyeOff className="w-4 h-4 mr-1" />
            ) : (
              <Eye className="w-4 h-4 mr-1" />
            )}
            {showPredictions ? "Hide" : "Show"} Details
          </button>
        </div>

        {showPredictions && (
          <div className="overflow-x-auto -mx-4 px-4 hide-scrollbar">
            <div className="flex gap-3 pb-2">
              {/* Highest Reach Cards */}
              {showHighestReach &&
                Object.entries(highestReach).map(([alertType, reach]) => {
                  if (!reach || reach.value === 0) return null;
                  const config = alertConfigs[alertType];
                  if (!config) return null;
                  return (
                    <div
                      key={`highest-${alertType}`}
                      className="flex-shrink-0 w-36 p-3 rounded-xl border-l-4"
                      style={{
                        backgroundColor: config.bgColor,
                        borderLeftColor: config.color,
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <TrendingUp
                          className="w-4 h-4 mr-1"
                          style={{ color: config.color }}
                        />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: config.color }}
                        >
                          Peak {config.label}
                        </span>
                      </div>
                      <p
                        className="text-xl font-bold mb-1"
                        style={{ color: config.color }}
                      >
                        {reach.value}
                      </p>
                      <p
                        className="text-xs font-medium opacity-70"
                        style={{ color: themeColors.text }}
                      >
                        Highest point
                      </p>
                    </div>
                  );
                })}

              {/* Prediction Cards */}
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
                    prediction.trend === "increasing" ? (
                      <TrendingUp
                        className="w-4 h-4"
                        style={{ color: "#FF6B6B" }}
                      />
                    ) : (
                      <TrendingDown
                        className="w-4 h-4"
                        style={{ color: "#4ECDC4" }}
                      />
                    );

                  return (
                    <div
                      key={`prediction-${alertType}`}
                      className="flex-shrink-0 w-36 p-3                       rounded-xl border-l-4"
                      style={{
                        backgroundColor: config.bgColor,
                        borderLeftColor: config.color,
                      }}
                    >
                      <div className="flex items-center mb-2">
                        {trendIcon}
                        <span
                          className="text-xs font-semibold ml-1"
                          style={{ color: config.color }}
                        >
                          {config.label} Trend
                        </span>
                      </div>
                      <p
                        className="text-xl font-bold mb-1"
                        style={{ color: config.color }}
                      >
                        ~{Math.round(nextForecast)}
                      </p>
                      <p
                        className="text-xs font-medium opacity-70"
                        style={{ color: themeColors.text }}
                      >
                        Next forecast
                      </p>
                    </div>
                  );
                })}
            </div>
            {/* Hide scrollbar for Chrome, Safari, Opera */}
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .hide-scrollbar {
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none; /* IE 10+ */
              }
            `}</style>
          </div>
        )}
      </div>
    );
  };

  // Render scrollable chart
  const renderChart = () => {
    const chartWidth = calculateChartWidth();
    const isScrollable = scrollable && chartWidth !== "100%";

    return (
      <div
        className={`relative ${isScrollable ? "overflow-x-auto" : ""}`}
        style={{
          height: "300px",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "100%",
            width: isScrollable ? chartWidth : "100%",
            minWidth: isScrollable ? "100%" : "auto",
          }}
        >
          <div
            className="h-full w-full rounded-2xl shadow-lg border border-white/30 backdrop-blur-md relative overflow-hidden"
            style={{
              background: isDark
                ? // Match Smart Analytics card bg
                  themeColors.surface || themeColors.card
                : themeColors.surface || "#fff",
              borderColor: isDark
                ? themeColors.border
                : `${themeColors.primary}33`,
            }}
          >
            <Line
              data={chartData}
              options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  chartAreaBackground: {
                    color: "rgba(0,0,0,0)", // transparent so parent bg shows through
                  },
                },
                scales: {
                  ...options.scales,
                  x: {
                    ...options.scales.x,
                    ticks: {
                      ...options.scales.x.ticks,
                      color: isDark ? "#E5E7EB" : themeColors.text,
                      font: {
                        size: 12,
                        weight: "500",
                        family: "Inter, sans-serif",
                      },
                      padding: 8,
                      maxRotation: 45,
                      minRotation: 0,
                      autoSkip: false, // Show all labels when scrollable
                    },
                  },
                  y: {
                    ...options.scales.y,
                    ticks: {
                      ...options.scales.y.ticks,
                      color: isDark ? "#E5E7EB" : themeColors.text,
                      font: {
                        size: 12,
                        weight: "500",
                        family: "Inter, sans-serif",
                      },
                      padding: 8,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Scroll indicator */}
        {isScrollable && (
          <div
            className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.1)",
              color: isDark ? "#E5E7EB" : themeColors.text,
            }}
          >
            Scroll to view more →
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="my-6  p-6 "
      style={{
        // background: isDark
        //   ? // Custom alerts card dark gradient (example)
        //     "linear-gradient(135deg, #23272f 0%, #232b3e 100%)"
        //   : // Custom alerts card light gradient (example)
        //     "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        // borderColor: isDark ? "#23272f" : "#e5e7eb33",
      }}
    >
      {/* Header */}
      {title && (
        <div className="mb-5">
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: themeColors.heading }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-sm mt-1 opacity-80"
              style={{ color: themeColors.text }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart */}
      {shouldRenderChart && renderChart()}

      {/* Analytics Insights */}
      {renderAnalyticsInsights()}

      {/* Alert Macros */}
      {showMacros && alertData && (
        <div
          className="border-t pt-5 mt-6"
          style={{ borderTopColor: isDark ? themeColors.border : "#EEE" }}
        >
          <div
            className="overflow-x-auto -mx-6 px-6 hide-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              overflowX: "auto",
            }}
          >
            <div className="flex gap-4 pb-2">
              {Object.entries(alertConfigs).map(([alertType, config]) => {
                const alertCount = alertData[alertType] || 0;
                return (
                  <button
                    key={`alert-${alertType}`}
                    className="flex-shrink-0 rounded-2xl py-4 px-5 text-center transition-transform hover:scale-105 active:scale-95 shadow-md border border-white/30 backdrop-blur-sm"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, #23272f 0%, #181a20 100%)"
                        : `${config.bgColor}`,
                      minWidth: "100px",
                      borderColor: isDark ? "#23272f" : `${config.color}33`,
                    }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <div
                        className="w-3 h-3 rounded-full mr-2 border border-white/40"
                        style={{ backgroundColor: config.color }}
                      />
                      <span
                        className="text-lg font-bold"
                        style={{ color: config.color }}
                      >
                        {alertCount}
                      </span>
                    </div>
                    <p
                      className="text-xs font-semibold opacity-80"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </p>
                  </button>
                );
              })}
            </div>
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .hide-scrollbar {
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none; /* IE 10+ */
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Weekly Data Section */}
      {weeklyData && (
        <div
          className="mt-8 pt-6 border-t"
          style={{ borderTopColor: "rgba(0,0,0,0.1)" }}
        >
          <h3
            className="text-xl font-extrabold mb-5 px-1"
            style={{ color: themeColors.heading }}
          >
            Weekly Breakdown
          </h3>
          <div
            className="overflow-x-auto -mx-6 px-6 hide-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              overflowX: "auto",
            }}
          >
            <div className="flex gap-5 pb-2">
              {weeklyData.map((week, index) => (
                <div
                  key={`week-${index}`}
                  className="flex-shrink-0 w-44 p-5 rounded-2xl border border-white/30 shadow-md backdrop-blur-sm text-center"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, #23272f 0%, #181a20 100%)"
                      : `${themeColors.surface}`,
                    borderColor: isDark
                      ? "#23272f"
                      : `${themeColors.primary}33`,
                  }}
                >
                  <h4
                    className="text-base font-bold mb-2"
                    style={{ color: themeColors.heading }}
                  >
                    {week.week}
                  </h4>
                  <p
                    className="text-lg font-extrabold mb-3"
                    style={{ color: themeColors.primary }}
                  >
                    {week.total} Total
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {Object.entries(alertConfigs).map(([alertType, config]) => {
                      const count = week.alerts?.[alertType] || 0;
                      if (count === 0) return null;
                      return (
                        <div
                          key={alertType}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/20"
                          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          <span
                            className="text-xs font-medium"
                            style={{ color: themeColors.text }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};
