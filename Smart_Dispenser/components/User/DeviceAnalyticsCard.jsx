import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";
import DeviceStatItem from "./DeviceStatItem";

import DeviceAnalyticsSection from "./DeviceAnalyticsSection";
import DeviceLastActivity from "./DeviceLastActivity";
import { getStatusConfig } from "../../utils/deviceUtils";
import { deviceCardStyles } from "../../styles/deviceCardStyles";

const DeviceAnalyticsCard = ({ device, index = 0, onPress }) => {
  const { themeColors, isDark } = useThemeContext();
  const styles = deviceCardStyles(themeColors, isDark);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Enhanced activity indicator logic
  const showActivityIndicator =
    device.is_active &&
    device.minutes_since_update !== null &&
    device.minutes_since_update <= 5;

  useEffect(() => {
    // Enhanced entry animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Enhanced pulsing animation for activity indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    if (showActivityIndicator) {
      pulseAnimation.start();
    }

    return () => {
      pulseAnimation.stop();
    };
  }, [index, showActivityIndicator]);

  const statusConfig = getStatusConfig(device);

  // Get device name with enhanced fallback
  const getDeviceName = () => {
    return (
      device.device_name ||
      device.name ||
      `Device ${device.device_id || device.id || "Unknown"}`
    );
  };

  // Enhanced location info
  const getLocationInfo = () => {
    const room = device.room || device.location || "Unknown Room";
    const floor = device.floor || device.floor_number || "N/A";
    return { room, floor };
  };

  const { room, floor } = getLocationInfo();

  // Calculate health score based on alerts
  const getHealthScore = () => {
    const totalAlerts =
      (device.low_alert_count || 0) + (device.tamper_count || 0);
    const totalEntries = device.total_entries || 0;

    if (totalEntries === 0) return 0;
    const alertRatio = totalAlerts / totalEntries;
    return Math.max(0, Math.min(100, Math.round((1 - alertRatio) * 100)));
  };

  const healthScore = getHealthScore();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
        style={styles.touchable}
      >
        <View
          style={[
            styles.card,
            {
              borderColor: statusConfig.color + "20",
              shadowColor: statusConfig.shadowColor,
            },
          ]}
        >
          {/* Enhanced Status Gradient Bar */}
          <LinearGradient
            colors={statusConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusGradientBar}
          />

          {/* Header Section with improved layout */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark
                      ? statusConfig.bgDark
                      : statusConfig.bgLight,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="router-wireless"
                  size={24}
                  color={statusConfig.color}
                />
                {/* Connection indicator */}
                {device.is_active && (
                  <Animated.View
                    style={[
                      styles.connectionDot,
                      {
                        backgroundColor: "#4CAF50",
                        opacity: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ]}
                  />
                )}
              </View>

              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName} numberOfLines={1}>
                  {getDeviceName()}
                </Text>
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={themeColors.text}
                  />
                  <Text style={styles.deviceLocation} numberOfLines={1}>
                    {room} • Floor {floor}
                  </Text>
                </View>
                {/* Device ID */}
                <Text style={styles.deviceId}>ID: {device.device_id}</Text>
              </View>
            </View>

            {/* Enhanced Status Badge */}
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isDark
                      ? statusConfig.bgDark
                      : statusConfig.bgLight,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={statusConfig.icon}
                  size={16}
                  color={statusConfig.color}
                />
                <Text
                  style={[styles.statusText, { color: statusConfig.color }]}
                >
                  {statusConfig.text}
                </Text>
              </View>
              {/* Health Score Indicator */}
              {healthScore > 0 && (
                <View style={styles.healthIndicator}>
                  <Text style={styles.healthScore}>{healthScore}%</Text>
                  <Text style={styles.healthLabel}>Health</Text>
                </View>
              )}
            </View>
          </View>

          {/* Enhanced Analytics Stats Grid */}
          <View style={styles.statsGrid}>
            <DeviceStatItem
              icon="chart-line"
              value={
                device.total_readings ||
                device.data_points ||
                device.total_entries ||
                0
              }
              label="Readings"
              color={themeColors.primary}
            />
            <DeviceStatItem
              icon="alert"
              value={
                device.alert_count ||
                device.alerts ||
                device.low_alert_count ||
                0
              }
              label="Alerts"
              color="#FF9800"
            />
            <DeviceStatItem
              icon="warning"
              value={device.tamper_count || 0}
              label="Tamper"
              color="#E91E63"
            />
          </View>

          {/* Enhanced Real-time Activity Indicator */}
          {showActivityIndicator && (
            <DeviceActivityIndicator device={device} pulseAnim={pulseAnim} />
          )}

          {/* Enhanced Device Analytics Summary */}
          <DeviceAnalyticsSection
            device={device}
            healthScore={healthScore}
            statusConfig={statusConfig}
          />

          {/* Enhanced Last Activity Section */}
          <DeviceLastActivity device={device} />

          {/* Progress bar for activity level */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: statusConfig.color,
                    width: `${Math.min(100, healthScore)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default DeviceAnalyticsCard;
