import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import {
  testWiFiModule,
  reinitializeWiFiModule,
  scanWiFiNetworks,
  getCurrentNetworkInfo,
  getWiFiScannerStatus,
} from "../services/wifiScanner";

/**
 * WiFi Diagnostic Test Component
 * Use this component to test and diagnose WiFi functionality
 */
const WiFiDiagnosticTest = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      console.log("🧪 Running WiFi diagnostics...");

      const result = await testWiFiModule();
      setDiagnostics(result);

      console.log("🧪 Diagnostics completed:", result);
    } catch (error) {
      console.error("❌ Diagnostics failed:", error);
      Alert.alert("Error", "Diagnostics failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testNetworkInfo = async () => {
    try {
      setLoading(true);
      console.log("📶 Testing network info...");

      const info = await getCurrentNetworkInfo();
      setNetworkInfo(info);

      console.log("📶 Network info:", info);
    } catch (error) {
      console.error("❌ Network info failed:", error);
      Alert.alert("Error", "Network info failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testWiFiScan = async () => {
    try {
      setLoading(true);
      console.log("📡 Testing WiFi scan...");

      const results = await scanWiFiNetworks();
      setScanResults(results);

      console.log("📡 Scan results:", results);
    } catch (error) {
      console.error("❌ WiFi scan failed:", error);
      Alert.alert("Error", "WiFi scan failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const reinitializeModule = async () => {
    try {
      setLoading(true);
      console.log("🔄 Reinitializing WiFi module...");

      const success = reinitializeWiFiModule();

      if (success) {
        Alert.alert("Success", "WiFi module reinitialized successfully");
        // Re-run diagnostics
        await runDiagnostics();
      } else {
        Alert.alert("Failed", "WiFi module reinitialization failed");
      }
    } catch (error) {
      console.error("❌ Reinitialization failed:", error);
      Alert.alert("Error", "Reinitialization failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    const status = getWiFiScannerStatus();
    console.log("📱 WiFi Scanner Status:", status);
    Alert.alert("WiFi Scanner Status", JSON.stringify(status, null, 2));
  };

  const clearResults = () => {
    setDiagnostics(null);
    setScanResults(null);
    setNetworkInfo(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>WiFi Diagnostic Test</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={runDiagnostics}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Run Module Diagnostics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testNetworkInfo}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Network Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testWiFiScan}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test WiFi Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.warningButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={reinitializeModule}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Reinitialize Module</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={getStatusInfo}
        >
          <Text style={styles.buttonText}>Get Status Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}

      {diagnostics && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>Module Diagnostics</Text>
          <Text style={styles.resultText}>
            {JSON.stringify(diagnostics, null, 2)}
          </Text>
        </View>
      )}

      {networkInfo && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>Network Information</Text>
          <Text style={styles.resultText}>
            {JSON.stringify(networkInfo, null, 2)}
          </Text>
        </View>
      )}

      {scanResults && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>WiFi Scan Results</Text>
          <Text style={styles.resultText}>
            {JSON.stringify(scanResults, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  warningButton: {
    backgroundColor: "#FF9500",
  },
  infoButton: {
    backgroundColor: "#34C759",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#1976d2",
  },
  resultContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  resultText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#666",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 4,
  },
});

export default WiFiDiagnosticTest;
