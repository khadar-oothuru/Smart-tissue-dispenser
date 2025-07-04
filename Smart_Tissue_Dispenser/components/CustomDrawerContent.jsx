import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  InteractionManager,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";

// import { CustomAlert } from "./common/CustomAlert";

const CustomDrawer = (props) => {
  const { logout } = useAuth();
  const { theme, setTheme, isDark, themeColors } = useThemeContext();

  const styles = getStyles(themeColors);

  // Get app version from app.json (fallback if Constants is not available)
  let appVersion = "1.0.0";
  try {
    const constants = require("expo-constants");
    appVersion =
      constants.default?.expoConfig?.version ||
      constants.expoConfig?.version ||
      "1.0.0";
  } catch {
    // If expo-constants is not available, fallback to default
    appVersion = "1.0.0";
  }

  const handleThemeChange = (value) => {
    setTheme(value);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View
      style={[
        styles.mainContainer,
        { backgroundColor: themeColors.background },
      ]}
    >
      <View style={{ flex: 1 }}>
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Simplified Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.headerIconContainer,
                  { backgroundColor: themeColors.primary + "18" },
                ]}
              >
                <MaterialIcons
                  name="settings"
                  size={20}
                  color={themeColors.primary}
                />
              </View>
              <Text
                style={[styles.headerTitle, { color: themeColors.heading }]}
              >
                Settings
              </Text>
            </View>
            {/* Horizontal Line */}
            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    themeColors.border || themeColors.text + "20",
                },
              ]}
            />
          </View>

          <View style={styles.content}>
            {/* Theme Switch Section */}
            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.glassSectionTitle,
                  { color: themeColors.heading },
                ]}
              >
                Theme Switch
              </Text>
              <View
                style={[
                  styles.glassToggleRow,
                  {
                    backgroundColor: isDark
                      ? themeColors.surface
                      : themeColors.background,
                    borderColor: isDark
                      ? themeColors.border
                      : "rgba(255, 255, 255, 0.2)",
                  },
                ]}
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
                <View style={styles.toggleContent}>
                  <View
                    style={[
                      styles.toggleIconContainer,
                      { backgroundColor: themeColors.primary + "18" },
                    ]}
                  >
                    <Ionicons
                      name={isDark ? "moon" : "sunny"}
                      size={14}
                      color={themeColors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.glassToggleLabel,
                      { color: themeColors.heading },
                    ]}
                  >
                    Dark Mode
                  </Text>
                </View>
                <Switch
                  value={theme === "dark" || (theme === "system" && isDark)}
                  onValueChange={(val) =>
                    handleThemeChange(val ? "dark" : "light")
                  }
                  trackColor={{
                    false: themeColors.primary + "33",
                    true: themeColors.primary,
                  }}
                  thumbColor={isDark ? "#fff" : "#fff"}
                  style={styles.modernSwitch}
                  ios_backgroundColor={themeColors.primary + "33"}
                />
              </View>
            </View>

            {/* Theme Settings Section */}
            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.glassSectionTitle,
                  { color: themeColors.heading },
                ]}
              >
                Theme Settings
              </Text>

              <View style={styles.themeOptionsContainer}>
                {["light", "dark", "system"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.glassThemeOption,
                      {
                        backgroundColor: isDark
                          ? themeColors.surface
                          : themeColors.background,
                        borderColor: isDark
                          ? themeColors.border
                          : "rgba(255, 255, 255, 0.2)",
                      },
                    ]}
                    onPress={() => handleThemeChange(option)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? [themeColors.surface, themeColors.background]
                          : [
                              "rgba(255, 255, 255, 0.9)",
                              "rgba(255, 255, 255, 0.6)",
                            ]
                      }
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View
                      style={[
                        styles.themeOptionIconContainer,
                        {
                          backgroundColor: themeColors.primary + "18",
                        },
                      ]}
                    >
                      {option === "light" && (
                        <MaterialIcons
                          name="lightbulb-outline"
                          size={18}
                          color={themeColors.primary}
                        />
                      )}
                      {option === "dark" && (
                        <Ionicons
                          name="moon"
                          size={18}
                          color={themeColors.primary}
                        />
                      )}
                      {option === "system" && (
                        <MaterialIcons
                          name="settings"
                          size={18}
                          color={themeColors.primary}
                        />
                      )}
                    </View>
                    <View style={styles.themeOptionContent}>
                      <Text
                        style={[
                          styles.glassThemeOptionText,
                          {
                            color: themeColors.heading,
                            fontWeight: theme === option ? "700" : "500",
                          },
                        ]}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                      <Text
                        style={[
                          styles.themeOptionDescription,
                          {
                            color: themeColors.text + "80",
                          },
                        ]}
                      >
                        {option === "light" && "Always use light theme"}
                        {option === "dark" && "Always use dark theme"}
                        {option === "system" && "Follow system settings"}
                      </Text>
                    </View>
                    {theme === option && (
                      <View
                        style={[
                          styles.selectedIndicator,
                          { backgroundColor: themeColors.primary },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#fff"
                          style={{ marginTop: 1 }}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </DrawerContentScrollView>
      </View>

      {/* Modern Glass Footer */}
      <View
        style={[
          styles.glassFooter,
          {
            backgroundColor: isDark
              ? themeColors.surface
              : themeColors.background,
            borderColor: isDark
              ? themeColors.border
              : "rgba(255, 255, 255, 0.2)",
          },
        ]}
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

        {/* App Version */}
        <View style={styles.glassVersionContainer}>
          <View
            style={[
              styles.versionIconContainer,
              { backgroundColor: themeColors.primary + "18" },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={themeColors.primary}
            />
          </View>
          <Text style={[styles.glassVersionText, { color: themeColors.text }]}>
            Version {appVersion}
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.glassLogoutButton,
            {
              backgroundColor: "#e74c3c",
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#e74c3c", "#c0392b"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Feather name="log-out" size={22} color="#fff" />
          <Text style={styles.glassLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomDrawer;

const getStyles = (theme) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flexGrow: 1,
      backgroundColor: theme.background,
      paddingBottom: 20,
    },

    // Simplified Header Styles
    headerSection: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 20,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    headerIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.heading,
    },
    divider: {
      height: 1,
      marginTop: 12,
      opacity: 0.3,
    },

    // Content
    content: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    sectionContainer: {
      marginBottom: 16,
    },
    glassSectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 10,
      letterSpacing: -0.2,
    },

    // Modern Glass Toggle Row
    glassToggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 12,
      padding: 10,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
    },
    toggleContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    toggleIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    glassToggleLabel: {
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: -0.1,
    },
    modernSwitch: {
      transform: [{ scaleX: 1.0 }, { scaleY: 1.0 }],
    },

    // Theme Options
    themeOptionsContainer: {
      gap: 10,
    },
    glassThemeOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      position: "relative",
      marginBottom: 2,
    },
    themeOptionIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    themeOptionContent: {
      flex: 1,
    },
    glassThemeOptionText: {
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    themeOptionDescription: {
      fontSize: 12,
      fontWeight: "500",
      opacity: 0.7,
    },
    selectedIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      top: 16,
      right: 16,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },

    // Modern Glass Footer
    glassFooter: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 14,
      padding: 12,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
    },
    glassVersionContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
      paddingVertical: 4,
    },
    versionIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 6,
    },
    glassVersionText: {
      fontSize: 12,
      fontWeight: "500",
      opacity: 0.8,
    },
    glassLogoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
      borderRadius: 10,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    glassLogoutText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      marginLeft: 10,
      letterSpacing: -0.2,
    },

    // Legacy styles (keeping for fallback)
    header: {
      padding: 10,
      backgroundColor: theme.background,
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: theme.border || "#ddd",
    },
    sectionTitle: {
      color: theme.heading,
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
      marginTop: 20,
    },
    toggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      backgroundColor: theme.inputbg,
      borderRadius: 10,
      padding: 15,
    },
    toggleLabel: {
      color: theme.heading,
      fontSize: 15,
    },
    themeOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: theme.inputbg,
      marginBottom: 10,
    },
    themeOptionText: {
      marginLeft: 10,
      fontSize: 15,
      color: theme.text,
    },
    selectedOption: {
      borderColor: theme.primary,
      borderWidth: 1,
    },
    selectedText: {
      color: theme.primary,
    },
    selectedSubText: {
      color: theme.primary,
      opacity: 0.8,
    },
    footer: {
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderColor: theme.border || "#ddd",
      padding: 20,
      paddingBottom: 30,
      elevation: 10,
    },
    versionContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      paddingVertical: 8,
    },
    versionText: {
      color: theme.text,
      fontSize: 14,
      marginLeft: 6,
      opacity: 0.7,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#e74c3c",
      padding: 12,
      borderRadius: 8,
      justifyContent: "center",
    },
    logoutText: {
      color: "#fff",
      fontSize: 16,
      marginLeft: 10,
    },
  });
