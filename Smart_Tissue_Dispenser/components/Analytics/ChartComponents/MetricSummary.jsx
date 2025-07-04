import { metricStyles } from "@/themes/theme";
import React from "react";
import { Text, View } from "react-native";
import { useThemeContext } from "../../../context/ThemeContext";

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
