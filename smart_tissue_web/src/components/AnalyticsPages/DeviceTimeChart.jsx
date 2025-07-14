import React from "react";
import { HiOutlineDeviceTablet } from "react-icons/hi";
import { useTheme } from "../../hooks/useThemeContext";
import { AreaLineChart } from "./AreaLineChart";
import {
  formatChartDate,
  generateSequentialDates,
} from "../../utils/chartDateUtils";

const DeviceTimeChart = ({ deviceData, alertType = "tissue" }) => {
  const { themeColors, isDark } = useTheme();

  React.useEffect(() => {
    if (deviceData?.periods && deviceData.periods.length > 0) {
      // Debug logging if needed
    }
  }, [deviceData, alertType]);

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

  const getAlertTrendsData = () => {
    if (!deviceData?.periods || !Array.isArray(deviceData.periods)) {
      return null;
    }

    const periods = deviceData.periods;
    if (periods.length === 0) {
      return null;
    }

    // Use the same date label logic as in device-details.jsx for consistency
    let labels = periods.map((period, index) => {
      // Try to parse as date string (YYYY-MM-DD or ISO)
      if (period.period && /^\d{4}-\d{2}-\d{2}/.test(period.period)) {
        const d = new Date(period.period);
        if (!isNaN(d)) {
          return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
          });
        }
      }
      // Fallback to period_name or period
      return period.period_name || period.period || `Period ${index + 1}`;
    });

    // If all labels are the same, try to generate sequential dates (for e.g. weekly/monthly)
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
      const batteryLowAlerts = periods.map(
        (period) => period.battery_low_alerts || 0
      );
      const batteryCriticalAlerts = periods.map(
        (period) => period.battery_critical_alerts || 0
      );
      const powerOffAlerts = periods.map(
        (period) => period.power_off_alerts || 0
      );
      const batteryOffAlerts = periods.map(
        (period) => period.battery_off_alerts || 0
      );

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
      const batteryOffConfig = { color: "#6366F1" };

      return {
        labels,
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
      const lowAlerts = periods.map((period) => period.low_alerts || 0);
      const emptyAlerts = periods.map((period) => period.empty_alerts || 0);
      const fullAlerts = periods.map((period) => period.full_alerts || 0);
      const tamperAlerts = periods.map((period) => period.tamper_alerts || 0);

      const totalLowAlerts = lowAlerts.reduce((a, b) => a + b, 0);
      const totalEmptyAlerts = emptyAlerts.reduce((a, b) => a + b, 0);
      const totalFullAlerts = fullAlerts.reduce((a, b) => a + b, 0);
      const totalTamperAlerts = tamperAlerts.reduce((a, b) => a + b, 0);

      const tamperConfig = getDeviceStatusConfig("tamper", null, isDark);
      const lowConfig = getDeviceStatusConfig("low", null, isDark);
      const emptyConfig = getDeviceStatusConfig("empty", null, isDark);
      const fullConfig = getDeviceStatusConfig("full", null, isDark);

      return {
        labels,
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
    <div
      className="mx-4 mb-6 rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-md relative"
      style={{
        background: isDark
          ? themeColors.surface || themeColors.card
          : themeColors.surface || "#fff",
        borderColor: isDark ? themeColors.border : "#e5e7eb33",
      }}
    >
      {/* Device Header */}
      <div className="relative flex items-center px-6 py-5">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mr-4 shadow-md border border-white/30 backdrop-blur-sm"
          style={{
            background: `${themeColors.primary}18`,
            borderColor: `${themeColors.primary}33`,
          }}
        >
          <HiOutlineDeviceTablet size={30} color={themeColors.primary} />
        </div>
        <div className="flex-1">
          <h3
            className="text-xl font-extrabold tracking-tight mb-0.5"
            style={{ color: themeColors.heading }}
          >
            {deviceData.device_name || `Device ${deviceData.device_id}`}
          </h3>
          <p
            className="text-sm font-medium opacity-80"
            style={{ color: `${themeColors.text}99` }}
          >
            Room {deviceData.room} • Floor {deviceData.floor}
          </p>
        </div>
      </div>

      {deviceData.periods.length > 0 && (
        <>
          {getAlertTrendsData() ? (
            <div className="mb-3">
              {(() => {
                const chartData = getAlertTrendsData();
                return (
                  <div
                    className="rounded-3xl p-2 mb-2"
                    style={{ background: "transparent" }}
                  >
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
                      formatLabel={(label, idx) => label}
                    />
                  </div>
                );
              })()}

              {/* Macros Grid */}
              {(() => {
                const chartData = getAlertTrendsData();
                return (
                  chartData?.macros &&
                  chartData.macros.length > 0 && (
                    <div className="mt-3 px-6 pb-5">
                      <div className="grid grid-cols-2 gap-3">
                        {chartData.macros.map((macro, index) => (
                          <div
                            key={index}
                            className="relative flex flex-col items-center py-2 px-2 rounded-xl border shadow-md backdrop-blur-[8px]"
                            style={{
                              background: isDark
                                ? "rgba(35, 39, 47, 0.32)"
                                : "rgba(255, 255, 255, 0.32)",
                              borderColor: isDark
                                ? "rgba(255,255,255,0.08)"
                                : `${macro.color}18`,
                              boxShadow: isDark
                                ? "0 2px 10px 0 rgba(0,0,0,0.18)"
                                : "0 2px 10px 0 rgba(180,180,255,0.07)",
                              backdropFilter: "blur(8px)",
                              WebkitBackdropFilter: "blur(8px)",
                            }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full mb-1 shadow-sm relative border border-white/40"
                              style={{ backgroundColor: macro.color }}
                            />
                            <span
                              className="text-base font-extrabold mb-0.5 tracking-tighter relative"
                              style={{
                                color: isDark
                                  ? themeColors.heading
                                  : macro.color,
                              }}
                            >
                              {macro.value}
                            </span>
                            <span
                              className="text-[9px] font-semibold text-center opacity-90 relative"
                              style={{ color: themeColors.text }}
                            >
                              {macro.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
          ) : (
            <div className="mb-3">
              <AreaLineChart
                data={{
                  labels: deviceData.periods.slice(-6).map((p) => {
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeviceTimeChart;
