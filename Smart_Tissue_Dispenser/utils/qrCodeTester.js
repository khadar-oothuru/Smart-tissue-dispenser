/**
 * QR Code Testing and Debugging Utility
 * Use this to test different QR code formats and troubleshoot scanning issues
 */

import {
  validateAndParseQRCode,
  debugWiFiQRCode,
} from "../services/wifiScanner";

/**
 * Test various QR code formats to ensure proper parsing
 */
export const testQRCodeFormats = () => {
  const testCodes = [
    // Standard WiFi QR formats
    "WIFI:T:WPA;S:MyNetwork;P:mypassword;;",
    "WIFI:S:TestWiFi;T:WPA2;P:test123;;",
    "WIFI:T:WEP;S:OldNetwork;P:oldkey;;",
    "WIFI:T:nopass;S:OpenNetwork;P:;;",

    // Mobile phone generated WiFi QR (common variations)
    "WIFI:T:WPA2;S:Home_WiFi;P:password123;;",
    "WIFI:S:Guest Network;T:WPA;P:guestpass;H:false;;",

    // Device QR formats
    '{"ssid":"MyWiFi","password":"pass123","ip":"192.168.1.1"}',
    '{"ip":"192.168.1.100","hostname":"SmartDevice","type":"dispenser"}',

    // Simple formats
    "192.168.1.100",
    "DEVICE:192.168.1.100",
    "DEV-001:192.168.4.1",

    // Invalid formats (should fail gracefully)
    "random text",
    "",
    "http://example.com",
  ];

  console.log("🧪 Testing QR Code Formats:");
  console.log("================================");

  testCodes.forEach((code, index) => {
    console.log(`\n--- Test ${index + 1}: "${code}" ---`);

    // Test with the main validation function
    const result = validateAndParseQRCode(code);
    console.log(
      "Validation Result:",
      result.success ? "✅ SUCCESS" : "❌ FAILED"
    );

    if (result.success) {
      console.log("Type:", result.type);
      console.log("Data:", result.data);
      console.log("Action:", result.action);
      console.log("Message:", result.message);
    } else {
      console.log("Error:", result.error);
    }

    // Additional debug info for WiFi codes
    if (code.toUpperCase().startsWith("WIFI:")) {
      const debugInfo = debugWiFiQRCode(code);
      console.log("Debug Info:", debugInfo);
    }
  });

  console.log("\n================================");
  console.log("QR Code Format Testing Complete");
};

/**
 * Debug a specific QR code that's failing
 */
export const debugSpecificQRCode = (qrData) => {
  console.log("🔍 Debugging Specific QR Code:");
  console.log("Raw Data:", qrData);
  console.log("Data Type:", typeof qrData);
  console.log("Data Length:", qrData?.length || 0);
  console.log("First 100 chars:", qrData?.substring(0, 100) || "N/A");

  // Check for common issues
  const issues = [];

  if (!qrData) {
    issues.push("QR data is null or undefined");
  } else if (typeof qrData !== "string") {
    issues.push("QR data is not a string");
  } else {
    if (qrData.trim() !== qrData) {
      issues.push("QR data has leading/trailing whitespace");
    }

    if (qrData.includes("\n") || qrData.includes("\r")) {
      issues.push("QR data contains line breaks");
    }

    if (qrData.toUpperCase().startsWith("WIFI:")) {
      if (!qrData.endsWith(";;")) {
        issues.push("WiFi QR code should end with double semicolon");
      }

      const parts = qrData.substring(5).split(";");
      const hasSSID = parts.some((part) => part.toUpperCase().startsWith("S:"));
      if (!hasSSID) {
        issues.push("WiFi QR code missing SSID (S:) parameter");
      }
    }
  }

  if (issues.length > 0) {
    console.log("⚠️ Potential Issues Found:");
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  } else {
    console.log("✅ No obvious formatting issues detected");
  }

  // Test parsing
  const result = validateAndParseQRCode(qrData);
  console.log("Parse Result:", result);

  return {
    qrData,
    issues,
    parseResult: result,
    recommendations: getRecommendations(qrData, issues, result),
  };
};

/**
 * Get recommendations for fixing QR code issues
 */
const getRecommendations = (qrData, issues, parseResult) => {
  const recommendations = [];

  if (!parseResult.success) {
    if (qrData?.toUpperCase().startsWith("WIFI:")) {
      recommendations.push(
        "This appears to be a WiFi QR code. Ensure it follows the format: WIFI:T:WPA;S:NetworkName;P:Password;;"
      );
      recommendations.push(
        "Check that the SSID (S:) parameter is present and not empty"
      );
      recommendations.push(
        "Verify the QR code ends with double semicolons (;;)"
      );
    } else {
      recommendations.push(
        "If this is a WiFi QR code, it should start with 'WIFI:'"
      );
      recommendations.push(
        'If this is a device QR code, try JSON format: {"ip":"192.168.1.100"}'
      );
      recommendations.push(
        "For simple device connection, use just the IP address: 192.168.1.100"
      );
    }
  }

  if (issues.includes("QR data has leading/trailing whitespace")) {
    recommendations.push(
      "Remove any spaces before or after the QR code content"
    );
  }

  if (issues.includes("QR data contains line breaks")) {
    recommendations.push(
      "Remove any line breaks or newline characters from the QR code"
    );
  }

  return recommendations;
};

/**
 * Simulate mobile phone WiFi QR generation
 */
export const generateMobileWiFiQR = (
  ssid,
  password,
  security = "WPA2",
  hidden = false
) => {
  // Most mobile phones generate WiFi QR codes in this format
  const qrCode = `WIFI:T:${security};S:${ssid};P:${password};H:${hidden};;`;

  console.log("📱 Generated Mobile WiFi QR Code:");
  console.log("SSID:", ssid);
  console.log("Security:", security);
  console.log("Hidden:", hidden);
  console.log("QR Code:", qrCode);

  // Test the generated QR code
  const testResult = validateAndParseQRCode(qrCode);
  console.log("Test Result:", testResult.success ? "✅ Valid" : "❌ Invalid");

  return qrCode;
};

// Export for manual testing in console
export const runQRTests = () => {
  console.log("🚀 Running QR Code Tests...");
  testQRCodeFormats();

  console.log("\n🔧 Testing Mobile WiFi QR Generation:");
  generateMobileWiFiQR("Home_WiFi", "password123", "WPA2", false);
  generateMobileWiFiQR("Guest Network", "", "nopass", false);
  generateMobileWiFiQR("Hidden_Network", "secret", "WPA", true);
};
