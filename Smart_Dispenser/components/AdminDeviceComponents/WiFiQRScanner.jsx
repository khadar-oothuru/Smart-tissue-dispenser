import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const WiFiQRScanner = ({ onClose, onScanSuccess, onScanError, title }) => {
  const { themeColors } = useThemeContext();
  const styles = createStyles(themeColors);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    const getCameraPermissions = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log("📷 Camera permission status:", status);
        setHasPermission(status === "granted");
      } catch (error) {
        console.error("❌ Error requesting camera permission:", error);
        setHasPermission(false);
      }
    };

    // Request permissions when component mounts
    getCameraPermissions();
    setIsActive(true);
    setScanned(false); // Reset scan state when opening
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned || !isActive) return;

    setScanned(true);
    console.log("📱 QR Code scanned:", { type, data });

    try {
      // Import and use the validation function from wifiScanner service
      const { validateAndParseQRCode } = require("../../services/wifiScanner");
      const result = validateAndParseQRCode(data);

      console.log("📱 QR validation result:", result);

      if (result.success) {
        // Call the callback with the validated result
        if (onScanSuccess) {
          onScanSuccess(result);
        }
      } else {
        // Handle validation error - reset scan state to allow retry
        setTimeout(() => setScanned(false), 2000);

        if (onScanError) {
          onScanError(result.error || "Invalid QR code format");
        } else {
          Alert.alert(
            "Invalid QR Code",
            result.error || "QR code format not recognized. Please try again.",
            [{ text: "OK", onPress: () => setScanned(false) }]
          );
        }
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      // Reset scan state to allow retry
      setTimeout(() => setScanned(false), 2000);

      if (onScanError) {
        onScanError(
          error.message || "Failed to process QR code. Please try again."
        );
      } else {
        Alert.alert("Error", "Failed to process QR code. Please try again.", [
          { text: "OK", onPress: () => setScanned(false) },
        ]);
      }
    }
  };
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons
            name="camera-off"
            size={48}
            color="white"
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.text}>Camera permission denied</Text>
          <Text style={styles.subText}>
            Please enable camera access in settings to scan QR codes
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {title || "Scan WiFi or Device QR Code"}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {scanned && (
                <View style={styles.scannedOverlay}>
                  <Ionicons name="checkmark-circle" size={64} color="#00ff00" />
                  <Text style={styles.scannedText}>Scanned!</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.instructionText}>
              Point your camera at a WiFi QR code or device QR code
            </Text>
            {scanned && (
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

const createStyles = (themeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "black",
    },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    camera: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      paddingTop: 50,
    },
    title: {
      color: "white",
      fontSize: 18,
      fontWeight: "600",
      flex: 1,
    },
    closeButton: {
      backgroundColor: "rgba(0,0,0,0.7)",
      borderRadius: 20,
      padding: 8,
      marginLeft: 10,
    },
    scanArea: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scanFrame: {
      width: 280,
      height: 280,
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
    },
    scannedOverlay: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.8)",
      borderRadius: 20,
      padding: 20,
      zIndex: 10,
    },
    scannedText: {
      color: "#00ff00",
      fontSize: 16,
      fontWeight: "600",
      marginTop: 8,
    },
    corner: {
      position: "absolute",
      width: 30,
      height: 30,
      borderColor: "#00ff00",
      borderWidth: 4,
    },
    topLeft: {
      top: 0,
      left: 0,
      borderBottomWidth: 0,
      borderRightWidth: 0,
    },
    topRight: {
      top: 0,
      right: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderTopWidth: 0,
      borderLeftWidth: 0,
    },
    footer: {
      padding: 20,
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.8)",
    },
    instructionText: {
      color: "white",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 10,
    },
    subText: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 14,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 20,
    },
    rescanButton: {
      backgroundColor: themeColors.primary || "#667EEA",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      marginTop: 10,
    },
    rescanButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    text: {
      color: "white",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 10,
    },
    button: {
      backgroundColor: themeColors.primary || "#667EEA",
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
      marginTop: 20,
    },
    buttonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
  });

export default WiFiQRScanner;
