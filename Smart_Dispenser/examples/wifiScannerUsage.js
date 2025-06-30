/**
 * WiFi Scanner Usage Examples
 * This file shows how to use the improved WiFi scanner functions
 */

import wifiScanner from "../services/wifiScanner";

// Example 1: Handling QR Code Scanning
export const handleQRCodeScan = async (scannedData) => {
  console.log("📱 QR Code scanned:", scannedData);

  // Validate and parse the QR code
  const qrResult = wifiScanner.validateAndParseQRCode(scannedData);

  if (!qrResult.success) {
    console.error("❌ Invalid QR code:", qrResult.error);
    return {
      success: false,
      message: qrResult.error,
      suggestion: qrResult.suggestion,
    };
  }

  console.log("✅ QR code parsed successfully:", qrResult);

  // Handle different QR code types
  switch (qrResult.type) {
    case "wifi":
      // WiFi network QR code - connect to WiFi
      console.log("📶 Connecting to WiFi from QR code...");
      const wifiResult = await wifiScanner.connectToWiFiFromQR(qrResult.data);
      return {
        success: wifiResult.success,
        type: "wifi_connection",
        message: wifiResult.success
          ? `Connected to WiFi: ${qrResult.data.ssid}`
          : `Failed to connect: ${wifiResult.error}`,
        data: qrResult.data,
      };

    case "device":
    case "ip":
    case "url":
    case "device_code":
      // Device QR code - add device
      console.log("📱 Adding device from QR code...");
      return {
        success: true,
        type: "device_addition",
        message: qrResult.message,
        data: qrResult.data,
        action: "show_device_registration_form",
      };

    case "mac":
      // MAC address - requires network scan
      console.log("📧 MAC address detected, scanning network...");
      const scanResult = await wifiScanner.scanLocalNetworkDevices();
      return {
        success: true,
        type: "mac_lookup",
        message: qrResult.message,
        data: qrResult.data,
        action: "scan_network_for_mac",
        scanResult: scanResult,
      };

    default:
      return {
        success: false,
        message: "Unknown QR code type",
      };
  }
};

// Example 2: WiFi Connection with Password Handling
export const connectToWiFiWithPrompt = async (ssid, password = null) => {
  console.log(`🔗 Attempting to connect to: ${ssid}`);

  // Try connection first
  const result = await wifiScanner.connectToWiFiNetwork(ssid, password, true);

  if (!result.success && result.requiresPassword && !password) {
    // Network requires password but none provided
    console.log("🔐 Password required for network");
    return {
      success: false,
      requiresPassword: true,
      networkInfo: result.networkInfo,
      message: "This network requires a password",
      action: "prompt_for_password",
    };
  }

  return result;
};

// Example 3: Enhanced Network Scanning
export const scanForDevicesAndNetworks = async () => {
  console.log("🔍 Starting comprehensive network scan...");

  try {
    // Get current network status
    const networkStatus = await wifiScanner.getDetailedNetworkStatus();
    console.log("📊 Network status:", networkStatus);

    if (!networkStatus.isConnected) {
      return {
        success: false,
        error: "Not connected to any network",
        suggestion: "Please connect to WiFi first",
      };
    }

    // Scan for WiFi networks
    const wifiScan = await wifiScanner.scanWiFiNetworks();
    console.log("📶 WiFi scan result:", wifiScan);

    // Scan for devices on current network
    const deviceScan = await wifiScanner.scanLocalNetworkDevices();
    console.log("📱 Device scan result:", deviceScan);

    return {
      success: true,
      networkStatus: networkStatus,
      wifiNetworks: wifiScan.networks || [],
      devices: deviceScan.devices || [],
      relevantDevices: deviceScan.relevantDevices || [],
      scanTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Scan error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Example 4: Device Registration Helper
export const registerDeviceFromScan = async (
  device,
  additionalInfo,
  userToken
) => {
  console.log("📱 Registering device:", device);

  try {
    // Format device for registration
    const deviceData = wifiScanner.formatDeviceForRegistration(
      device,
      additionalInfo
    );
    console.log("📋 Formatted device data:", deviceData);

    // Check if device is already registered
    const existingCheck = await wifiScanner.checkIfDeviceRegistered(
      userToken,
      deviceData.device_id
    );

    if (existingCheck.exists) {
      return {
        success: false,
        alreadyExists: true,
        message: `Device ${deviceData.device_id} is already registered`,
        existingDevice: existingCheck.device,
      };
    }

    // Validate device connection
    const validation = await wifiScanner.validateDeviceConnection(device);

    return {
      success: true,
      deviceData: deviceData,
      validation: validation,
      message: "Device ready for registration",
      action: "proceed_with_registration",
    };
  } catch (error) {
    console.error("❌ Device registration preparation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Example 5: WiFi Scanner Status Check
export const checkWiFiCapabilities = async () => {
  console.log("🔧 Checking WiFi scanner capabilities...");

  const status = wifiScanner.getWiFiScannerStatus();
  const permissions = await wifiScanner.getPermissionStatus();

  console.log("📊 Scanner status:", status);
  console.log("🔐 Permissions:", permissions);

  return {
    nativeWifiAvailable: status.nativeWifiAvailable,
    capabilities: status.capabilities,
    permissions: permissions,
    recommendations: status.recommendations,
    canScanWifi: permissions.canScanWifi,
    mode: status.mode,
  };
};

// Example 6: Generate WiFi QR Code
export const createWiFiQRCode = (networkInfo) => {
  console.log("📋 Generating WiFi QR code for:", networkInfo.ssid);

  const qrResult = wifiScanner.generateWiFiQRCode(
    networkInfo.ssid,
    networkInfo.password,
    networkInfo.security || "WPA",
    networkInfo.hidden || false
  );

  if (qrResult.success) {
    console.log("✅ QR code generated:", qrResult.qrData);
    return {
      success: true,
      qrData: qrResult.qrData,
      networkInfo: qrResult.networkInfo,
      instructions: qrResult.instructions,
    };
  } else {
    console.error("❌ QR code generation failed:", qrResult.error);
    return qrResult;
  }
};

// Example usage in a React component:
/*
import { handleQRCodeScan, connectToWiFiWithPrompt, scanForDevicesAndNetworks } from './examples/wifiScannerUsage';

// In your QR scanner component:
const onQRCodeScanned = async (data) => {
  const result = await handleQRCodeScan(data);
  
  if (result.success) {
    if (result.type === 'wifi_connection') {
      setStatusMessage(`Connected to ${result.data.ssid}`);
    } else if (result.type === 'device_addition') {
      // Show device registration form
      setDeviceToAdd(result.data);
      setShowRegistrationForm(true);
    }
  } else {
    setErrorMessage(result.message);
  }
};

// In your WiFi connection component:
const connectToNetwork = async (ssid, password) => {
  const result = await connectToWiFiWithPrompt(ssid, password);
  
  if (result.requiresPassword) {
    // Show password input dialog
    setShowPasswordDialog(true);
    setSelectedNetwork(result.networkInfo);
  } else if (result.success) {
    setStatusMessage(`Connected to ${ssid}`);
  } else {
    setErrorMessage(result.error);
  }
};
*/
