import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const StatsCard = ({ title, value, icon, color }) => {
  const { themeColors, isDark } = useThemeContext();

  return (
    <View
      style={[
        styles.statsCard,
        {
          backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
          borderColor: themeColors.border,
        },
      ]}
    >
      <View style={[styles.statsIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statsContent}>
        <Text style={[styles.statsValue, { color: themeColors.heading }]}>
          {value}
        </Text>
        <Text style={[styles.statsTitle, { color: themeColors.text }]}>
          {title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  statsTitle: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default StatsCard;
