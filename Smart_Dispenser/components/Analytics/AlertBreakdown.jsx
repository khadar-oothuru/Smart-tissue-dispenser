import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";

const AlertBreakdown = ({ periods }) => {
  const { themeColors, isDarkMode } = useThemeContext();

  // Function to format date range from period name
  const formatDateRange = (periodName) => {
    // If it's a week format like "Week 2025-W24"
    if (periodName.includes("W")) {
      const year = parseInt(periodName.match(/\d{4}/)?.[0] || "2025");
      const week = parseInt(periodName.match(/W(\d+)/)?.[1] || "1");

      // Calculate the start date of the week (assuming Monday as start)
      const startDate = new Date(year, 0, 1 + (week - 1) * 7);
      const day = startDate.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      startDate.setDate(startDate.getDate() + mondayOffset);

      // Calculate end date (Sunday)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      const formatDate = (date) => {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const month = months[date.getMonth()];
        const day = date.getDate();
        return `${month} ${day}`;
      };

      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    // For other formats, return as is
    return periodName;
  };

  const alertConfigs = {
    tamper_alerts: {
      color: "#8B5CF6",
      bgColor: "#8B5CF615",
      icon: "warning",
      label: "Tamper",
    },
    empty_alerts: {
      color: "#DC2626",
      bgColor: "#DC262615",
      icon: "close-circle",
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.heading }]}>
          Alert Breakdown
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text + "80" }]}>
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
              styles.periodCard,
              {
                backgroundColor: themeColors.surface || themeColors.inputbg,
                borderColor: isDarkMode ? themeColors.border : "transparent",
              },
            ]}
          >
            
            <View style={styles.periodHeader}>
              <View style={styles.periodTitleContainer}>
                <Text
                  style={[styles.periodName, { color: themeColors.heading }]}
                >
                  {period.period_name}
                </Text>
                <Text
                  style={[styles.dateRange, { color: themeColors.text + "80" }]}
                >
                  {formatDateRange(period.period_name)}
                </Text>
              </View>
              <View
                style={[
                  styles.totalBadge,
                  { backgroundColor: themeColors.primary + "15" },
                ]}
              >
                <Text
                  style={[styles.totalCount, { color: themeColors.primary }]}
                >
                  {period.total_entries}
                </Text>
                <Text
                  style={[styles.totalLabel, { color: themeColors.primary }]}
                >
                  Total
                </Text>
              </View>
            </View>
            <View style={styles.alertsGrid}>
              {Object.entries(alertConfigs).map(([key, config]) => {
                const count = period[key] || 0;
                return (
                  <View
                    key={key}
                    style={[
                      styles.alertItem,
                      { backgroundColor: config.bgColor },
                    ]}
                  >
                    
                    <Ionicons
                      name={config.icon}
                      size={24}
                      color={config.color}
                    />
                    <Text style={[styles.alertCount, { color: config.color }]}>
                      {count}
                    </Text>
                    <Text
                      style={[styles.alertType, { color: config.color + "CC" }]}
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
  container: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  periodsScrollContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
    gap: 20,
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
  periodTitleContainer: {
    flex: 1,
    marginRight: 12,
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
