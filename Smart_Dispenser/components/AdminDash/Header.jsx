import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Header({ themeColors }) {
  const styles = getStyles(themeColors);

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Dashboard</Text>
      {/* <Text style={styles.headerSubtitle}>Device Network Overview</Text> */}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
    //   paddingVertical: 20,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.text,
    },
  });