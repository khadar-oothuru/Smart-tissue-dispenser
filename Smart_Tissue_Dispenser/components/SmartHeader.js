import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useNavigation } from "expo-router";
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useWebSocketContext } from "../context/WebSocketContext";
import { getUbuntuFont } from "../utils/fonts";

const { width: screenWidth } = Dimensions.get("window");

const SmartHeader = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { themeColors, isDark } = useThemeContext();
  const { user } = useAuth();
  const { isConnected, unreadCount } = useWebSocketContext();

  const { text, primary } = themeColors;

  // Responsive design breakpoints
  const isSmallScreen = screenWidth < 360;
  const isMediumScreen = screenWidth >= 360 && screenWidth < 600;

  // Responsive sizing
  const getResponsiveSizes = () => {
    if (isSmallScreen) {
      return {
        profileSize: 56,
        iconSize: 20,
        buttonSize: 38,
        fontSize: { greeting: 12, userName: 13, status: 9 },
        spacing: { horizontal: 12, vertical: 8 },
        margins: { profile: 8, icons: 10 },
      };
    } else if (isMediumScreen) {
      return {
        profileSize: 64,
        iconSize: 22,
        buttonSize: 42,
        fontSize: { greeting: 13, userName: 14, status: 10 },
        spacing: { horizontal: 14, vertical: 10 },
        margins: { profile: 10, icons: 12 },
      };
    } else {
      return {
        profileSize: 68,
        iconSize: 24,
        buttonSize: 46,
        fontSize: { greeting: 14, userName: 15, status: 10 },
        spacing: { horizontal: 16, vertical: 12 },
        margins: { profile: 12, icons: 14 },
      };
    }
  };

  const responsiveSizes = getResponsiveSizes();

  // Updated to handle role-based navigation
  const handleNotificationPress = () => {
    if (user?.role === "admin") {
      router.push("/notifications");
      console.log("Admin notifications accessed");
    } else {
      router.push("/user-notifications");
      console.log("User notifications accessed");
    }
  };

  const handleDrawerOpen = () => {
    if (navigation.openDrawer) {
      navigation.openDrawer();
    } else {
      console.warn("Drawer navigation is not available");
    }
  };

  const userName = user?.username || " ";
  const profilePicture =
    user?.profile_picture ||
    "https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  // Add role-based styling
  const isAdmin = user?.role === "admin";
  const notificationIconColor = isAdmin ? primary : text;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight + 8 : 8,
          backgroundColor: isDark
            ? themeColors.surface
            : themeColors.background,
          paddingHorizontal: responsiveSizes.spacing.horizontal,
          paddingVertical: responsiveSizes.spacing.vertical,
          minHeight: Platform.OS === "android" ? 70 : 80,
        },
      ]}
    >
      {/* Glass Background Effect */}
      <LinearGradient
        colors={
          isDark
            ? [themeColors.surface + "F0", themeColors.background + "E0"]
            : ["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.8)"]
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.userInfoContainer}>
        <View
          style={[
            styles.profileImageContainer,
            {
              borderColor: primary,
              width: responsiveSizes.profileSize,
              height: responsiveSizes.profileSize,
              borderRadius: responsiveSizes.profileSize / 2,
              marginRight: responsiveSizes.margins.profile,
            },
          ]}
        >
          <Image
            source={{ uri: profilePicture }}
            style={[
              styles.profileImage,
              {
                width: responsiveSizes.profileSize - 8,
                height: responsiveSizes.profileSize - 8,
                borderRadius: (responsiveSizes.profileSize - 8) / 2,
              },
            ]}
          />
          {/* Admin indicator badge */}
          {isAdmin && (
            <View
              style={[
                styles.adminBadge,
                {
                  backgroundColor: primary,
                  borderColor: "#FFFFFF",
                  borderWidth: 2,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  width: isSmallScreen ? 20 : 24,
                  height: isSmallScreen ? 20 : 24,
                  borderRadius: isSmallScreen ? 10 : 12,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={isSmallScreen ? 12 : 16}
                color="#FFFFFF"
              />
            </View>
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0, marginLeft: 4 }}>
          <View style={styles.greetingContainer}>
            <Text
              style={[
                styles.greetingText,
                {
                  color: text,
                  fontSize: responsiveSizes.fontSize.greeting,
                  lineHeight: responsiveSizes.fontSize.greeting * 1.2,
                },
              ]}
            >
              {getGreeting()}
            </Text>
            <Text
              style={[
                styles.waveEmoji,
                {
                  color: text,
                  fontSize: responsiveSizes.fontSize.greeting,
                  marginLeft: 2,
                },
              ]}
            >
              👋
            </Text>
          </View>
          <View style={styles.userNameContainer}>
            <Text
              style={[
                styles.userName,
                {
                  color: text,
                  fontSize: responsiveSizes.fontSize.userName,
                  lineHeight: responsiveSizes.fontSize.userName * 1.15,
                },
              ]}
              numberOfLines={1}
            >
              {userName}
            </Text>
            {isAdmin && (
              <Text
                style={[
                  styles.roleText,
                  {
                    color: primary,
                    fontWeight: "bold",
                    fontSize: isSmallScreen ? 9 : 11,
                    marginLeft: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  },
                ]}
                numberOfLines={1}
              >
                {isSmallScreen ? "ADM" : "(ADMIN)"}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.iconsContainer, { gap: isSmallScreen ? 10 : 14 }]}>
        {/* Connection Status Indicator */}
        <View
          style={[
            styles.connectionStatus,
            {
              backgroundColor: isConnected
                ? "rgba(76, 175, 80, 0.1)"
                : "rgba(255, 82, 82, 0.1)",
              paddingHorizontal: isSmallScreen ? 4 : 6,
              paddingVertical: isSmallScreen ? 2 : 4,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isConnected ? "#4CAF50" : "#FF5252",
                width: isSmallScreen ? 4 : 6,
                height: isSmallScreen ? 4 : 6,
                borderRadius: isSmallScreen ? 2 : 3,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: isConnected ? "#4CAF50" : "#FF5252",
                fontSize: responsiveSizes.fontSize.status,
              },
            ]}
          >
            {isConnected ? "Live" : "Offline"}
          </Text>
        </View>

        {/* Notification Icon with Badge - Plain Style */}
        <TouchableOpacity
          style={[
            styles.plainIconButton,
            {
              width: responsiveSizes.buttonSize,
              height: responsiveSizes.buttonSize,
            },
          ]}
          onPress={handleNotificationPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <View>
            <Ionicons
              name={unreadCount > 0 ? "notifications" : "notifications-outline"}
              size={responsiveSizes.iconSize + 6}
              color={notificationIconColor}
            />
            {unreadCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: primary,
                    minWidth: isSmallScreen ? 18 : 24,
                    height: isSmallScreen ? 18 : 24,
                    borderRadius: isSmallScreen ? 9 : 12,
                    top: isSmallScreen ? -4 : -6,
                    right: isSmallScreen ? -4 : -6,
                  },
                  isAdmin && styles.adminNotificationBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { fontSize: isSmallScreen ? 9 : 11 },
                  ]}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.glassIconButton,
            {
              backgroundColor: isDark
                ? themeColors.surface
                : themeColors.background,
              borderColor: isDark
                ? themeColors.border
                : "rgba(255, 255, 255, 0.3)",
              width: responsiveSizes.buttonSize,
              height: responsiveSizes.buttonSize,
              borderRadius: responsiveSizes.buttonSize / 2,
            },
          ]}
          onPress={handleDrawerOpen}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={
              isDark
                ? [themeColors.surface, themeColors.background]
                : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.6)"]
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons
            name="menu-outline"
            size={responsiveSizes.iconSize}
            color={text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight - 50 : 0,
    overflow: "hidden",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    position: "relative",
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  adminBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  greetingText: {
    fontSize: 14,
    fontFamily: getUbuntuFont("medium"),
  },
  waveEmoji: {
    fontSize: 12,
    marginTop: 1,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  userName: {
    fontSize: 15,
    fontFamily: getUbuntuFont("bold"),
  },
  roleText: {
    fontSize: 12,
    fontFamily: getUbuntuFont("medium"),
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    marginRight: 8,
    position: "relative",
    padding: 4,
  },
  // Plain Icon Button (for notification)
  plainIconButton: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    padding: 4,
  },
  // Enhanced Glass Icon Button
  glassIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: "relative",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: getUbuntuFont("medium"),
    letterSpacing: 0.3,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3838",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // Enhanced Glass Badge
  glassBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  adminNotificationBadge: {
    backgroundColor: "#FF6B6B",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: getUbuntuFont("bold"),
  },
});

export default SmartHeader;
