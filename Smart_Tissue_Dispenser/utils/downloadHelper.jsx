// utils/downloadHelper.js
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export const downloadAnalyticsData = async (data, format, period) => {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const fileName = `analytics_${period}_${timestamp}.${format}`;

    let content;
    if (format === "csv") {
      // Convert to CSV
      content = convertToCSV(data);
    } else {
      // JSON format
      content = JSON.stringify(data, null, 2);
    }

    if (Platform.OS === "web") {
      // Web download
      const blob = new Blob([content], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Mobile download
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    }

    return true;
  } catch (_error) {
    // Download error tracked
    throw error;
  }
};

const convertToCSV = (data) => {
  if (!data || !data.data || data.data.length === 0) return "";

  const headers = [
    "Device ID",
    "Room",
    "Floor",
    "Device Name",
    "Period",
    "Total Entries",
    "Low Alerts",
    "High Alerts",
    "Medium Alerts",
    "Tamper Alerts",
  ];

  const rows = [];
  rows.push(headers.join(","));

  data.data.forEach((device) => {
    device.periods.forEach((period) => {
      rows.push(
        [
          device.device_id,
          device.room,
          device.floor,
          device.device_name,
          period.period_name,
          period.total_entries,
          period.low_alerts,
          period.high_alerts,
          period.medium_alerts,
          period.tamper_alerts,
        ].join(",")
      );
    });
  });

  return rows.join("\n");
};
