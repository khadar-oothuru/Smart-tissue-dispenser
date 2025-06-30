/**
 * QR Code Debugging Helper
 * Use this to debug QR code issues in your app
 */

export const debugQRCode = (scannedData) => {
  console.log("🔍 QR Code Debug Information:");
  console.log("Raw data:", scannedData);
  console.log("Data type:", typeof scannedData);
  console.log("Data length:", scannedData?.length || 0);
  console.log("First 50 chars:", scannedData?.substring(0, 50));

  // Test if it's a valid QR code format
  const formats = {
    wifi: scannedData?.startsWith("WIFI:"),
    json: scannedData?.startsWith("{") && scannedData?.endsWith("}"),
    ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      scannedData?.trim()
    ),
    url: scannedData?.startsWith("http"),
    deviceCode: scannedData?.includes(":") && !scannedData?.startsWith("http"),
  };

  console.log("Detected formats:", formats);

  return {
    rawData: scannedData,
    detectedFormats: formats,
    recommendation: getRecommendation(formats),
  };
};

const getRecommendation = (formats) => {
  if (formats.wifi) return "This is a WiFi QR code - use for WiFi connection";
  if (formats.json)
    return "This is a JSON QR code - should work for device connection";
  if (formats.ip)
    return "This is an IP address - should work for device connection";
  if (formats.url) return "This is a URL - should work for device connection";
  if (formats.deviceCode)
    return "This is a device code - should work for device connection";
  return "Unknown format - may not be supported";
};

// Test with common QR code examples
export const testQRCodeFormats = () => {
  const testCodes = [
    "192.168.1.100", // Valid IP
    '{"ip":"192.168.1.100","hostname":"Device"}', // Valid JSON
    "WIFI:T:WPA;S:TestNetwork;P:password;;", // Valid WiFi
    "http://192.168.1.100:8080", // Valid URL
    "DEVICE-01:192.168.1.100", // Valid device code
    "random text", // Invalid
  ];

  console.log("🧪 Testing QR Code Formats:");
  testCodes.forEach((code, index) => {
    console.log(`\nTest ${index + 1}:`);
    const result = debugQRCode(code);
    console.log(`Input: ${code}`);
    console.log(`Recommendation: ${result.recommendation}`);
  });
};

// Call this function to test your QR code formats
// testQRCodeFormats();
