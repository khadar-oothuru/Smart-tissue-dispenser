/**
 * Device Connection in Fallback Mode - Usage Guide
 *
 * This example shows how device connection works in fallback mode
 * and clarifies the difference between WiFi scanning and device connection.
 */

import wifiScanner from "../services/wifiScanner";

// ✅ Example 1: Understanding Current Mode
export const checkCurrentMode = () => {
  const mode = wifiScanner.getCurrentMode();

  console.log("📊 Current Mode:", mode);

  if (mode.mode === "fallback") {
    console.log("⚠️ Running in fallback mode:");
    console.log("- WiFi scanning shows demo networks");
    console.log("- WiFi connection requires manual setup");
    console.log("✅ Device connection and QR codes work normally");
  }

  return mode;
};

// ✅ Example 2: Device QR Code Scanning (Works in Both Modes)
export const handleDeviceQRCode = async (scannedData) => {
  console.log("📱 Scanned QR Code:", scannedData);

  // Test with different QR code formats that should work:
  const testQRCodes = [
    // Format 1: Plain IP address
    "192.168.1.100",

    // Format 2: Device JSON
    '{"ip": "192.168.1.100", "hostname": "SmartDispenser-01", "type": "Smart Dispenser"}',

    // Format 3: Device URL
    "http://192.168.1.100:80",

    // Format 4: Device code format
    "DISPENSER-01:192.168.1.100",

    // Format 5: WiFi QR code (will be detected as WiFi, not device)
    "WIFI:T:WPA;S:MyNetwork;P:password123;;",
  ];

  // Use the enhanced device connection function
  const result = await wifiScanner.connectToDeviceFromQR(scannedData);

  if (result.success) {
    console.log("✅ Device connection successful:", result.device);
    return {
      success: true,
      message: `Device found: ${result.device.name} at ${result.device.ip_address}`,
      device: result.device,
      action: "show_registration_form",
    };
  } else {
    console.error("❌ Device connection failed:", result.error);

    if (result.isWifiQR) {
      return {
        success: false,
        isWifiQR: true,
        message: "This is a WiFi QR code, not a device QR code",
        suggestion: "Use this to connect to WiFi, then scan for devices",
        wifiData: result.wifiData,
      };
    }

    return {
      success: false,
      message: result.error,
      suggestion: result.suggestion || "Check QR code format and try again",
    };
  }
};

// ✅ Example 3: Manual Device Connection (Works in Both Modes)
export const connectToDeviceManually = async (ipAddress) => {
  console.log(`🔍 Testing connection to ${ipAddress}...`);

  const result = await wifiScanner.testDeviceConnection(ipAddress);

  if (result.success) {
    console.log("✅ Device found:", result.device);
    return {
      success: true,
      message: `Device responding at ${ipAddress}`,
      device: result.device,
      responseTime: result.responseTime,
    };
  } else {
    console.error("❌ Device not reachable:", result.error);
    return {
      success: false,
      message: result.error,
      suggestion: result.suggestion,
    };
  }
};

// ✅ Example 4: WiFi vs Device Connection (Important Distinction)
export const demonstrateWiFiVsDevice = async () => {
  console.log("📊 Demonstrating WiFi vs Device Connection:");

  // 1. WiFi Scanning (affected by fallback mode)
  console.log("\n1. 📶 WiFi Scanning:");
  const wifiScan = await wifiScanner.scanWiFiNetworks();
  if (wifiScan.fallback) {
    console.log("⚠️ WiFi scan is in fallback mode - showing demo networks");
    console.log(
      "Networks shown:",
      wifiScan.networks.map((n) => n.ssid)
    );
  } else {
    console.log("✅ Real WiFi scan - showing actual networks");
  }

  // 2. Device Connection (NOT affected by fallback mode)
  console.log("\n2. 📱 Device Connection:");
  const deviceTest = await wifiScanner.testDeviceConnection("192.168.1.1"); // Test router
  if (deviceTest.success) {
    console.log("✅ Device connection works normally even in fallback mode");
    console.log("Found:", deviceTest.device);
  } else {
    console.log(
      "ℹ️ Device not found (this is normal if 192.168.1.1 doesn't exist)"
    );
  }

  // 3. Current Network Info (real in both modes)
  console.log("\n3. 🌐 Current Network Info:");
  const networkInfo = await wifiScanner.getCurrentNetworkInfo();
  console.log("Current network:", networkInfo?.ssid || "Not connected");
  console.log("IP address:", networkInfo?.ipAddress || "Unknown");

  return {
    wifiScanMode: wifiScan.fallback ? "fallback" : "native",
    deviceConnectionWorks: true, // Always works
    currentNetwork: networkInfo,
  };
};

