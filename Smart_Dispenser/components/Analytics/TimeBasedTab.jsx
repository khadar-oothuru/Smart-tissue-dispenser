import React, { useState } from "react";
import {
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import EmptyState from "../common/EmptyState";
import AnalyticsFilters from "./AnalyticsFilters";
import DeviceTimeChart from "./DeviceTimeChart";
import DownloadButtons from "./DownloadButtons";
import useDeviceStore from "../../store/useDeviceStore";
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
  const { themeColors } = useThemeContext();
  const [showExportOptions, setShowExportOptions] = useState(false);

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
      {/* Export Data Button */}
      <View
        style={[
          styles.exportContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.exportButton,
            { backgroundColor: themeColors.primary },
          ]}
          onPress={handleToggleExport}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={showExportOptions ? "download-off" : "download"}
            size={20}
            color="#fff"
          />
          <Text style={styles.exportButtonText}>
            {showExportOptions ? "Hide Export Options" : "Export Data"}
          </Text>
          <MaterialCommunityIcons
            name={showExportOptions ? "chevron-up" : "chevron-down"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
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
      {timeBasedData && timeBasedData.data?.length > 0 ? (
        <View>
          {timeBasedData.data.map((deviceData) => (
            <DeviceTimeChart
              key={deviceData.device_id}
              deviceData={deviceData}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="chart-line"
          message="No data available for the selected period"
          description="Try selecting a different time period or device"
        />
      )}
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
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
