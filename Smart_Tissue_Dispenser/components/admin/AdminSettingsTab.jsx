import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const AdminSettings = ({ settings, onToggle, onSaveSetting }) => {
  const { themeColors, isDark } = useThemeContext();

  const SettingItem = ({
    title,
    subtitle,
    value,
    onToggle,
    type = "switch",
    onPress,
    icon,
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
          borderColor: themeColors.border,
        },
      ]}
      onPress={type === "button" ? onPress : undefined}
      activeOpacity={type === "button" ? 0.7 : 1}
    >
      {icon && (
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: themeColors.primary + "20" },
          ]}
        >
          <Ionicons name={icon} size={20} color={themeColors.primary} />
        </View>
      )}
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: themeColors.heading }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: themeColors.text }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {type === "switch" ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{
            false: isDark ? "#3A3A3C" : "#E5E5EA",
            true: themeColors.primary + "80",
          }}
          thumbColor={value ? themeColors.primary : "#F4F3F4"}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={themeColors.text} />
      )}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SettingSection title="SYSTEM PREFERENCES">
        <SettingItem
          icon="refresh-outline"
          title="Auto Refresh"
          subtitle="Automatically refresh dashboard data every 30 seconds"
          value={settings.autoRefresh}
          onToggle={() => onToggle("autoRefresh")}
        />
        <SettingItem
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Receive device alerts and system notifications"
          value={settings.enablePushNotifications}
          onToggle={() => onToggle("enablePushNotifications")}
        />
        <SettingItem
          icon="flash-outline"
          title="Real-time Updates"
          subtitle="Enable WebSocket connections for instant updates"
          value={settings.enableWebSocketUpdates}
          onToggle={() => onToggle("enableWebSocketUpdates")}
        />
      </SettingSection>

      <SettingSection title="DISPLAY PREFERENCES">
        <SettingItem
          icon="bar-chart-outline"
          title="Advanced Statistics"
          subtitle="Show detailed device analytics and charts"
          value={settings.showAdvancedStats}
          onToggle={() => onToggle("showAdvancedStats")}
        />
        <SettingItem
          icon="battery-half-outline"
          title="Battery Percentage"
          subtitle="Display exact battery levels instead of icons"
          value={settings.showBatteryPercentage}
          onToggle={() => onToggle("showBatteryPercentage")}
        />
        <SettingItem
          icon="grid-outline"
          title="Compact View"
          subtitle="Show more devices in less space on the dashboard"
          value={settings.compactView}
          onToggle={() => onToggle("compactView")}
        />
      </SettingSection>

      <SettingSection title="PERFORMANCE">
        <SettingItem
          icon="speedometer-outline"
          title="Data Caching"
          subtitle="Cache data locally to improve loading times"
          value={settings.enableDataCaching || true}
          onToggle={() => onToggle("enableDataCaching")}
        />
        <SettingItem
          icon="cloud-download-outline"
          title="Background Sync"
          subtitle="Sync data in background when app is not active"
          value={settings.backgroundSync || false}
          onToggle={() => onToggle("backgroundSync")}
        />
      </SettingSection>

      <SettingSection title="SECURITY">
        <SettingItem
          icon="lock-closed-outline"
          title="Auto Lock"
          subtitle="Automatically lock the app after inactivity"
          value={settings.autoLock || false}
          onToggle={() => onToggle("autoLock")}
        />
        <SettingItem
          icon="finger-print-outline"
          title="Biometric Login"
          subtitle="Use fingerprint or face recognition for quick access"
          value={settings.biometricLogin || false}
          onToggle={() => onToggle("biometricLogin")}
        />
      </SettingSection>

      <SettingSection title="ADVANCED">
        <SettingItem
          icon="bug-outline"
          title="Debug Mode"
          subtitle="Enable detailed logging for troubleshooting"
          value={settings.debugMode || false}
          onToggle={() => onToggle("debugMode")}
        />
        <SettingItem
          icon="download-outline"
          title="Export Data"
          subtitle="Download system data and logs"
          type="button"
          onPress={() => {
            // Implement data export functionality
            console.log("Export data functionality");
          }}
        />
        <SettingItem
          icon="refresh-circle-outline"
          title="Reset Settings"
          subtitle="Reset all settings to default values"
          type="button"
          onPress={() => {
            // Implement settings reset functionality
            console.log("Reset settings functionality");
          }}
        />
      </SettingSection>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 12,
    opacity: 0.7,
    paddingHorizontal: 4,
  },
  sectionContent: {
    gap: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
});

export default AdminSettings;
