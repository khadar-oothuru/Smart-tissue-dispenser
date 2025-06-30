import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  scanWiFiNetworks,
  getCurrentNetworkInfo,
  getWiFiScannerStatus,
  testWiFiModule,
  reinitializeWiFiModule,
} from "../services/wifiScanner";

/**
 * Enhanced WiFi Test Component with diagnostic capabilities
 * This component shows real WiFi scanning functionality with troubleshooting
 */
const WiFiTestComponent = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [scannerStatus, setScannerStatus] = useState(null);
  const [lastScanMethod, setLastScanMethod] = useState(null);

  useEffect(() => {
    // Get current network info and scanner status on component mount
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    try {
      const info = await getCurrentNetworkInfo();
      setNetworkInfo(info);

      const status = getWiFiScannerStatus();
      setScannerStatus(status);

      console.log("📱 WiFi Test Component initialized:", {
        networkInfo: info,
        scannerStatus: status,
      });
    } catch (error) {
      console.error("Error initializing WiFi test component:", error);
    }
  };
  const scanForNetworks = async () => {
    setIsScanning(true);
    try {
      console.log("🔍 Starting enhanced WiFi scan...");
      const result = await scanWiFiNetworks();

      console.log("📡 WiFi scan result:", result);
      setLastScanMethod(result.method || "unknown");

      if (result.success) {
        setNetworks(result.networks || []);
        setCurrentNetwork(result.currentNetwork);

        let message = `Found ${result.totalFound} WiFi networks`;
        if (result.warning) {
          message += `\n\n⚠️ ${result.warning}`;
        }
        if (result.method) {
          message += `\n\n📡 Method: ${result.method}`;
        }
        if (result.nativeModule === false) {
          message += `\n\n📱 Using fallback mode - native WiFi module not available`;
        }

        Alert.alert("WiFi Scan Complete", message);
      } else {
        setNetworks([]);
        let errorMessage = result.error || "Failed to scan for WiFi networks";

        if (result.suggestion) {
          errorMessage += `\n\n💡 ${result.suggestion}`;
        }

        Alert.alert("WiFi Scan Failed", errorMessage, [
          {
            text: "Run Diagnostics",
            onPress: () => runDiagnostics(),
          },
          {
            text: "Retry",
            onPress: () => scanForNetworks(),
          },
          {
            text: "OK",
            style: "cancel",
          },
        ]);
      }
    } catch (error) {
      console.error("❌ Error scanning WiFi:", error);
      Alert.alert("Error", "Failed to scan WiFi networks: " + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      console.log("🧪 Running WiFi diagnostics...");
      const diagnostics = await testWiFiModule();

      const isModuleWorking =
        diagnostics.moduleLoaded && diagnostics.moduleValidated;
      const hasErrors = diagnostics.errors && diagnostics.errors.length > 0;

      let message = `Module Status: ${
        isModuleWorking ? "✅ Working" : "❌ Issues Found"
      }\n`;
      message += `Platform: ${diagnostics.platform} ${diagnostics.version}\n`;

      if (
        diagnostics.availableMethods &&
        diagnostics.availableMethods.length > 0
      ) {
        message += `Methods: ${diagnostics.availableMethods.length} available\n`;
      }

      if (hasErrors) {
        message += `\n⚠️ Issues:\n${diagnostics.errors.join("\n")}`;
      }

      Alert.alert("WiFi Module Diagnostics", message, [
        ...(isModuleWorking
          ? []
          : [
              {
                text: "Try Fix",
                onPress: () => tryFixModule(),
              },
            ]),
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("❌ Diagnostics failed:", error);
      Alert.alert("Error", "Diagnostics failed: " + error.message);
    }
  };

  const tryFixModule = async () => {
    try {
      console.log("🔧 Attempting to fix WiFi module...");
      const success = reinitializeWiFiModule();

      if (success) {
        Alert.alert(
          "Fix Attempt",
          "WiFi module reinitialized successfully! Try scanning again.",
          [{ text: "Scan Now", onPress: () => scanForNetworks() }]
        );
      } else {
        Alert.alert(
          "Fix Failed",
          "Could not reinitialize WiFi module. This may be due to platform limitations."
        );
      }
    } catch (error) {
      console.error("❌ Fix attempt failed:", error);
      Alert.alert("Error", "Fix attempt failed: " + error.message);
    }
  };

  const refreshScan = async () => {
    setIsScanning(true);
    try {
      const result = await wifiScanner.refreshWiFiScan();

      if (result.success) {
        setNetworks(result.networks || []);
        Alert.alert(
          "Refresh Complete",
          `Updated scan found ${result.networks?.length || 0} networks`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Refresh failed");
    } finally {
      setIsScanning(false);
    }
  };

  const connectToNetwork = async (ssid) => {
    Alert.prompt(
      "WiFi Password",
      `Enter password for ${ssid}:`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: async (password) => {
            try {
              const result = await wifiScanner.connectToWiFiNetwork(
                ssid,
                password
              );

              Alert.alert(
                result.success ? "Success" : "Failed",
                result.message || result.error,
                [{ text: "OK" }]
              );

              if (result.success) {
                getCurrentNetworkInfo();
              }
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
      "secure-text"
    );
  };

  const getSignalIcon = (level) => {
    switch (level) {
      case "excellent":
        return "wifi";
      case "good":
        return "wifi";
      case "fair":
        return "wifi-outline";
      case "weak":
        return "wifi-off";
      default:
        return "wifi-outline";
    }
  };

  const getSignalColor = (level) => {
    switch (level) {
      case "excellent":
        return "#4CAF50";
      case "good":
        return "#8BC34A";
      case "fair":
        return "#FFC107";
      case "weak":
        return "#FF5722";
      default:
        return "#757575";
    }
  };

  const testWiFiLibrary = async () => {
    try {
      console.log("🧪 Testing WiFi library...");
      const result = await wifiScanner.testWiFiLibrary();

      Alert.alert(
        result.success ? "✅ Library Test" : "❌ Library Test Failed",
        result.success
          ? `WiFi library is working!\nCurrent SSID: ${
              result.currentSSID || "Not connected"
            }\nPlatform: ${result.platform}`
          : `Error: ${result.error}\nStep: ${result.step}\nPlatform: ${
              result.platform || Platform.OS
            }`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("❌ Test Error", `Failed to test library: ${error.message}`, [
        { text: "OK" },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WiFi Scanner Test (Expo Go)</Text>
        <Text style={styles.subtitle}>Limited functionality - Demo mode</Text>
        <Text style={styles.expoWarning}>
          ⚠️ For real WiFi features, use custom development client
        </Text>
      </View>
      {/* Current Network Info */}
      {networkInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Network</Text>
          <View style={styles.networkCard}>
            <View style={styles.networkInfo}>
              <Text style={styles.networkName}>
                {networkInfo.ssid || "Unknown Network"}
              </Text>
              <Text style={styles.networkType}>
                Type: {networkInfo.type} | IP: {networkInfo.ipAddress}
              </Text>
              <Text style={styles.networkStatus}>
                Connected: {networkInfo.isConnected ? "Yes" : "No"} | Internet:
                {networkInfo.isInternetReachable ? "Yes" : "No"}
              </Text>
            </View>
          </View>

          {wifiStrength && wifiStrength.success && (
            <View style={styles.strengthCard}>
              <Text style={styles.strengthTitle}>Signal Strength</Text>
              <View style={styles.strengthInfo}>
                <Ionicons
                  name={getSignalIcon(wifiStrength.signalLevel)}
                  size={24}
                  color={getSignalColor(wifiStrength.signalLevel)}
                />
                <Text style={styles.strengthText}>
                  {wifiStrength.signalStrength} dBm ({wifiStrength.signalLevel})
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
      {/* Scan Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WiFi Scanner</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={scanForNetworks}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="wifi" size={20} color="#FFF" />
            )}
            <Text style={styles.buttonText}>
              {isScanning ? "Scanning..." : "Scan Networks"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={refreshScan}
            disabled={isScanning}
          >
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={getCurrentNetworkInfo}
        >
          <Ionicons name="information-circle" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Update Network Info</Text>
        </TouchableOpacity>

        {/* Test WiFi Library Button */}
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testWiFiLibrary}
        >
          <Ionicons name="flask" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Test WiFi Library</Text>
        </TouchableOpacity>
      </View>
      {/* Scan Results */}
      {networks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Networks ({networks.length})
          </Text>
          {networks.map((network, index) => (
            <TouchableOpacity
              key={index}
              style={styles.networkItem}
              onPress={() => connectToNetwork(network.ssid)}
              disabled={Platform.OS === "ios"} // iOS doesn't support programmatic connection
            >
              <View style={styles.networkHeader}>
                <View style={styles.networkLeft}>
                  <Text style={styles.networkSSID}>{network.ssid}</Text>
                  <Text style={styles.networkDetails}>
                    {network.frequency} MHz •
                    {network.secure ? "Secured" : "Open"}
                  </Text>
                  {network.isCurrent && (
                    <Text style={styles.currentBadge}>Current Network</Text>
                  )}
                </View>
                <View style={styles.networkRight}>
                  <Ionicons
                    name={getSignalIcon(network.level)}
                    size={24}
                    color={getSignalColor(network.level)}
                  />
                  <Text style={styles.signalText}>{network.signal} dBm</Text>
                </View>
              </View>
              {network.secure && (
                <View style={styles.securityInfo}>
                  <Ionicons name="lock-closed" size={16} color="#FFC107" />
                  <Text style={styles.securityText}>Password Required</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      {/* Platform Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Information</Text>
        <Text style={styles.platformText}>Platform: {Platform.OS}</Text>
        <Text style={styles.platformText}>
          WiFi Connection:
          {Platform.OS === "android" ? "Supported" : "Settings Only"}
        </Text>
        <Text style={styles.platformText}>
          Network Scanning:
          {Platform.OS === "android" ? "Full Scan" : "Current Only"}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#E3F2FD",
  },
  section: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  networkCard: {
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  networkName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 4,
  },
  networkType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  networkStatus: {
    fontSize: 12,
    color: "#888",
  },
  strengthCard: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
  },
  strengthTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  strengthInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  strengthText: {
    fontSize: 14,
    color: "#666",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#007AFF",
    flex: 1,
  },
  infoButton: {
    backgroundColor: "#34C759",
  },
  testButton: {
    backgroundColor: "#FF9800",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  networkItem: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  networkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  networkLeft: {
    flex: 1,
  },
  networkRight: {
    alignItems: "center",
  },
  networkSSID: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  networkDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  currentBadge: {
    fontSize: 12,
    color: "#34C759",
    fontWeight: "500",
  },
  signalText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  securityText: {
    fontSize: 12,
    color: "#FFC107",
  },
  platformText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});

export default WiFiTestComponent;
