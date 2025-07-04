import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image, 
  Animated,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get('window');

// Import images statically
const darkImage = require("../assets/images/notdark2.png");
const lightImage = require("../assets/images/notlight1.png");

export default function NotFoundScreen() {
  const router = useRouter();
  const { themeColors, isDark } = useThemeContext();
  const { user } = useAuth();
  const styles = createStyles(themeColors, isDark);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);  const handleGoHome = () => {
    if ((user as any)?.role === 'admin') {
      router.replace('/admindash');
    } else {
      router.replace('/Home');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <View style={styles.container}>
        {/* Header (like notifications page) */}
        <LinearGradient
          colors={
            isDark
              ? [themeColors.surface, themeColors.background]
              : ["#ffffff", themeColors.background]
          }
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark
                    ? `${themeColors.primary}30`
                    : `${themeColors.primary}15`,
                  borderColor: isDark
                    ? `${themeColors.primary}50`
                    : "transparent",
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={themeColors.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Not Found</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <View
            style={[
              styles.headerSeparator,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          />
        </LinearGradient>
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Illustration - Bigger size */}
          <Image
            source={isDark ? darkImage : lightImage}
            style={styles.illustration}
            resizeMode="contain"
          />
          {/* Action Button */}
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <Ionicons
              name="home-outline"
              size={20}
              color={isDark ? themeColors.background : "#fff"}
            />
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

const createStyles = (themeColors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  headerGradient: {
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerSeparator: {
    height: 1,
    width: '100%',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: isDark ? 0.03 : 0.05,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: themeColors.primary,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: themeColors.primary,
    bottom: -100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: themeColors.highlight || themeColors.primary,
    top: '40%',
    right: -75,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -50,
  },
  illustration: {
    width: width * 0.8,
    height: width * 0.8,
    maxWidth: 320,
    maxHeight: 320,
    marginBottom: 50,
  },
  homeButton: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: themeColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
  },
  homeButtonText: {
    color: isDark ? themeColors.background : '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});