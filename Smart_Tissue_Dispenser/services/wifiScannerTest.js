/**
 * Test script for WiFi Scanner functionality
 * Use this to test the QR code scanning and device registration flow
 */

import {
  validateAndParseQRCode,
  processQRCodeForDeviceRegistration,
  continueAfterWiFiConnection,
  retryDeviceScan,
  registerSelectedDevice,
  getCurrentNetworkInfo,
  scanLocalNetworkDevices,
} from "./wifiScanner.jsx";

// Test QR code data
const TEST_QR_CODES = {
  wifi_standard: "WIFI:T:WPA;S:I Wont Tell;P:mypassword123;H:false;;",
  wifi_plaintext: "I Wont Tell mypassword123",
  wifi_phone_hotspot: "Galaxy M05 5740 khadar123",
  device_ip: "192.168.1.100",
  device_json:
    '{"ip":"192.168.1.100","hostname":"smart-dispenser-1","type":"Smart Dispenser"}',
};

/**
 * Test QR code parsing
 */
export const testQRCodeParsing = () => {
  console.log("🧪 Testing QR Code Parsing...\n");

  Object.entries(TEST_QR_CODES).forEach(([type, qrData]) => {
    console.log(`Testing ${type}:`, qrData);
    const result = validateAndParseQRCode(qrData);
    console.log("Result:", result);
    console.log("---\n");
  });
};

/**
 * Test WiFi QR code flow
 */
export const testWiFiQRFlow = async (token = "test-token") => {
  console.log("🧪 Testing WiFi QR Code Flow...\n");

  // Test with plain text WiFi credentials
  const qrData = "I Wont Tell mypassword123";

  console.log("1. Processing QR code...");
  const qrResult = await processQRCodeForDeviceRegistration(token, qrData);
  console.log("QR Result:", qrResult);

  if (qrResult.success && qrResult.type === "wifi") {
    console.log("\n2. Simulating user connecting to WiFi...");
    console.log("Instructions shown to user:");
    qrResult.instructions?.forEach((instruction, index) => {
      console.log(`  ${instruction}`);
    });

    console.log("\n3. Continuing after WiFi connection...");
    const continueResult = await continueAfterWiFiConnection(qrResult.wifiData);
    console.log("Continue Result:", continueResult);
  }
};

/**
 * Test device scanning
 */
export const testDeviceScanning = async () => {
  console.log("🧪 Testing Device Scanning...\n");

  console.log("1. Getting current network info...");
  const networkInfo = await getCurrentNetworkInfo();
  console.log("Network Info:", networkInfo);

  console.log("\n2. Scanning for devices...");
  const scanResult = await scanLocalNetworkDevices();
  console.log("Scan Result:", scanResult);

  console.log("\n3. Testing retry scan...");
  const retryResult = await retryDeviceScan();
  console.log("Retry Result:", retryResult);
};

/**
 * Test device registration
 */
export const testDeviceRegistration = async (token = "test-token") => {
  console.log("🧪 Testing Device Registration...\n");

  const testDevice = {
    ip: "192.168.1.100",
    hostname: "smart-dispenser-test",
    deviceType: "Smart Dispenser",
    mac: "00:11:22:33:44:55",
    port: 80,
  };

  const userInfo = {
    name: "Test Dispenser",
    room_number: "Room 101",
    floor_number: 1,
    tissue_type: "hand_towel",
  };

  console.log("Testing device registration...");
  const result = await registerSelectedDevice(token, testDevice, userInfo);
  console.log("Registration Result:", result);
};

/**
 * Run all tests
 */
export const runAllTests = async (token = "test-token") => {
  console.log("🧪 Running All WiFi Scanner Tests...\n");
  console.log("=" * 50);

  try {
    testQRCodeParsing();
    await testWiFiQRFlow(token);
    await testDeviceScanning();
    await testDeviceRegistration(token);

    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Export for use in other files
export default {
  testQRCodeParsing,
  testWiFiQRFlow,
  testDeviceScanning,
  testDeviceRegistration,
  runAllTests,
};
