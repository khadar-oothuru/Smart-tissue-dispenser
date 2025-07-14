import React, { useMemo } from "react";
import DonutChart from "./Charts/DonutChart";
import useTheme from "../hooks/useThemeContext";
import { RefreshCw } from "lucide-react";
import {
  getBatteryAndPowerAlertCounts,
  getTissueAlertCounts,
} from "./AdminDashboard/LandingPageTop";

const DeviceStatusDistribution = ({
  realtimeStatus,
  selectedAlertType,
  onRefresh,
  isLoading,
}) => {
  const { themeColors } = useTheme();

  // Calculate alert distribution data
  const alertDistributionData = useMemo(() => {
    const totalDevices = Array.isArray(realtimeStatus)
      ? realtimeStatus.length
      : 0;

    if (selectedAlertType === "tissue") {
      // Use the same logic as in AdminDashboard.jsx for tissue counts
      const emptyCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter(
            (device) => (device.current_status || "").toLowerCase() === "empty"
          ).length
        : 0;
      const lowCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter(
            (device) => (device.current_status || "").toLowerCase() === "low"
          ).length
        : 0;
      const tamperCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter(
            (device) => (device.current_status || "").toLowerCase() === "tamper"
          ).length
        : 0;
      const fullCount = Array.isArray(realtimeStatus)
        ? realtimeStatus.filter(
            (device) => (device.current_status || "").toLowerCase() === "full"
          ).length
        : 0;

      return [
        { name: "Empty", value: emptyCount },
        { name: "Low", value: lowCount },
        { name: "Full", value: fullCount },
        { name: "Tamper", value: tamperCount },
      ];
    } else if (selectedAlertType === "battery") {
      const { criticalBatteryCount, lowBatteryCount, batteryOffCount } =
        getBatteryAndPowerAlertCounts(realtimeStatus);

      // Calculate good battery count
      const goodBatteryCount = Math.max(
        0,
        totalDevices - criticalBatteryCount - lowBatteryCount - batteryOffCount
      );

      return [
        { name: "Critical Battery", value: criticalBatteryCount },
        { name: "Low Battery", value: lowBatteryCount },
        { name: "Good Battery", value: goodBatteryCount },
        { name: "Battery Off", value: batteryOffCount },
      ];
    }

    return [];
  }, [realtimeStatus, selectedAlertType]);

  const chartTitle =
    selectedAlertType === "tissue"
      ? "Tissue Alert Distribution"
      : "Battery Alert Distribution";

  const totalAlerts = alertDistributionData
    .filter((item) => item.name !== "Full" && item.name !== "Good Battery")
    .reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative">
      <DonutChart
        data={alertDistributionData}
        title={chartTitle}
        centerValue={totalAlerts.toString()}
        centerLabel="Total Alerts"
        size={300}
      />
    </div>
  );
};

export default DeviceStatusDistribution;
