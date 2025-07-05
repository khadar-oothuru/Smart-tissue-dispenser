import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import EmptyState from "../common/EmptyState";
import AnalyticsFilters from "./AnalyticsFilters";
import DeviceTimeChart from "./DeviceTimeChart";
import DownloadButtons from "./DownloadButtons";
import { useDeviceStore } from "../../store/useDeviceStore";
import { useThemeContext } from "../../context/ThemeContext";

const TimeBasedTab = ({
  timeBasedData,
  devices,
  selectedPeriod,
  selectedDevice,
  onPeriodChange,
  onDeviceChange,
  onDownload,
  downloading,
  cancelled,
}) => {
  const { analyticsLoading } = useDeviceStore();
  const { themeColors, isDark } = useThemeContext();
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [alertType, setAlertType] = useState("tissue"); // "tissue" or "battery"

  // Debug timeBasedData changes
  React.useEffect(() => {
    // Data updated: tracking timeBasedData changes
  }, [
    timeBasedData,
    analyticsLoading,
    selectedPeriod,
    selectedDevice,
    alertType,
  ]);

  const handleToggleExport = () => {
    setShowExportOptions(!showExportOptions);
  };

  return (
    <View>
      <AnalyticsFilters
        selectedPeriod={selectedPeriod}
        selectedDevice={selectedDevice}
        devices={devices}
        onPeriodChange={onPeriodChange}
        onDeviceChange={onDeviceChange}
      />

      {/* Modern Glass-Style Toggle */}
      <View style={styles.glassToggleContainer}>
        <View
          style={[
            styles.glassCard,
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
            <View style={styles.toggleOption}>
              <View
                style={[
                  styles.toggleIconContainer,
                  {
                    backgroundColor:
                      alertType === "tissue"
                        ? themeColors.primary + "18"
                        : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name="water"
                  size={24}
                  color={
                    alertType === "tissue"
                      ? themeColors.primary
                      : themeColors.text + "66"
                  }
                />
              </View>
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color:
                      alertType === "tissue"
                        ? themeColors.primary
                        : themeColors.text + "99",
                    fontWeight: alertType === "tissue" ? "700" : "600",
                  },
                ]}
              >
                Tissue Alerts
              </Text>
            </View>

            <View style={styles.switchContainer}>
              <Switch
                value={alertType === "battery"}
                onValueChange={(val) => {
                  setAlertType(val ? "battery" : "tissue");
                }}
                trackColor={{
                  false: themeColors.primary + "33",
                  true: themeColors.primary,
                }}
                thumbColor={alertType === "battery" ? "#fff" : "#fff"}
                style={styles.modernSwitch}
                ios_backgroundColor={themeColors.primary + "33"}
              />
            </View>

            <View style={styles.toggleOption}>
              <View
                style={[
                  styles.toggleIconContainer,
                  {
                    backgroundColor:
                      alertType === "battery"
                        ? themeColors.primary + "18"
                        : "transparent",
                  },
                ]}
              >
                
                <Ionicons
                  name="battery-charging-outline"
                  size={22}
                  color={
                    alertType === "battery"
                      ? themeColors.primary
                      : themeColors.text + "66"
                  }
                />
              </View>
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color:
                      alertType === "battery"
                        ? themeColors.primary
                        : themeColors.text + "99",
                    fontWeight: alertType === "battery" ? "700" : "600",
                  },
                ]}
              >
                Battery Alerts
              </Text>
            </View>
          </View>
        </View>
      </View>
      {/* Modern Glass-Style Export Button */}
      <View style={styles.exportSection}>
        <Pressable
          style={[
            styles.glassExportButton,
            {
              backgroundColor: isDark
                ? themeColors.surface
                : themeColors.background,
              borderColor: isDark
                ? themeColors.border
                : "rgba(255, 255, 255, 0.2)",
            },
          ]}
          onPress={handleToggleExport}
        >
          <LinearGradient
            colors={
              isDark
                ? [themeColors.surface, themeColors.background]
                : [themeColors.primary + "15", themeColors.primary + "05"]
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.exportButtonContent}>
            <View
              style={[
                styles.exportIconContainer,
                {
                  backgroundColor: themeColors.primary + "18",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={showExportOptions ? "download-off" : "download"}
                size={24}
                color={themeColors.primary}
              />
            </View>
            <View style={styles.exportTextContainer}>
              <Text
                style={[
                  styles.exportButtonTitle,
                  { color: themeColors.heading },
                ]}
              >
                {showExportOptions ? "Hide Export Options" : "Export Data"}
              </Text>
              <Text
                style={[
                  styles.exportButtonSubtitle,
                  { color: themeColors.text + "99" },
                ]}
              >
                Download analytics in various formats
              </Text>
            </View>
            <MaterialCommunityIcons
              name={showExportOptions ? "chevron-up" : "chevron-down"}
              size={20}
              color={themeColors.primary}
            />
          </View>
        </Pressable>
      </View>
      {/* Show Download Buttons only when export is toggled */}
      {showExportOptions && (
        <DownloadButtons
          onDownload={onDownload}
          isLoading={analyticsLoading}
          downloading={downloading}
          cancelled={cancelled}
        />
      )}
      {/* Chart Data Section */}
      {analyticsLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading analytics data...
          </Text>
        </View>
      ) : timeBasedData && timeBasedData.data?.length > 0 ? (
        <View style={styles.chartsContainer}>
          {timeBasedData.data.map((deviceData, index) => (
            <DeviceTimeChart
              key={`${deviceData.device_id}_${index}_${selectedPeriod}_${alertType}`}
              deviceData={deviceData}
              alertType={alertType}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="chart-line"
          message="No data available for the selected period"
          description={`Try selecting a different time period${
            selectedDevice !== "all" ? " or device" : ""
          }`}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Glass-Style Components
  glassToggleContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  glassCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  toggleIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  switchContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modernSwitch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },

  // Charts Container
  chartsContainer: {
    marginBottom: 16,
  },

  // Export Section Glass Style
  exportSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  glassExportButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
  },
  exportButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  exportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  exportTextContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  exportButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 2,
    textAlign: "center",
  },
  exportButtonSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.8,
    textAlign: "center",
  },

  // Loading styles
  loadingContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.7,
  },

  // Legacy styles (keeping for compatibility)
  modernToggleContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  toggleTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  toggleGrid: {
    flexDirection: "row",
    gap: 16,
  },
  modernToggleCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 140,
    justifyContent: "center",
  },
  activeToggleCard: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  // Legacy styles (keeping for compatibility)
  legacyToggleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  toggleCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  toggleCardSubtitle: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
  },

  // Legacy styles (keeping for any fallback)
  segmentedControlContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    position: "relative",
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 2,
    minHeight: 48,
  },
  activeSegment: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  // Legacy styles (keeping for compatibility)
  toggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  exportContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 10,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
  },
});

export default TimeBasedTab;
