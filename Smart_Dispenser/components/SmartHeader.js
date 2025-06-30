import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useWebSocketContext } from "../context/WebSocketContext";
import { getUbuntuFont } from "../utils/fonts";

const SmartHeader = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { themeColors } = useThemeContext();
  const { user } = useAuth();
  const { isConnected, unreadCount } = useWebSocketContext();

  const { background, text, primary } = themeColors;

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

  // Debug logging - you can remove this later


  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight + 10 : 10,
          backgroundColor: background,
        },
      ]}
    >
      <View style={styles.userInfoContainer}>
        <View style={[styles.profileImageContainer, { borderColor: primary }]}>
          <Image source={{ uri: profilePicture }} style={styles.profileImage} />
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
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingText, { color: text }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.waveEmoji, { color: text }]}>👋</Text>
          </View>
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: text }]}>{userName}</Text>
            {isAdmin && (
              <Text
                style={[
                  styles.roleText,
                  {
                    color: primary,
                    fontWeight: "bold",
                    fontSize: 13,
                    marginLeft: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  },
                ]}
              >
                {" "}
                (ADMIN)
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.iconsContainer}>
        {/* Connection Status Indicator */}
        <View
          style={[
            styles.connectionStatus,
            {
              backgroundColor: isConnected
                ? "rgba(76, 175, 80, 0.1)"
                : "rgba(255, 82, 82, 0.1)",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? "#4CAF50" : "#FF5252" },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isConnected ? "#4CAF50" : "#FF5252" },
            ]}
          >
            {isConnected ? "Live" : "Offline"}
          </Text>
        </View>

        {/* Notification Icon with Badge */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNotificationPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View>
            <Ionicons
              name={unreadCount > 0 ? "notifications" : "notifications-outline"}
              size={28}
              color={notificationIconColor}
            />
            {unreadCount > 0 && (
              <View
                style={[styles.badge, isAdmin && styles.adminNotificationBadge]}
              >
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDrawerOpen}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={35} color={text} />
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight - 50 : 0,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    gap: 6,
  },
  greetingText: {
    fontSize: 15,
    fontFamily: getUbuntuFont("bold"),
  },
  waveEmoji: {
    fontSize: 14,
    marginTop: 1,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontFamily: getUbuntuFont("medium"),
  },
  roleText: {
    fontSize: 12,
    fontFamily: getUbuntuFont("medium"),
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    marginRight: 8,
    position: "relative",
    padding: 4,
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
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
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
