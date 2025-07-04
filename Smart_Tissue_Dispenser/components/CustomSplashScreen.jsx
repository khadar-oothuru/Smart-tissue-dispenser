import { useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";
import { getUbuntuFont } from "../utils/fonts";

export default function CustomSplashScreen() {
  const router = useRouter();
  const { accessToken, loading, user } = useAuth();
  const { themeColors, isDark } = useThemeContext();
  // Simple animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const tissueAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simple fade and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Tissue animation - subtle slide down effect
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(tissueAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(tissueAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1000);

    // Navigate after 3 seconds
    const timer = setTimeout(() => {
      if (!loading) {
        if (accessToken && user?.role === "admin") {
          router.replace("admindash");
        } else if (accessToken) {
          router.replace("Home");
        } else {
          router.replace("Login");
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [accessToken, user, loading, router, fadeAnim, scaleAnim, tissueAnim]);
  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} translucent />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Modern Tissue Dispenser Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.icon, { backgroundColor: themeColors.primary }]}>
            <View style={styles.iconInner}>
              {/* Tissue Dispenser Icon */}
              <View style={styles.dispenserBody}>
                <View style={styles.dispenserTop} />
                <View style={styles.dispenserSlot} />
                <Animated.View
                  style={[
                    styles.tissuePaper,
                    {
                      transform: [
                        {
                          translateY: tissueAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 3],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.dispenserBottom} />
              </View>
            </View>
          </View>
        </View>
        {/* App Name */}
        <Text style={[styles.appName, { color: themeColors.heading }]}>
          Tishoo
        </Text>
        {/* Tagline */}
        <Text style={[styles.tagline, { color: themeColors.text }]}>
          Smart Tissue Dispenser
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  iconInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  dispenserBody: {
    width: 36,
    height: 42,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dispenserTop: {
    width: 36,
    height: 8,
    backgroundColor: "#e8e8e8",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: 2,
  },
  dispenserSlot: {
    width: 28,
    height: 2,
    backgroundColor: "#333",
    borderRadius: 1,
    marginBottom: 6,
  },
  tissuePaper: {
    width: 18,
    height: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: "#ddd",
    marginBottom: 4,
  },
  dispenserBottom: {
    width: 36,
    height: 6,
    backgroundColor: "#e8e8e8",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  appName: {
    fontSize: 28,
    fontFamily: getUbuntuFont("bold"),
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: getUbuntuFont("medium"),
    textAlign: "center",
    opacity: 0.8,
  },
});
