
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useThemeContext } from "../../context/ThemeContext";

const { width, height } = Dimensions.get("window");

const LoadingScreen = ({
  message = "Loading",
  submessage = "Please wait...",
  icon,
  iconName = "loading",
  iconSize = 50,
  variant = "default", // default, minimal, fullscreen, skeleton
  showProgress = false,
  progress = 0,
  customIcon,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for default variant
    if (variant === "default" || variant === "fullscreen") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Rotation animation for minimal variant
    if (variant === "minimal") {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    }

    // Animated dots for loading text
    dotsAnim.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [variant]);

  const renderIcon = () => {
    if (customIcon) {
      return customIcon;
    }
    if (icon) {
      return <Text style={styles.emojiIcon}>{icon}</Text>;
    }
    if (variant === "minimal") {
      return (
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={iconSize}
            color={themeColors.primary}
          />
        </Animated.View>
      );
    }
    return null;
  };

  // Minimal variant
  if (variant === "minimal") {
    return (
      <Animated.View style={[styles.minimalContainer, { opacity: fadeAnim }]}>
        <View
          style={[
            styles.minimalContent,
            {
              backgroundColor: isDark
                ? themeColors.surface
                : themeColors.inputbg,
              borderWidth: isDark ? 1 : 0,
              borderColor: themeColors.border,
            },
          ]}
        >
          {renderIcon()}
          <Text style={[styles.minimalText, { color: themeColors.heading }]}>
            {message}
          </Text>
          <View style={styles.dotsContainer}>
            {dotsAnim.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: themeColors.primary,
                    opacity: anim,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    );
  }

  // Skeleton variant
  if (variant === "skeleton") {
    return <SkeletonLoader themeColors={themeColors} isDark={isDark} />;
  }

  // Default and fullscreen variants
  const ContainerComponent = variant === "fullscreen" ? View : View;

  return (
    <ContainerComponent
      style={[
        styles.container,
        variant === "fullscreen" && styles.fullscreenContainer,
        { backgroundColor: themeColors.background },
      ]}
    >
      {variant === "fullscreen" && (
        <LinearGradient
          colors={[
            themeColors.background,
            isDark ? themeColors.surface : "#f8f9fa",
            themeColors.background,
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <Animated.View
        style={[
          styles.loadingContent,
          {
            transform: [{ scale: pulseAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {(icon || iconName) && (
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark ? themeColors.surface : "transparent",
                borderWidth: isDark ? 1 : 0,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconInner,
                {
                  backgroundColor: isDark
                    ? themeColors.background
                    : themeColors.inputbg,
                },
              ]}
            >
              {renderIcon()}
            </View>
          </View>
        )}

        <View style={styles.spinnerContainer}>
          <ActivityIndicator
            size="large"
            color={themeColors.primary}
            style={styles.spinner}
          />
          {variant === "fullscreen" && (
            <View
              style={[
                styles.spinnerRing,
                { borderColor: themeColors.primary + "20" },
              ]}
            />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.loadingText, { color: themeColors.heading }]}>
            {message}
          </Text>
          <View style={styles.dotsContainer}>
            {dotsAnim.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: themeColors.primary,
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {submessage && (
          <Text style={[styles.loadingSubtext, { color: themeColors.text }]}>
            {submessage}
          </Text>
        )}

        {showProgress && (
          <View
            style={[
              styles.progressContainer,
              { backgroundColor: themeColors.inputbg },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: themeColors.primary,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        )}
      </Animated.View>
    </ContainerComponent>
  );
};

// Enhanced Skeleton Loader Component
const SkeletonLoader = ({ themeColors, isDark }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const renderSkeletonItem = (key, height) => (
    <View
      key={key}
      style={[
        styles.skeletonItem,
        {
          backgroundColor: isDark ? themeColors.surface : themeColors.inputbg,
          height,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ["transparent", "rgba(255,255,255,0.05)", "transparent"]
              : ["transparent", "rgba(255,255,255,0.5)", "transparent"]
          }
          style={styles.shimmerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );

  return (
    <View
      style={[
        styles.skeletonContainer,
        { backgroundColor: themeColors.background },
      ]}
    >
      {/* Header skeleton */}
      {renderSkeletonItem("header", 120)}

      {/* Content skeletons */}
      <View style={styles.skeletonContent}>
        {renderSkeletonItem("item1", 80)}
        {renderSkeletonItem("item2", 80)}
        {renderSkeletonItem("item3", 160)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  loadingContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiIcon: {
    fontSize: 50,
  },
  spinnerContainer: {
    position: "relative",
    marginBottom: 24,
  },
  spinner: {
    transform: [{ scale: 1.2 }],
  },
  spinnerRing: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40,
    borderWidth: 2,
    opacity: 0.3,
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: "row",
    marginLeft: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  loadingSubtext: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 40,
    opacity: 0.8,
  },
  progressContainer: {
    width: 220,
    height: 6,
    borderRadius: 3,
    marginTop: 24,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },

  // Minimal variant styles
  minimalContainer: {
    padding: 20,
    alignItems: "center",
  },
  minimalContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  minimalText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Skeleton styles
  skeletonContainer: {
    flex: 1,
    padding: 20,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonItem: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    width: width * 2,
  },
});

export default LoadingScreen;
