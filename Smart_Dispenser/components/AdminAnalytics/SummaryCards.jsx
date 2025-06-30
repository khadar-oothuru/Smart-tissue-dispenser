import React from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";

import { useNavigation } from "@react-navigation/native";
import {
  getBatteryAndPowerAlertCounts,
  getTissueAlertCounts,
} from "../../utils/alertCounts";

const SummaryCards = ({
  realtimeStatus = [],
  selectedAlertType = "tissue", // "tissue" or "battery"
  analytics = [],
  onTotalDevicesPress,
  onRefillRequiredPress,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const navigation = useNavigation();

  // Default handler if not provided
  const handleRefillPress =
    onRefillRequiredPress || (() => navigation.navigate("EmptyDevicesScreen"));

  // Use utility functions for proper alert counting
  const {
    lowBatteryCount,
    criticalBatteryCount,
    powerOffCount,
    powerTotalAlertsCount,
  } = getBatteryAndPowerAlertCounts(realtimeStatus);

  const { emptyCount, lowCount, fullCount, tamperCount, totalTissueAlerts } =
    getTissueAlertCounts(realtimeStatus);

  // For battery: total devices
  const totalDevices = Array.isArray(realtimeStatus)
    ? realtimeStatus.length
    : 0;

  // Card definitions based on alert type
  let cards = [];
  if (selectedAlertType === "tissue") {
    cards = [
      {
        title: "Need to refill",
        value: emptyCount,
        icon: "archive-outline",
        color: themeColors.primary,
        lightBg: "#E3F2FF",
        darkBg: themeColors.primary + "20",
        gradient: [themeColors.primary + "15", themeColors.primary + "05"],
        fullWidth: false,
        onPress: () =>
          navigation.navigate("AlertDevicesScreen", { alertType: "empty" }),
        fontSize: 11, // Make smaller
      },
      {
        title: "Low Alerts",
        value: lowCount,
        icon: "alert-outline",
        color: "#FF9F00",
        lightBg: "#FFF7E5",
        darkBg: "#FF9F0020",
        gradient: ["#FF9F0015", "#FF9F0005"],
        fullWidth: false,
        onPress: () =>
          navigation.navigate("AlertDevicesScreen", { alertType: "low" }),
      },
      {
        title: "Tamper Alerts",
        value: tamperCount,
        icon: "shield-off-outline",
        color: "#7C3AED",
        lightBg: "#F3E8FF",
        darkBg: isDark ? "#2A1F2A" : "rgba(139, 92, 246, 0.18)",
        gradient: ["#8B5CF6", "#7C3AED"],
        fullWidth: false,
        onPress: () =>
          navigation.navigate("AlertDevicesScreen", { alertType: "tamper" }),
        fontSize: 11, // Make smaller
      },
      {
        title: "Total Alerts",
        value: totalTissueAlerts,
        icon: "alert-circle-outline",
        color: "#FF3B30",
        lightBg: "#FFE5E5",
        darkBg: "#FF3B3020",
        gradient: ["#FF3B3015", "#FF3B3005"],
        fullWidth: false,
        onPress: () =>
          navigation.navigate("AlertDevicesScreen", { alertType: "alerts" }), // Only low, tamper, empty
      },
    ];
  } else if (selectedAlertType === "battery") {
    cards = [
      {
        title: "Need charge",
        value: criticalBatteryCount,
        icon: "battery-alert",
        color: "#FF3B30",
        lightBg: "#FFE5E5",
        darkBg: "#FF3B3020",
        gradient: ["#FF3B3015", "#FF3B3005"],
        fullWidth: false,
        onPress: () =>
          navigation.navigate("LowBatteryScreen", { alertType: "critical" }),
      },
      {
        title: "Low Battery",
        value: lowBatteryCount,
        icon: "battery-low",
        color: "#FF9F00",
        lightBg: "#FFF7E5",
        darkBg: "#FF9F0020",
        gradient: ["#FF9F0015", "#FF9F0005"],
        fullWidth: false,
        onPress: () =>
          navigation.navigate("LowBatteryScreen", { alertType: "low" }),
      },
      {
        title: "Power Off",
        value: powerOffCount,
        icon: "power-plug-off-outline",
        color: "#757575", // Changed to gray for Power Off
        lightBg: "#F5F5F5",
        darkBg: isDark ? "#232323" : "rgba(117, 117, 117, 0.18)",
        gradient: ["#BDBDBD15", "#75757505"],
        fullWidth: false,
        onPress: () => navigation.navigate("PowerOffDevicesScreen"),
      },
      {
        title: "Total Alerts",
        value: powerTotalAlertsCount,
        icon: "alert-circle-outline",
        color: "#FF3B30",
        lightBg: "#FFE5E5",
        darkBg: "#FF3B3020",
        gradient: ["#FF3B3015", "#FF3B3005"],
        fullWidth: false,
        onPress: () =>
          navigation.navigate("LowBatteryScreen", { alertType: "all_battery" }),
      },
    ];
  }

  // Layout: For tissue, always 2 rows of 2 cards (4 total). For battery, 2 cards in first row, 1 full width below.
  if (selectedAlertType === "tissue") {
    return (
      <View style={styles.container}>
        <View style={styles.rowWrap}>
          <AnimatedCard
            key={0}
            card={cards[0]}
            index={0}
            themeColors={themeColors}
            isDark={isDark}
            fullWidth={false}
            style={{ marginRight: 8 }}
            onPress={cards[0].onPress}
          />
          <AnimatedCard
            key={1}
            card={cards[1]}
            index={1}
            themeColors={themeColors}
            isDark={isDark}
            fullWidth={false}
            style={{ marginLeft: 8 }}
            onPress={cards[1].onPress}
          />
        </View>
        <View style={styles.rowWrap}>
          <AnimatedCard
            key={2}
            card={cards[2]}
            index={2}
            themeColors={themeColors}
            isDark={isDark}
            fullWidth={false}
            style={{ marginRight: 8 }}
            onPress={cards[2].onPress}
          />
          <AnimatedCard
            key={3}
            card={cards[3]}
            index={3}
            themeColors={themeColors}
            isDark={isDark}
            fullWidth={false}
            style={{ marginLeft: 8 }}
            onPress={cards[3].onPress}
          />
        </View>
      </View>
    );
  } else if (selectedAlertType === "battery") {
    // Render battery cards in 2 rows of 2, like tissue
    return (
      <View style={styles.container}>
        <View style={styles.rowWrap}>
          <AnimatedCard
            key={0}
            card={cards[0]}
            index={0}
            themeColors={themeColors}
            isDark={isDark}
            fullWidth={false}
            style={{ marginRight: 8 }}
            onPress={cards[0].onPress}
          />
          <AnimatedCard
            key={1}
            card={cards[1]}
            index={1}
            themeColors={themeColors}
            isDark={isDark}
            fullWidth={false}
            style={{ marginLeft: 8 }}
            onPress={cards[1].onPress}
          />
        </View>
        <View style={styles.rowWrap}>
          <AnimatedCard
            key={2}
            card={cards[2]}
            index={2}
            themeColors={themeColors}
            isDark={isDark}
            fullWidth={false}
            style={{ marginRight: 8 }}
            onPress={cards[2].onPress}
          />
          <AnimatedCard
            key={3}
            card={cards[3]}
            index={3}
            themeColors={themeColors}
            isDark={isDark}
            fullWidth={false}
            style={{ marginLeft: 8 }}
            onPress={cards[3].onPress}
          />
        </View>
      </View>
    );
  } else {
    return null;
  }
};

const AnimatedCard = ({
  card,
  index,
  themeColors,
  isDark,
  fullWidth,
  style,
  onPress,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (card.onPress) card.onPress();
    if (onPress) onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        fullWidth || card.fullWidth
          ? styles.cardWrapperFull
          : styles.cardWrapper,
        style,
      ]}
    >
      <Animated.View
        style={[
          fullWidth || card.fullWidth ? styles.cardFull : styles.card,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: isDark
              ? themeColors.surface
              : themeColors.background,
            borderWidth: isDark ? 1 : 0,
            borderColor: themeColors.border,
          },
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? [themeColors.surface, themeColors.background]
              : card.gradient
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: card.color + "18",
                borderWidth: 0,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={card.icon}
              size={30}
              color={card.color}
            />
          </View>
          <View style={styles.textContainer}>
            {/* Render value and title in two lines for all cards */}
            <Animated.Text
              style={[
                styles.value,
                { color: isDark ? themeColors.heading : card.color },
              ]}
            >
              {formatNumber(card.value)}
            </Animated.Text>
            <Text
              style={[
                styles.title,
                { color: themeColors.text },
                (card.title === "Tamper Alerts" ||
                  card.title === "Need to refill" ||
                  card.fontSize) && { fontSize: card.fontSize || 11 },
              ]}
            >
              {card.title}
            </Text>
          </View>

          {/* Trend indicator (optional) */}
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons
              name="trending-up"
              size={16}
              color={card.color}
            />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// Helper function to format large numbers
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    width: "100%",
    marginBottom: 4,
  },
  cardWrapper: {
    flex: 1,
    minWidth: 0,
    flexBasis: 0,
    marginBottom: 12,
  },
  cardWrapperFull: {
    width: "100%",
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 70,
  },
  cardFull: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 70,
  },
  cardContent: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 90,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginBottom: 0,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: 48,
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 0,
    letterSpacing: -1,
    lineHeight: 32,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "left",
    marginTop: 2,
    opacity: 0.92,
  },
  trendContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    opacity: 0.6,
  },
});

export default SummaryCards;
