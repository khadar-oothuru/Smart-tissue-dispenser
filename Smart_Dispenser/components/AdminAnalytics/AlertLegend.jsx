// components/Analytics/AlertLegend.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const AlertLegend = () => {
  const legends = [
    { label: "Tamper", color: "#8B5CF6" },
    { label: "Empty", color: "#DC2626" },
    { label: "Low", color: "#FF9800" },
    { label: "Full", color: "#4CAF50" },
  ];

  return (
    <View style={styles.container}>
      {legends.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});

export default AlertLegend;
