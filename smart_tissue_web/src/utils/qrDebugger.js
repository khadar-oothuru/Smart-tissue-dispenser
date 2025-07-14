/**
 * QR Code Debugging Helper
 * Use this to debug QR code issues in your app
 */

export const debugQRCode = (scannedData) => {
  // QR Code Debug Information captured:
  // Raw data, data type, data length, first 50 chars

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

  // Detected formats logged internally

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

  // Testing QR Code Formats (results logged internally)
  const results = testCodes.map((code, index) => {
    const result = debugQRCode(code);
    return {
      test: index + 1,
      input: code,
      recommendation: result.recommendation,
    };
  });

  return results;
};

// Call this function to test your QR code formats
// testQRCodeFormats();
