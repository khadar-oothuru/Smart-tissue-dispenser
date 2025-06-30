/**
 * Permission Debugger Utility
 * Helps debug WiFi permission issues and provides detailed status information
 */

import { Platform, PermissionsAndroid } from "react-native";
import wifiScanner from "../services/wifiScanner";

export const debugPermissions = async () => {
  console.log("🔍 === PERMISSION DEBUG REPORT ===");
  console.log(`📱 Platform: ${Platform.OS} ${Platform.Version}`);

  if (Platform.OS !== "android") {
    console.log("✅ iOS - No special permissions needed");
    return;
  }

  // Check Android permission constants
  console.log("\n📋 Available Permission Constants:");
  const constants = [
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION",
    "ACCESS_WIFI_STATE",
    "CHANGE_WIFI_STATE",
    "ACCESS_BACKGROUND_LOCATION",
  ];

  constants.forEach((permission) => {
    const value = PermissionsAndroid.PERMISSIONS[permission];
    console.log(
      `  ${permission}: ${value ? "✅ Available" : "❌ Not Available"}`
    );
  });

  // Get detailed permission status
  console.log("\n🔐 Permission Status Check:");
  try {
    const status = await wifiScanner.getPermissionStatus();
    console.log("Status result:", JSON.stringify(status, null, 2));

    console.log(`\n📊 Summary: ${status.summary}`);
    console.log(`🌐 Can Scan WiFi: ${status.canScanWifi ? "✅ Yes" : "❌ No"}`);

    if (status.essential && status.essential.length > 0) {
      console.log("\n🔒 Essential Permissions:");
      status.essential.forEach((perm) => {
        console.log(
          `  ${perm.permission}: ${perm.granted ? "✅ Granted" : "❌ Denied"}`
        );
      });
    }

    if (status.optional && status.optional.length > 0) {
      console.log("\n📍 Optional Permissions:");
      status.optional.forEach((perm) => {
        console.log(
          `  ${perm.permission}: ${
            perm.granted ? "✅ Granted" : "⚠️ Denied (OK)"
          }`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error checking permissions:", error);
  }

  // Test network connectivity
  console.log("\n🌐 Network Status Check:");
  try {
    const networkInfo = await wifiScanner.getCurrentNetworkInfo();
    console.log(`Connected: ${networkInfo?.isConnected ? "✅ Yes" : "❌ No"}`);
    console.log(`Type: ${networkInfo?.type || "Unknown"}`);
    if (networkInfo?.ssid) {
      console.log(`Current WiFi: ${networkInfo.ssid}`);
    }
  } catch (error) {
    console.error("❌ Error checking network:", error);
  }

  console.log("\n🔍 === END DEBUG REPORT ===");
};

export const quickPermissionCheck = async () => {
  try {
    const check = await wifiScanner.checkWiFiPermissions();
    console.log(
      `🔐 Quick Permission Check: ${
        check.granted ? "✅ Ready" : "❌ Needs Permissions"
      }`
    );
    return check.granted;
  } catch (error) {
    console.error("❌ Quick check failed:", error);
    return false;
  }
};

export const testWiFiScan = async () => {
  console.log("📡 Testing WiFi Scan...");
  try {
    const result = await wifiScanner.scanWiFiNetworks();
    if (result.success) {
      console.log(
        `✅ Scan successful: Found ${result.networks?.length || 0} networks`
      );
      return true;
    } else {
      console.log(`❌ Scan failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Scan test failed:", error);
    return false;
  }
};
