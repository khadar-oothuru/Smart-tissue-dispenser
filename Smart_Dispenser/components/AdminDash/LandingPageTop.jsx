import React, { useEffect, useRef, useMemo } from "react";
import { StyleSheet, Text, View, Animated, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
import { useRouter } from "expo-router";

export default function LandingPageTop({
  stats,
  summaryData,
  onRefresh,
  isLoading = false,
  onPressTotalDevices,
}) {
  const router = useRouter();
  const { themeColors, isDark } = useThemeContext();
  const styles = getStyles(themeColors, isDark);
  // Enhanced animations for better experience
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  // New smooth animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const statsSlideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
      // Staggered stats animation
      Animated.timing(statsSlideAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle floating animation
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle glow effect
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Icon rotation animation
    const iconAnimation = Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    );

    // Pulse animation for status indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Shimmer animation for loading states
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    floatingAnimation.start();
    glowAnimation.start();
    iconAnimation.start();
    pulseAnimation.start();

    if (isLoading) {
      shimmerAnimation.start();
    } else {
      shimmerAnimation.stop();
      shimmerAnim.setValue(0);
    }

    return () => {
      floatingAnimation.stop();
      glowAnimation.stop();
      iconAnimation.stop();
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [
    fadeAnim,
    scaleAnim,
    progressAnim,
    pulseAnim,
    shimmerAnim,
    floatAnim,
    iconRotateAnim,
    glowAnim,
    statsSlideAnim,
    isLoading,
  ]);
  // Handle press interactions
  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Navigation handlers for total, active, and offline devices
  const handlePressTotal = () => {
    // Use AlertDevicesScreen with alertType 'all' for total devices
    router.push({
      pathname: "AlertDevicesScreen",
      params: { alertType: "all" },
    });
  };
  const handlePressActive = () => {
    // Use AlertDevicesScreen with alertType 'active' (implement filter in AlertDevicesScreen if needed)
    router.push({
      pathname: "AlertDevicesScreen",
      params: { alertType: "active" },
    });
  };
  const handlePressOffline = () => {
    // Navigate to the dedicated OfflineDevicesScreen
    router.push("/OfflineDevicesScreen");
  };
  // Calculate percentages and status
  const totalDevices = stats?.totalDevices || 0;
  const activeDevices = stats?.activeDevices || 0;

  // Enhanced offline calculation: includes power off and inactive devices
  const offlineDevices = useMemo(() => {
    if (typeof stats?.offlineDevices === "number") {
      return stats.offlineDevices;
    }

    // Fallback calculation: total - active
    return Math.max(0, totalDevices - activeDevices);
  }, [stats?.offlineDevices, totalDevices, activeDevices]);
  // const activePercentage =
  //   totalDevices > 0 ? (activeDevices / totalDevices) * 100 : 0;
  // Match summary card gradient style
  const getGradientColors = () => {
    if (isDark) {
      return [themeColors.surface, themeColors.background];
    }
    return [themeColors.primary + "15", themeColors.primary + "05"];
  };
  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        // Removed onPress={handlePress} as it's not defined/used anymore
        disabled={isLoading}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.95 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: pressAnim },
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                  }),
                },
              ],
              backgroundColor: isDark
                ? themeColors.surface
                : themeColors.background,
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* No shimmer, no overlay, no loading UI at all. */}

          <View style={styles.cardContent}>
            {/* Header */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: themeColors.primary + "15",
                    shadowColor: themeColors.primary,
                    shadowOpacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3],
                    }),
                    shadowRadius: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 8],
                    }),
                    elevation: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 8],
                    }),
                  },
                ]}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: iconRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <MaterialCommunityIcons
                    name="monitor-dashboard"
                    size={24}
                    color={themeColors.primary}
                  />
                </Animated.View>
              </Animated.View>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: themeColors.text }]}>
                  Dispenser Overview
                </Text>
                <View style={styles.statusRow}>
                  <Animated.View
                    style={[
                      styles.liveIndicator,
                      {
                        opacity: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.2],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Text
                    style={[styles.statusText, { color: themeColors.text }]}
                  >
                    {isLoading ? "Updating..." : "Live Status"}
                  </Text>
                </View>
              </View>
              {/* No refresh button at all */}
            </View>
            {/* Main Stats Row - Total Devices (big, left), Active & Offline (side by side, right) */}
            {/* Modern Stats Row UI - Simple, theme surface, no glow or blur */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "stretch",
                marginBottom: 10,
                gap: 10,
              }}
            >
              {/* Total Dispensers - Summary Card Style */}
              <Pressable
                style={{ flex: 1.1, marginRight: 8 }}
                onPress={handlePressTotal}
                android_ripple={{ color: themeColors.primary + "22" }}
              >
                <View
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: isDark
                      ? themeColors.surface
                      : themeColors.background,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: themeColors.border,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 2,
                    minHeight: 90,
                    position: "relative",
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      minHeight: 90,
                      width: "100%",
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 10,
                        backgroundColor: themeColors.primary + "18",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="devices"
                        size={20}
                        color={themeColors.primary}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        minHeight: 48,
                        width: "100%",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 54,
                          fontWeight: "900",
                          marginBottom: 0,
                          letterSpacing: -1,
                          lineHeight: 60,
                          color: isDark
                            ? themeColors.heading
                            : themeColors.primary,
                          textAlign: "left",
                        }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {totalDevices}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              {/* Active & Offline - Summary Card Style */}
              <View
                style={{
                  flex: 1.7,
                  gap: 10,
                  flexDirection: "row",
                  alignItems: "stretch",
                }}
              >
                {/* Active */}
                <Pressable
                  style={{ flex: 1, marginRight: 5 }}
                  onPress={handlePressActive}
                  android_ripple={{ color: "#4CAF5018" }}
                >
                  <View
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: isDark
                        ? themeColors.surface
                        : themeColors.background,
                      borderWidth: isDark ? 1 : 0,
                      borderColor: themeColors.border,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                      minHeight: 90,
                      position: "relative",
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? [themeColors.surface, themeColors.background]
                          : ["#4CAF5015", "#4CAF5005"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        minHeight: 90,
                        width: "100%",
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                          backgroundColor: "#4CAF5018",
                        }}
                      >
                        <MaterialCommunityIcons
                          name="power"
                          size={20}
                          color="#4CAF50"
                        />
                      </View>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "flex-start",
                          minHeight: 48,
                          width: "100%",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 54,
                            fontWeight: "900",
                            marginBottom: 0,
                            letterSpacing: -1,
                            lineHeight: 60,
                            color: "#388E3C",
                            textAlign: "left",
                          }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {activeDevices}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
                {/* Offline */}
                <Pressable
                  style={{ flex: 1 }}
                  onPress={handlePressOffline}
                  android_ripple={{ color: "#FF3B3018" }}
                >
                  <View
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: isDark
                        ? themeColors.surface
                        : themeColors.background,
                      borderWidth: isDark ? 1 : 0,
                      borderColor: themeColors.border,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                      minHeight: 90,
                      position: "relative",
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? [themeColors.surface, themeColors.background]
                          : ["#FF3B3015", "#FF3B3005"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        minHeight: 90,
                        width: "100%",
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                          backgroundColor: "#FF3B3018",
                        }}
                      >
                        <MaterialCommunityIcons
                          name="power-off"
                          size={20}
                          color="#FF3B30"
                        />
                      </View>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "flex-start",
                          minHeight: 48,
                          width: "100%",
                        }}
                      >
                        {/* Show offline device count as a list if needed */}
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "900",
                            marginBottom: 0,
                            letterSpacing: -1,
                            lineHeight: 60,
                            color: "#D84315",
                            textAlign: "left",
                          }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {Array.isArray(stats?.offlineDevicesList) && stats.offlineDevicesList.length > 0
                            ? stats.offlineDevicesList.length
                            : offlineDevices}
                        </Text>
                        {/* Optionally, show device names below (uncomment if needed) */}
                        {/* {Array.isArray(stats?.offlineDevicesList) && stats.offlineDevicesList.length > 0 && (
                          <Text style={{ fontSize: 10, color: '#D84315', marginTop: -10 }}>
                            {stats.offlineDevicesList.map(d => d.name || d.device_name || d.id).join(", ")}
                          </Text>
                        )} */}
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>
            {/* Labels below the cards */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginTop: 8,
                gap: 10,
              }}
            >
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    textAlign: "center",
                    opacity: 0.97,
                    color: themeColors.text,
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  Total Dispensers
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "900",
                    textAlign: "center",
                    opacity: 0.97,
                    color: themeColors.text,
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  Active
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "900",
                    textAlign: "center",
                    opacity: 0.97,
                    color: themeColors.text,
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  Offline
                </Text>
              </View>
            </View>
            {/* Last Updated Time */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                marginBottom: 8,
                marginRight: 8,
                margin: 10,
              }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={themeColors.text + "99"}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: themeColors.text + "99",
                  opacity: 0.7,
                }}
              >
                {`Updated ${getTimeAgo()}`}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );

  // Helper functions for enhanced UX
  // Removed unused getHealthIcon, getHealthColor, getHealthStatus

  function getTimeAgo() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      marginBottom: 20,
      marginTop: 5,
    },

    card: {
      borderRadius: 24,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 20,
      elevation: 15,
      overflow: "hidden",
      position: "relative",
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : "transparent",
    },

    shimmerOverlay: {
      borderRadius: 24,
    },

    cardContent: {
      flex: 1,
    },

    // Header Section
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },

    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },

    headerText: {
      flex: 1,
    },

    title: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
      letterSpacing: 0.3,
    },

    statusRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    liveIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#4CAF50",
      marginRight: 8,
      shadowColor: "#4CAF50",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    },

    statusText: {
      fontSize: 13,
      opacity: 0.7,
      fontWeight: "500",
    },

    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
    },

    // Main Stats Row
    mainStatsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 24,
    },

    primaryStatSection: {
      alignItems: "flex-start",
      flex: 1,
    },

    primaryNumber: {
      fontSize: 56,
      fontWeight: "800",
      lineHeight: 56,
      marginBottom: 4,
    },

    primaryLabel: {
      fontSize: 16,
      fontWeight: "600",
      opacity: 0.8,
      marginBottom: 8,
    },

    healthIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },

    healthText: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    },

    // Enhanced Stats Grid
    statsGrid: {
      flexDirection: "row",
      flex: 1,
      justifyContent: "space-evenly",
      alignItems: "center",
      paddingLeft: 20,
    },

    statItem: {
      alignItems: "center",
      minWidth: 70,
      position: "relative",
    },

    statIconBg: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },

    statValue: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 3,
    },

    statLabel: {
      fontSize: 12,
      fontWeight: "600",
      opacity: 0.7,
      textAlign: "center",
      marginBottom: 4,
    },

    trendIndicator: {
      position: "absolute",
      top: -2,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    // Enhanced Progress Section
    progressSection: {
      marginTop: 4,
    },

    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },

    progressTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
    },

    progressTitle: {
      fontSize: 15,
      fontWeight: "600",
      opacity: 0.8,
    },

    progressPercentage: {
      fontSize: 16,
      fontWeight: "700",
    },

    progressBarContainer: {
      height: 10,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.08)",
      borderRadius: 5,
      overflow: "hidden",
      marginBottom: 12,
      position: "relative",
    },

    progressBar: {
      height: "100%",
      borderRadius: 5,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },

    progressGlow: {
      position: "absolute",
      height: "100%",
      borderRadius: 5,
      top: 0,
      left: 0,
    },

    progressFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    progressSubtext: {
      fontSize: 13,
      opacity: 0.6,
      fontWeight: "500",
      flex: 1,
    },

    lastUpdated: {
      fontSize: 11,
      opacity: 0.5,
      fontWeight: "400",
    },
  });
