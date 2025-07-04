import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ReanimatedAnimated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";

import { WebView } from "react-native-webview";
import { useThemeContext } from "../../../context/ThemeContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../../components/common/ScreenWrapper";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const Demo = () => {
  const { themeColors, isDark } = useThemeContext();
  const navigation = useNavigation();
  const scrollY = useSharedValue(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.8]);
    const scale = interpolate(scrollY.value, [0, 100], [1, 0.95]);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const features = [
    {
      icon: "notifications-outline",
      title: "Real-time Alerts",
      description: "Instant notifications when tissue levels are low",
      color: "#FF6B6B",
    },
    {
      icon: "shield-checkmark-outline",
      title: "Enhanced Hygiene",
      description: "Prevents contamination with proactive monitoring",
      color: "#4ECDC4",
    },
    {
      icon: "analytics-outline",
      title: "Smart Analytics",
      description: "Usage patterns and predictive maintenance",
      color: "#45B7D1",
    },
    {
      icon: "settings-outline",
      title: "Easy Integration",
      description: "Seamless setup with existing infrastructure",
      color: "#96CEB4",
    },
  ];

  const stats = [
    { number: "99%", label: "Uptime" },
    { number: "24/7", label: "Monitoring" },
    { number: "50+", label: "Locations" },
    { number: "5sec", label: "Response" },
  ];

  return (
    <ScreenWrapper>
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={themeColors.background}
          translucent={false}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Hero Section */}
          <ReanimatedAnimated.View
            style={[styles.heroSection, headerAnimatedStyle]}
            entering={FadeInDown.duration(800).springify()}
          >
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(59, 130, 246, 0.1)", "rgba(139, 92, 246, 0.1)"]
                  : ["rgba(147, 197, 253, 0.1)", "rgba(196, 181, 253, 0.1)"]
              }
              style={styles.heroBackground}
            >
              <View style={styles.heroContent}>
                <Animated.View
                  style={[
                    styles.badgeContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={
                      isDark ? ["#3B82F6", "#8B5CF6"] : ["#93C5FD", "#C4B5FD"]
                    }
                    style={styles.badge}
                  >
                    <Text style={styles.badgeText}>SMART TECHNOLOGY</Text>
                  </LinearGradient>
                </Animated.View>

                <Animated.Text
                  style={[
                    styles.heroTitle,
                    {
                      color: themeColors.heading,
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  Tissue Change{"\n"}Alert System
                </Animated.Text>

                <Animated.Text
                  style={[
                    styles.heroSubtitle,
                    {
                      color: themeColors.text,
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  Revolutionary IoT solution for smart restroom management with
                  real-time monitoring and predictive alerts
                </Animated.Text>
              </View>

              {/* Floating Stats */}
              <Animated.View
                style={[
                  styles.statsContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {stats.map((stat, index) => (
                  <View
                    key={index}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statNumber,
                        { color: themeColors.heading },
                      ]}
                    >
                      {stat.number}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: themeColors.text }]}
                    >
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            </LinearGradient>
          </ReanimatedAnimated.View>
          {/* Video Section */}
          <ReanimatedAnimated.View
            entering={FadeInDown.delay(1200).duration(600)}
            style={styles.videoSection}
          >
            <View style={styles.sectionHeader}>
              <Ionicons
                name="play-circle"
                size={28}
                color={themeColors.primary}
              />
              <Text
                style={[styles.sectionTitle, { color: themeColors.heading }]}
              >
                See It In Action
              </Text>
            </View>

            <View style={styles.videoContainer}>
              <LinearGradient
                colors={
                  isDark ? ["#3B82F6", "#8B5CF6"] : ["#93C5FD", "#C4B5FD"]
                }
                style={styles.videoGradientBorder}
              >
                <View style={styles.videoWrapper}>
                  <WebView
                    style={styles.video}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsFullscreenVideo={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    source={{
                      uri: "https://www.youtube.com/embed/aqEyC9UmL84?autoplay=0&controls=1&rel=0&modestbranding=1",
                    }}
                    renderLoading={() => (
                      <View style={styles.videoLoadingContainer}>
                        <Ionicons
                          name="play-circle"
                          size={60}
                          color={themeColors.primary}
                        />
                        <Text
                          style={[
                            styles.videoLoadingText,
                            { color: themeColors.text },
                          ]}
                        >
                          Loading video...
                        </Text>
                      </View>
                    )}
                    startInLoadingState={true}
                  />
                </View>
              </LinearGradient>
            </View>
          </ReanimatedAnimated.View>
          {/* Features Grid */}
          <ReanimatedAnimated.View
            entering={FadeInUp.delay(1400).duration(600)}
            style={styles.featuresSection}
          >
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="auto-awesome"
                size={28}
                color={themeColors.primary}
              />
              <Text
                style={[styles.sectionTitle, { color: themeColors.heading }]}
              >
                Key Features
              </Text>
            </View>

            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <ReanimatedAnimated.View
                  key={index}
                  entering={FadeInUp.delay(1600 + index * 150).springify()}
                >
                  <TouchableOpacity
                    style={[
                      styles.featureCard,
                      {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[feature.color + "30", feature.color + "10"]}
                      style={styles.featureIconContainer}
                    >
                      <Ionicons
                        name={feature.icon}
                        size={32}
                        color={feature.color}
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        styles.featureTitle,
                        { color: themeColors.heading },
                      ]}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      style={[
                        styles.featureDescription,
                        { color: themeColors.text },
                      ]}
                    >
                      {feature.description}
                    </Text>
                  </TouchableOpacity>
                </ReanimatedAnimated.View>
              ))}
            </View>
          </ReanimatedAnimated.View>
          {/* Benefits Section */}
          <ReanimatedAnimated.View
            entering={FadeInDown.delay(2000).duration(600)}
            style={styles.benefitsSection}
          >
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                  : ["rgba(0,0,0,0.03)", "rgba(0,0,0,0.01)"]
              }
              style={[
                styles.benefitsCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="trending-up"
                  size={28}
                  color={themeColors.primary}
                />
                <Text
                  style={[styles.sectionTitle, { color: themeColors.heading }]}
                >
                  Why Choose Our Solution?
                </Text>
              </View>

              <View style={styles.benefitsList}>
                {[
                  "Reduces maintenance costs by 40%",
                  "Improves user satisfaction significantly",
                  "Prevents hygiene-related complaints",
                  "Real-time dashboard monitoring",
                  "Customizable alert thresholds",
                  "Works with existing infrastructure",
                ].map((benefit, index) => (
                  <ReanimatedAnimated.View
                    key={index}
                    entering={SlideInRight.delay(2200 + index * 100)}
                    style={styles.benefitItem}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={themeColors.primary}
                    />
                    <Text
                      style={[styles.benefitText, { color: themeColors.text }]}
                    >
                      {benefit}
                    </Text>
                  </ReanimatedAnimated.View>
                ))}
              </View>
            </LinearGradient>
          </ReanimatedAnimated.View>
          {/* CTA Section */}
          <ReanimatedAnimated.View
            entering={FadeInUp.delay(2600).duration(600)}
            style={styles.ctaSection}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("contact")}
            >
              <LinearGradient
                colors={
                  isDark ? ["#3B82F6", "#8B5CF6"] : ["#3B82F6", "#8B5CF6"]
                }
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>Contact Us</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </ReanimatedAnimated.View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  heroSection: {
    minHeight: height * 0.6,
    paddingTop: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  heroBackground: {
    borderRadius: 20,
    padding: 20,
    margin: 4,
  },
  heroContent: {
    alignItems: "center",
    marginBottom: 30,
  },
  badgeContainer: {
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  videoSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginLeft: 12,
  },
  videoContainer: {
    alignItems: "center",
  },
  videoGradientBorder: {
    padding: 3,
    borderRadius: 20,
  },
  videoWrapper: {
    width: width - 38,
    height: 220,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  videoLoadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  featuresSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  featureCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  benefitsCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  benefitsList: {
    marginTop: 16,
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  ctaText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});

export default Demo;