// ✅ Example 5: Proper QR Code Format Examples
export const getValidQRCodeExamples = () => {
  const examples = {
    deviceQRCodes: {
      plainIP: "192.168.1.100",
      deviceJSON: JSON.stringify({
        ip: "192.168.1.100",
        hostname: "SmartDispenser-01",
        type: "Smart Dispenser",
        mac: "AA:BB:CC:DD:EE:FF",
      }),
      deviceURL: "http://192.168.1.100:8080",
      deviceCode: "DISPENSER-01:192.168.1.100",
    },
    wifiQRCode: "WIFI:T:WPA;S:MyNetwork;P:password123;;",
    invalidExamples: [
      "just some text", // Plain text
      "https://google.com", // Random URL
      "not-an-ip-address", // Invalid format
    ],
  };

  console.log("📋 Valid QR Code Examples:", examples);
  return examples;
};

// ✅ Example 6: Troubleshooting Device Connection Issues
export const troubleshootDeviceConnection = async (qrCodeData) => {
  console.log("🔧 Troubleshooting device connection...");

  const steps = [];

  // Step 1: Check current mode
  const mode = wifiScanner.getCurrentMode();
  steps.push({
    step: "Check Mode",
    result: mode.mode,
    issue:
      mode.mode === "fallback"
        ? "WiFi scanning limited, but device connection should work"
        : null,
  });

  // Step 2: Validate QR code
  const qrValidation = wifiScanner.validateAndParseQRCode(qrCodeData);
  steps.push({
    step: "QR Code Validation",
    result: qrValidation.success ? "Valid" : "Invalid",
    issue: qrValidation.success ? null : qrValidation.error,
    suggestion: qrValidation.suggestion,
  });

  if (qrValidation.success && qrValidation.data?.ip) {
    // Step 3: Test device connection
    const deviceTest = await wifiScanner.testDeviceConnection(
      qrValidation.data.ip
    );
    steps.push({
      step: "Device Connection Test",
      result: deviceTest.success ? "Reachable" : "Not Reachable",
      issue: deviceTest.success ? null : deviceTest.error,
      suggestion: deviceTest.suggestion,
    });
  }

  // Step 4: Check network connection
  const networkInfo = await wifiScanner.getCurrentNetworkInfo();
  steps.push({
    step: "Network Connection",
    result: networkInfo?.isConnected ? "Connected" : "Not Connected",
    issue: networkInfo?.isConnected ? null : "Device must be connected to WiFi",
    details: {
      network: networkInfo?.ssid || "Unknown",
      ip: networkInfo?.ipAddress || "Unknown",
    },
  });

  console.log("🔧 Troubleshooting Results:", steps);
  return {
    steps,
    overallStatus: steps.every((s) => !s.issue) ? "All Good" : "Issues Found",
    recommendations: [
      "Ensure device is powered on",
      "Check that both devices are on the same WiFi network",
      "Verify QR code contains valid device information",
      "Try manual IP entry if QR code fails",
    ],
  };
};

// Usage in your app:
/*
import { 
  checkCurrentMode, 
  handleDeviceQRCode, 
  connectToDeviceManually,
  troubleshootDeviceConnection 
} from './examples/deviceConnectionGuide';

// In your QR scanner component:
const onQRCodeScanned = async (data) => {
  const result = await handleDeviceQRCode(data);
  
  if (result.success) {
    // Device found - show registration form
    setDeviceToRegister(result.device);
    setShowRegistrationForm(true);
  } else if (result.isWifiQR) {
    // This is a WiFi QR code
    setMessage("This is a WiFi QR code. Use it to connect to WiFi first.");
  } else {
    // Error
    setErrorMessage(result.message);
    
    // Optional: Run troubleshooting
    const troubleshoot = await troubleshootDeviceConnection(data);
    console.log("Troubleshooting:", troubleshoot);
  }
};

// Check current mode on app start:
useEffect(() => {
  const mode = checkCurrentMode();
  if (mode.mode === "fallback") {
    setMessage("Running in demo mode. Device connection still works!");
  }
}, []);
*/
