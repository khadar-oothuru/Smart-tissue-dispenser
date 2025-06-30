import { useState } from "react";
import { Alert } from "react-native";

export const useAnalyticsDownloads = (
  downloadCSVAnalytics,
  downloadJSONAnalytics,
  downloadPDFAnalytics,
  accessToken
) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format, period = "weekly", deviceId = null) => {
    if (!accessToken) {
      Alert.alert("Error", "No authentication token available");
      return;
    }

    setDownloading(true);
    try {
      let result;

      switch (format.toLowerCase()) {
        case "csv":
          result = await downloadCSVAnalytics(accessToken, period, deviceId);
          break;
        case "json":
          result = await downloadJSONAnalytics(accessToken, period, deviceId);
          break;
        case "pdf":
          result = await downloadPDFAnalytics(accessToken, period, deviceId);
          break;
        default:
          throw new Error("Unsupported format");
      }

      if (result?.success) {
        Alert.alert("Success", result.message);
      }
    } catch (error) {
      Alert.alert(
        "Download Failed",
        error.message || `Failed to download ${format.toUpperCase()} file`
      );
    } finally {
      setDownloading(false);
    }
  };

  return {
    downloading,
    handleDownload,
  };
};
