import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
import wifiScanner from "../../services/wifiScanner";

const NetworkStatus = () => {
  const { themeColors } = useThemeContext();
  const styles = createStyles(themeColors);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [scannerStatus, setScannerStatus] = useState(null);

  useEffect(() => {
    const checkNetwork = async () => {
      const info = await wifiScanner.getCurrentNetworkInfo();
      setNetworkInfo(info);
    };

    const checkScannerStatus = () => {
      const status = wifiScanner.getWiFiScannerStatus();
      setScannerStatus(status);
    };

    checkNetwork();
    checkScannerStatus();
    const interval = setInterval(checkNetwork, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!networkInfo) return null;

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <MaterialCommunityIcons
          name={networkInfo.isConnected ? "wifi" : "wifi-off"}
          size={16}
          color={networkInfo.isConnected ? "#4CAF50" : "#FF5722"}
        />
        <Text style={styles.text}>
          {networkInfo.isConnected ? "Connected" : "Offline"}
        </Text>
        {networkInfo.type && (
          <Text style={styles.typeText}>
            ({networkInfo.type === "WIFI" ? "WiFi" : networkInfo.type})
          </Text>
        )}
      </View>
      {networkInfo.ipAddress && (
        <Text style={styles.ipText}>IP: {networkInfo.ipAddress}</Text>
      )}
      {scannerStatus && (
        <View style={styles.scannerStatus}>
          <MaterialCommunityIcons
            name={
              scannerStatus.nativeWifiAvailable
                ? "check-circle"
                : "alert-circle"
            }
            size={12}
            color={scannerStatus.nativeWifiAvailable ? "#4CAF50" : "#FF9800"}
          />
          <Text style={styles.scannerText}>
            {scannerStatus.mode === "native"
              ? "Full WiFi Control"
              : "Basic WiFi (Fallback)"}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (themeColors) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 12,
      backgroundColor: themeColors.inputbg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    text: {
      fontSize: 14,
      color: themeColors.text,
      fontWeight: "500",
    },
    typeText: {
      fontSize: 12,
      color: themeColors.text,
      opacity: 0.7,
    },
    ipText: {
      fontSize: 12,
      color: themeColors.text,
      opacity: 0.6,
      marginTop: 4,
    },
    scannerStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    scannerText: {
      fontSize: 11,
      color: themeColors.text,
      opacity: 0.7,
    },
  });

export default NetworkStatus;
