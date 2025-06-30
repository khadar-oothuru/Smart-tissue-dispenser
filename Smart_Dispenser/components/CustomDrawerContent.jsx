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
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={{ flex: 1 }}>
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Theme Switch</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Dark Mode</Text>
              <Switch
                value={theme === "dark" || (theme === "system" && isDark)}
                onValueChange={(val) =>
                  handleThemeChange(val ? "dark" : "light")
                }
                trackColor={{ false: "#767577", true: themeColors.primary }}
                thumbColor={isDark ? themeColors.primary : "#f4f3f4"}
              />
            </View>

            <Text style={styles.sectionTitle}>Theme Settings</Text>
            {["light", "dark", "system"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.themeOption,
                  theme === option && styles.selectedOption,
                ]}
                onPress={() => handleThemeChange(option)}
              >
                {option === "light" && (
                  <MaterialIcons
                    name="lightbulb-outline"
                    size={20}
                    color={
                      theme === option ? themeColors.primary : themeColors.text
                    }
                  />
                )}
                {option === "dark" && (
                  <Ionicons
                    name="moon"
                    size={20}
                    color={
                      theme === option ? themeColors.primary : themeColors.text
                    }
                  />
                )}
                {option === "system" && (
                  <MaterialIcons
                    name="settings"
                    size={20}
                    color={
                      theme === option ? themeColors.primary : themeColors.text
                    }
                  />
                )}
                <Text
                  style={[
                    styles.themeOptionText,
                    theme === option && styles.selectedText,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </DrawerContentScrollView>
      </View>
      {/* Footer always at the bottom, but scrolls if content is too tall */}
      <View style={styles.footer}>
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={themeColors.text}
          />
          <Text style={styles.versionText}>Version {appVersion}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
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
    },
    header: {
      padding: 10,
      backgroundColor: theme.background,
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: theme.border || "#ddd",
    },
    headerTitle: {
      color: theme.heading,
      fontSize: 18,
      fontWeight: "bold",
    },
    content: {
      padding: 20,
      paddingBottom: 120,
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
    // ...existing code...
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
    // ...existing code...
  });
