import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function StatCard({ icon, label, value, color, bgColor }) {
  const styles = getStyles();

  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={styles.statIconContainer}>
        <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    statCard: {
      width: width / 2 - 20,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statIconContainer: {
      marginRight: 12,
    },
    statIcon: {
      fontSize: 24,
    },
    statContent: {
      flex: 1,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "bold",
    },
    statLabel: {
      fontSize: 12,
      color: "#666",
    },
  });