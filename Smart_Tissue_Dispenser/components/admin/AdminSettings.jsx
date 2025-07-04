import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const AdminSettingsTab = ({ settings, onToggle }) => {
  const { themeColors, isDark } = useThemeContext();

  const SettingItem = ({
    title,
    subtitle,
    value,
    onToggle,
    type = "switch",
    onPress,
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
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <SettingSection title="SYSTEM">
        <SettingItem
          title="Auto Refresh"
          subtitle="Automatically refresh dashboard data"
          value={settings.autoRefresh}
          onToggle={() => onToggle("autoRefresh")}
        />
        <SettingItem
          title="Push Notifications"
          subtitle="Receive device alerts on your device"
          value={settings.enablePushNotifications}
          onToggle={() => onToggle("enablePushNotifications")}
        />
        <SettingItem
          title="Real-time Updates"
          subtitle="Enable WebSocket for instant updates"
          value={settings.enableWebSocketUpdates}
          onToggle={() => onToggle("enableWebSocketUpdates")}
        />
      </SettingSection>

      <SettingSection title="DISPLAY">
        <SettingItem
          title="Advanced Statistics"
          subtitle="Show detailed device analytics"
          value={settings.showAdvancedStats}
          onToggle={() => onToggle("showAdvancedStats")}
        />
        <SettingItem
          title="Battery Percentage"
          subtitle="Display battery levels as percentages"
          value={settings.showBatteryPercentage}
          onToggle={() => onToggle("showBatteryPercentage")}
        />
        <SettingItem
          title="Compact View"
          subtitle="Show more devices in less space"
          value={settings.compactView}
          onToggle={() => onToggle("compactView")}
        />
      </SettingSection>

      <SettingSection title="ADVANCED">
        <SettingItem
          title="Refresh Interval"
          subtitle={`Current: ${settings.refreshInterval || 30} seconds`}
          type="button"
          onPress={() => {
            // Could implement interval picker modal here
            console.log("Open refresh interval picker");
          }}
        />
        <SettingItem
          title="Export Data"
          subtitle="Export user and system data"
          type="button"
          onPress={() => {
            // Could implement data export functionality
            console.log("Export data");
          }}
        />
        <SettingItem
          title="Reset Settings"
          subtitle="Reset all settings to default"
          type="button"
          onPress={() => {
            // Could implement settings reset
            console.log("Reset settings");
          }}
        />
      </SettingSection>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.7,
    letterSpacing: 0.5,
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
  },
  contentContainer: {
    paddingBottom: 20,
  },
});

export default AdminSettingsTab;
