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
 * Tests WiFi scanning functionality and provides troubleshooting
 */
const EnhancedWiFiTestComponent = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [scannerStatus, setScannerStatus] = useState(null);
  const [lastScanMethod, setLastScanMethod] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    try {
      console.log("🔄 Initializing WiFi Test Component...");

      const info = await getCurrentNetworkInfo();
      setNetworkInfo(info);

      const status = getWiFiScannerStatus();
      setScannerStatus(status);

      console.log("✅ WiFi Test Component initialized:", {
        networkInfo: info,
        scannerStatus: status,
      });
    } catch (error) {
      console.error("❌ Error initializing WiFi test component:", error);
      Alert.alert("Initialization Error", error.message);
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

        let message = `Found ${
          result.totalFound || result.networks?.length || 0
        } WiFi networks`;
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
      const result = await testWiFiModule();
      setDiagnostics(result);

      const isModuleWorking = result.moduleLoaded && result.moduleValidated;
      const hasErrors = result.errors && result.errors.length > 0;

      let message = `Module Status: ${
        isModuleWorking ? "✅ Working" : "❌ Issues Found"
      }\n`;
      message += `Platform: ${result.platform} ${result.version}\n`;

      if (result.availableMethods && result.availableMethods.length > 0) {
        message += `Methods: ${result.availableMethods.length} available\n`;
      }

      if (hasErrors) {
        message += `\n⚠️ Issues:\n${result.errors.join("\n")}`;
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
        // Refresh status after fix
        await initializeComponent();
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

  const getSignalColor = (level) => {
    switch (level) {
      case "excellent":
        return "#4CAF50";
      case "good":
        return "#8BC34A";
      case "fair":
        return "#FF9800";
      case "weak":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
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
        return "wifi-outline";
      default:
        return "wifi-outline";
    }
  };

  const renderNetworkItem = (network, index) => (
    <View key={index} style={styles.networkItem}>
      <View style={styles.networkHeader}>
        <Ionicons
          name={getSignalIcon(network.level)}
          size={24}
          color={getSignalColor(network.level)}
        />
        <Text style={styles.networkName}>{network.ssid}</Text>
        {network.isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </View>
      <View style={styles.networkDetails}>
        <Text style={styles.networkDetail}>
          Signal: {network.signal} dBm ({network.level})
        </Text>
        <Text style={styles.networkDetail}>
          Security: {network.secure ? "🔒 Secured" : "🔓 Open"}
        </Text>
        {network.frequency && (
          <Text style={styles.networkDetail}>
            Frequency: {network.frequency} MHz
          </Text>
        )}
        {network.fallback && (
          <Text style={styles.fallbackBadge}>📱 Fallback Mode</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Enhanced WiFi Scanner Test</Text>

      {/* Current Network Information */}
      {networkInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Connection:</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: networkInfo.isConnected ? "#4CAF50" : "#F44336" },
                ]}
              >
                {networkInfo.isConnected ? "✅ Connected" : "❌ Disconnected"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Internet:</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: networkInfo.isInternetReachable
                      ? "#4CAF50"
                      : "#F44336",
                  },
                ]}
              >
                {networkInfo.isInternetReachable
                  ? "✅ Available"
                  : "❌ Not Available"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{networkInfo.type}</Text>
            </View>

            {networkInfo.ipAddress && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>IP Address:</Text>
                <Text style={styles.infoValue}>{networkInfo.ipAddress}</Text>
              </View>
            )}

            {networkInfo.ssid && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>WiFi Network:</Text>
                <Text style={styles.infoValue}>{networkInfo.ssid}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Native WiFi:</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: networkInfo.nativeWifiAvailable
                      ? "#4CAF50"
                      : "#F44336",
                  },
                ]}
              >
                {networkInfo.nativeWifiAvailable
                  ? "✅ Available"
                  : "❌ Not Available"}
              </Text>
            </View>

            {networkInfo.connectionDetails?.signal && (
              <View style={styles.signalRow}>
                <Ionicons
                  name={getSignalIcon(
                    networkInfo.connectionDetails.signalLevel
                  )}
                  size={24}
                  color={getSignalColor(
                    networkInfo.connectionDetails.signalLevel
                  )}
                />
                <Text style={styles.signalText}>
                  {networkInfo.connectionDetails.signal} dBm (
                  {networkInfo.connectionDetails.signalLevel})
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Scanner Status */}
      {scannerStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scanner Status</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform:</Text>
              <Text style={styles.infoValue}>
                {scannerStatus.platform} v{scannerStatus.version}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Native Module:</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: scannerStatus.nativeModuleAvailable
                      ? "#4CAF50"
                      : "#F44336",
                  },
                ]}
              >
                {scannerStatus.nativeModuleAvailable
                  ? "✅ Available"
                  : "❌ Not Available"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Can Scan:</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: scannerStatus.capabilities?.canScanNetworks
                      ? "#4CAF50"
                      : "#F44336",
                  },
                ]}
              >
                {scannerStatus.capabilities?.canScanNetworks
                  ? "✅ Yes"
                  : "❌ No"}
              </Text>
            </View>

            {lastScanMethod && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Method:</Text>
                <Text style={styles.infoValue}>{lastScanMethod}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              isScanning && styles.buttonDisabled,
            ]}
            onPress={scanForNetworks}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="wifi" size={20} color="#FFF" />
            )}
            <Text style={styles.buttonText}>
              {isScanning ? "Scanning..." : "Scan WiFi Networks"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.diagnosticButton]}
            onPress={runDiagnostics}
          >
            <Ionicons name="build" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Run Diagnostics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.refreshButton]}
            onPress={initializeComponent}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* WiFi Networks List */}
      {networks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Found Networks ({networks.length})
          </Text>
          {networks.map((network, index) => renderNetworkItem(network, index))}
        </View>
      )}

      {/* Diagnostics Results */}
      {diagnostics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Diagnostics</Text>
          <View style={styles.diagnosticsCard}>
            <Text style={styles.diagnosticsText}>
              {JSON.stringify(diagnostics, null, 2)}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    margin: 16,
    color: "#333",
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  signalText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  diagnosticButton: {
    backgroundColor: "#FF9500",
  },
  refreshButton: {
    backgroundColor: "#34C759",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  networkItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  networkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  networkName: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
    color: "#333",
  },
  currentBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  networkDetails: {
    gap: 4,
  },
  networkDetail: {
    fontSize: 14,
    color: "#666",
  },
  fallbackBadge: {
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "600",
  },
  diagnosticsCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  diagnosticsText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#333",
  },
});

export default EnhancedWiFiTestComponent;
