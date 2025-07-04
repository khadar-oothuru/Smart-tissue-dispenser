import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";
import { formatChartDate } from "../../utils/chartDateUtils";

const AlertBreakdown = ({ periods, alertType = "tissue" }) => {
  const { themeColors, isDark } = useThemeContext();
  // Function to format date range from period name using our chart date utility
  const formatDateRange = (period, index = 0) => {
    // Use the same formatting logic as charts for consistency, passing the index for uniqueness
    const formattedDate = formatChartDate(
      period.period_name,
      period.period,
      index
    );

    // For weekly periods, try to show date range if we can parse the week properly
    if (
      period.period_name &&
      period.period_name.includes("Week") &&
      formattedDate !== "Jul 2"
    ) {
      const year = parseInt(period.period_name.match(/\d{4}/)?.[0] || "2025");
      const week = parseInt(period.period_name.match(/W(\d+)/)?.[1] || "1");

      try {
        // Calculate the start date of the week (assuming Monday as start)
        const startDate = new Date(year, 0, 1 + (week - 1) * 7);
        const day = startDate.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        startDate.setDate(startDate.getDate() + mondayOffset);

        // Apply index offset to ensure uniqueness across periods
        startDate.setDate(startDate.getDate() + index * 7);

        // Calculate end date (Sunday)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const formatDate = (date) => {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        };

        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      } catch (_error) {
        return formattedDate;
      }
    }

    // For all other periods or if weekly parsing fails, use the formatted date with index
    return formattedDate;
  };

  const alertConfigs = {
    // Tissue alerts
    tamper_alerts: {
      color: "#8B5CF6",
      bgColor: "#8B5CF615",
      icon: "alert-octagon",
      label: "Tamper",
    },
    empty_alerts: {
      color: "#DC2626",
      bgColor: "#DC262615",
      icon: "close-circle-outline",
      label: "Empty",
    },
    low_alerts: {
      color: "#FF9800",
      bgColor: "#FF980015",
      icon: "archive-outline",
      label: "Low",
    },
    full_alerts: {
      color: "#4CAF50",
      bgColor: "#4CAF5015",
      icon: "archive",
      label: "Full",
    },
    // Battery alerts
    battery_low_alerts: {
      color: "#FF9F00",
      bgColor: "#FF9F0015",
      icon: "battery-30",
      label: "Low Battery",
    },
    battery_critical_alerts: {
      color: "#FF3B30",
      bgColor: "#FF3B3015",
      icon: "battery-alert-variant-outline",
      label: "Critical Battery",
    },
    battery_off_alerts: {
      color: "#6366F1",
      bgColor: "#6366F115",
      icon: "battery-off-outline",
      label: "Battery Off",
    },
    power_off_alerts: {
      color: "#8B5CF6",
      bgColor: "#8B5CF615",
      icon: "power",
      label: "Power Off",
    },
  };

  // Filter alert configs based on selected alert type
  const getFilteredAlertConfigs = () => {
    if (alertType === "battery") {
      return {
        battery_off_alerts: alertConfigs.battery_off_alerts,
        battery_critical_alerts: alertConfigs.battery_critical_alerts,
        battery_low_alerts: alertConfigs.battery_low_alerts,
        power_off_alerts: alertConfigs.power_off_alerts,
      };
    } else {
      return {
        tamper_alerts: alertConfigs.tamper_alerts,
        empty_alerts: alertConfigs.empty_alerts,
        low_alerts: alertConfigs.low_alerts,
        full_alerts: alertConfigs.full_alerts,
      };
    }
  };

  const filteredAlertConfigs = getFilteredAlertConfigs();

  return (
    <View style={styles.glassContainer}>
      <View style={styles.header}>
        <Text style={[styles.glassTitle, { color: themeColors.heading }]}>
          {alertType === "battery" ? "Battery" : "Tissue"} Alert Breakdown
        </Text>
        <Text
          style={[styles.glassSubtitle, { color: themeColors.text + "80" }]}
        >
          By period and severity
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodsScrollContainer}
      >
        {periods.map((period, idx) => (
          <View
            key={idx}
            style={[
              styles.glassPeriodCard,
              {
                backgroundColor: isDark
                  ? themeColors.surface
                  : themeColors.background,
                borderColor: isDark
                  ? themeColors.border
                  : "rgba(255, 255, 255, 0.2)",
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

            <View style={styles.glassPeriodHeader}>
              <View style={styles.periodTitleContainer}>
                <Text
                  style={[
                    styles.glassPeriodName,
                    { color: themeColors.heading },
                  ]}
                >
                  {period.period_name}
                </Text>
                <Text
                  style={[
                    styles.glassDateRange,
                    { color: themeColors.text + "80" },
                  ]}
                >
                  {formatDateRange(period, idx)}
                </Text>
              </View>
              <View
                style={[
                  styles.glassTotalBadge,
                  { backgroundColor: themeColors.primary + "18" },
                ]}
              >
                <Text
                  style={[
                    styles.glassTotalCount,
                    { color: themeColors.primary },
                  ]}
                >
                  {period.total_entries}
                </Text>
                <Text
                  style={[
                    styles.glassTotalLabel,
                    { color: themeColors.primary + "CC" },
                  ]}
                >
                  Total
                </Text>
              </View>
            </View>

            <View style={styles.glassAlertsGrid}>
              {Object.entries(filteredAlertConfigs).map(([key, config]) => {
                const count = period[key] || 0;
                return (
                  <View
                    key={key}
                    style={[
                      styles.glassAlertItem,
                      {
                        backgroundColor: isDark
                          ? config.bgColor
                          : config.bgColor,
                        borderColor: isDark
                          ? config.color + "30"
                          : config.color + "20",
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? [config.bgColor, config.color + "05"]
                          : [config.color + "10", config.color + "05"]
                      }
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />

                    <View
                      style={[
                        styles.alertIconContainer,
                        { backgroundColor: config.color + "18" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={config.icon}
                        size={18}
                        color={config.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.glassAlertCount,
                        { color: isDark ? themeColors.heading : config.color },
                      ]}
                    >
                      {count}
                    </Text>
                    <Text
                      style={[
                        styles.glassAlertType,
                        { color: themeColors.text + "CC" },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Glass-Style Container
  glassContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  header: {
    marginBottom: 12,
  },
  glassTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  glassSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  periodsScrollContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
    gap: 16,
  },

  // Glass-Style Period Card
  glassPeriodCard: {
    width: 340,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  glassPeriodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  periodTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  glassPeriodName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  glassDateRange: {
    fontSize: 12,
    fontWeight: "600",
  },
  glassTotalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  glassTotalCount: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  glassTotalLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Glass-Style Alerts Grid
  glassAlertsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  glassAlertItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    minHeight: 90,
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
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  glassAlertCount: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  glassAlertType: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },

  // Legacy styles (keeping for compatibility)
  container: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  periodCard: {
    width: 320,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  periodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  periodName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 12,
    fontWeight: "400",
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  totalCount: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalLabel: {
    fontSize: 12,
  },
  alertsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  alertItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    minHeight: 80,
  },
  alertCount: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 4,
  },
  alertType: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default AlertBreakdown;
