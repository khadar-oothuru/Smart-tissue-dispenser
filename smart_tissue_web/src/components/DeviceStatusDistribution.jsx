// import React, { useMemo } from "react";
// import { RefreshCw } from "lucide-react";
// import DonutChart from "./Charts/DonutChartw";

// const DeviceStatusDistribution = ({
//   realtimeStatus = [],
//   selectedAlertType = "tissue",
//   onRefresh,
//   isLoading = false,
// }) => {
//   // Alert Distribution Data (Realtime Only) - Memoized for performance
//   const alertDistributionData = useMemo(() => {
//     if (selectedAlertType === "tissue") {
//       // Tissue alerts distribution
//       let emptyCount = 0,
//         fullCount = 0,
//         lowCount = 0,
//         tamperCount = 0;

//       if (Array.isArray(realtimeStatus) && realtimeStatus.length > 0) {
//         realtimeStatus.forEach((device) => {
//           const status = device.current_status?.toLowerCase() || "";
//           switch (status) {
//             case "empty":
//               emptyCount++;
//               break;
//             case "full":
//               fullCount++;
//               break;
//             case "low":
//               lowCount++;
//               break;
//             case "tamper":
//               tamperCount++;
//               break;
//             default:
//               break;
//           }
//         });
//       }

//       return [
//         {
//           name: "Empty",
//           value: emptyCount,
//           color: "#FF4757",
//         },
//         {
//           name: "Low",
//           value: lowCount,
//           color: "#FF9F00",
//         },
//         {
//           name: "Full",
//           value: fullCount,
//           color: "#10B981",
//         },
//         {
//           name: "Tamper",
//           value: tamperCount,
//           color: "#8B5CF6",
//         },
//       ];
//     } else if (selectedAlertType === "battery") {
//       // Battery alerts distribution
//       let criticalBatteryCount = 0,
//         lowBatteryCount = 0,
//         mediumBatteryCount = 0,
//         goodBatteryCount = 0,
//         batteryOffCount = 0,
//         powerOffCount = 0;

//       if (Array.isArray(realtimeStatus) && realtimeStatus.length > 0) {
//         realtimeStatus.forEach((device) => {
//           // Enhanced power off detection logic
//           const isPowerOff = (powerStatus) => {
//             if (powerStatus === null || powerStatus === undefined) return false;
//             const status = String(powerStatus).trim().toLowerCase();
//             return ["off", "none", "", "0", "false"].includes(status);
//           };

//           const isNoPower = (powerStatus) => {
//             if (powerStatus === null || powerStatus === undefined) return false;
//             const status = String(powerStatus).trim().toLowerCase();
//             return status === "no";
//           };

//           // Power status logic
//           const powerStatus = device.power_status;
//           const deviceIsPowerOff = isPowerOff(powerStatus);
//           const deviceIsNoPower = isNoPower(powerStatus);

//           // Battery logic
//           const batteryCritical = device.battery_critical === 1;
//           const batteryLow = device.battery_low === 1;
//           const batteryPercentage =
//             typeof device.battery_percentage === "number"
//               ? device.battery_percentage
//               : null;

//           // Battery status classification based on percentage
//           let batteryStatus = null;

//           // Check for 0% battery first, regardless of power status
//           if (batteryPercentage === 0) {
//             batteryStatus = "battery_off";
//           } else if (
//             !deviceIsPowerOff &&
//             !deviceIsNoPower &&
//             batteryPercentage !== null
//           ) {
//             if (batteryPercentage > 0 && batteryPercentage <= 10) {
//               batteryStatus = "critical";
//             } else if (batteryPercentage > 10 && batteryPercentage <= 20) {
//               batteryStatus = "low";
//             } else if (batteryPercentage > 20 && batteryPercentage <= 50) {
//               batteryStatus = "medium";
//             } else if (batteryPercentage > 50) {
//               batteryStatus = "good";
//             }
//           }

//           // Count based on status - prioritize Battery Off over Power Off
//           if (batteryStatus === "battery_off") {
//             batteryOffCount++; // 0% battery gets its own category, even if power issues exist
//           } else if (deviceIsPowerOff || deviceIsNoPower) {
//             powerOffCount++; // Power status issues
//           } else if (batteryStatus === "critical" || batteryCritical) {
//             criticalBatteryCount++;
//           } else if (batteryStatus === "low" || batteryLow) {
//             lowBatteryCount++;
//           } else if (batteryStatus === "medium") {
//             mediumBatteryCount++;
//           } else if (batteryStatus === "good") {
//             goodBatteryCount++;
//           }
//         });
//       }

//       return [
//         {
//           name: "Battery Off",
//           value: batteryOffCount,
//           color: "#8B5CF6",
//         },
//         {
//           name: "Critical",
//           value: criticalBatteryCount,
//           color: "#FF3B30",
//         },
//         {
//           name: "Low",
//           value: lowBatteryCount,
//           color: "#FF9F00",
//         },
//         {
//           name: "Medium",
//           value: mediumBatteryCount,
//           color: "#FFD600",
//         },
//         {
//           name: "Good",
//           value: goodBatteryCount,
//           color: "#10B981",
//         },
//         {
//           name: "No Power",
//           value: powerOffCount,
//           color: "#6B46C1",
//         },
//       ];
//     }

//     return [];
//   }, [realtimeStatus, selectedAlertType]);

//   const title = `${
//     selectedAlertType === "tissue" ? "Tissue" : "Battery"
//   } Status Distribution`;
//   const totalDevices = Array.isArray(realtimeStatus)
//     ? realtimeStatus.length
//     : 0;

//   return (
//     <div className="card p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
//       <div className="flex justify-between items-center mb-6">
//         <h3 className="text-lg font-bold text-gray-800 dark:text-white">
//           {title}
//         </h3>
//         {onRefresh && (
//           <button
//             onClick={onRefresh}
//             disabled={isLoading}
//             className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//           >
//             <RefreshCw
//               className={`h-5 w-5 text-gray-500 dark:text-gray-400 ${
//                 isLoading ? "animate-spin" : ""
//               }`}
//             />
//           </button>
//         )}
//       </div>

//       <DonutChart
//         data={alertDistributionData}
//         title={title}
//         centerValue={totalDevices}
//         centerLabel="Total Devices"
//         size={280}
//       />
//     </div>
//   );
// };

// export default DeviceStatusDistribution;


// components/DeviceStatusDistribution.jsx
import React, { useMemo } from "react";
import DonutChart from "./Charts/DonutChart";
import useTheme from "../hooks/useThemeContext";
import { RefreshCw } from "lucide-react";
import { getBatteryAndPowerAlertCounts, getTissueAlertCounts } from "./AdminDashboard/LandingPageTop";

const DeviceStatusDistribution = ({ 
  realtimeStatus, 
  selectedAlertType, 
  onRefresh, 
  isLoading 
}) => {
  const { themeColors } = useTheme();

  // Calculate alert distribution data
  const alertDistributionData = useMemo(() => {
    const totalDevices = Array.isArray(realtimeStatus) ? realtimeStatus.length : 0;

    if (selectedAlertType === "tissue") {
      const { emptyCount, lowCount, tamperCount } = getTissueAlertCounts(realtimeStatus);
      
      // Calculate full count (devices that are not empty or low)
      const fullCount = Math.max(0, totalDevices - emptyCount - lowCount - tamperCount);

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

  const chartTitle = selectedAlertType === "tissue" 
    ? "Tissue Alert Distribution" 
    : "Battery Alert Distribution";

  const totalAlerts = alertDistributionData
    .filter(item => item.name !== "Full" && item.name !== "Good Battery")
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