/**
 * Correct Import and Usage Examples for WiFi Scanner
 * This shows the proper way to import and use the WiFi scanner functions
 */

// ✅ CORRECT IMPORT METHODS:

// Method 1: Default import (recommended)
import wifiScanner from "../services/wifiScanner";

// Method 2: Named imports (alternative)
import {
  getPermissionStatus,
  scanWiFiNetworks,
  connectToDeviceFromQR,
} from "../services/wifiScanner";

// ✅ CORRECT USAGE EXAMPLES:

// Using default import:
export const checkPermissions = async () => {
  try {
    // ✅ CORRECT - No .default needed
    const status = await wifiScanner.getPermissionStatus();
    console.log("Permission status:", status);
    return status;
  } catch (error) {
    console.error("Permission check error:", error);
    return null;
  }
};

// Using named import:
export const checkPermissionsNamed = async () => {
  try {
    // ✅ CORRECT - Direct function call
    const status = await getPermissionStatus();
    console.log("Permission status:", status);
    return status;
  } catch (error) {
    console.error("Permission check error:", error);
    return null;
  }
};

// ❌ INCORRECT USAGE EXAMPLES (these cause errors):

// DON'T do this:
// const status = await wifiScanner.default.getPermissionStatus(); // ❌ Error!

// DON'T do this:
// import wifiScanner from '../services/wifiScanner.jsx'; // ❌ Don't include .jsx

// ✅ COMPLETE WORKING EXAMPLE:

export const deviceDiscoveryExample = async () => {
  try {
    console.log("🔍 Starting device discovery...");

    // Check current mode
    const mode = wifiScanner.getCurrentMode();
    console.log("Current mode:", mode.mode);

    // Check permissions
    const permissions = await wifiScanner.getPermissionStatus();
    console.log("Permissions:", permissions.summary);

    if (!permissions.canScanWifi && mode.mode === "native") {
      console.log("Requesting WiFi permissions...");
      const permissionResult = await wifiScanner.requestWiFiPermissions();
      if (!permissionResult.success) {
        return {
          success: false,
          error: "WiFi permissions required",
          action: "open_settings",
        };
      }
    }

    // Scan for devices (works in both native and fallback mode)
    const deviceScan = await wifiScanner.scanLocalNetworkDevices();

    return {
      success: true,
      mode: mode.mode,
      permissions: permissions,
      devices: deviceScan.devices || [],
      message: `Found ${deviceScan.totalFound || 0} devices`,
    };
  } catch (error) {
    console.error("Device discovery error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ✅ QR CODE HANDLING EXAMPLE:

export const handleQRCodeScan = async (qrData) => {
  try {
    console.log("📱 Processing QR code...");

    // Validate QR code
    const validation = wifiScanner.validateAndParseQRCode(qrData);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        suggestion: validation.suggestion,
      };
    }

    console.log("QR code type:", validation.type);

    // Handle based on QR code type
    switch (validation.type) {
      case "wifi":
        // WiFi QR code
        const wifiResult = await wifiScanner.connectToWiFiFromQR(
          validation.data
        );
        return {
          success: wifiResult.success,
          type: "wifi",
          message: wifiResult.success
            ? `Connected to ${validation.data.ssid}`
            : wifiResult.error,
          data: validation.data,
        };

      case "device":
      case "ip":
      case "url":
      case "device_code":
        // Device QR code
        const deviceResult = await wifiScanner.connectToDeviceFromQR(qrData);
        return {
          success: deviceResult.success,
          type: "device",
          message: deviceResult.success
            ? `Device found: ${deviceResult.device.name}`
            : deviceResult.error,
          device: deviceResult.device,
        };

      default:
        return {
          success: false,
          error: `Unsupported QR code type: ${validation.type}`,
        };
    }
  } catch (error) {
    console.error("QR code handling error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ✅ COMPONENT USAGE EXAMPLE:

/*
// In your React component:

import React, { useState, useEffect } from 'react';
import { checkPermissions, deviceDiscoveryExample, handleQRCodeScan } from './wifiScannerUsage';

const DeviceDiscoveryScreen = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeDiscovery();
  }, []);

  const initializeDiscovery = async () => {
    setLoading(true);
    try {
      const result = await deviceDiscoveryExample();
      if (result.success) {
        setDevices(result.devices);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onQRCodeScanned = async (data) => {
    const result = await handleQRCodeScan(data);
    if (result.success) {
      if (result.type === 'device') {
        // Add device to list or show registration form
        console.log("Device found:", result.device);
      } else if (result.type === 'wifi') {
        // Show WiFi connection success
        console.log("WiFi connected:", result.data.ssid);
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <View>
      {loading && <Text>Scanning...</Text>}
      {error && <Text style={{color: 'red'}}>{error}</Text>}
      {devices.map(device => (
        <Text key={device.ip}>{device.hostname} - {device.ip}</Text>
      ))}
    </View>
  );
};
*/
