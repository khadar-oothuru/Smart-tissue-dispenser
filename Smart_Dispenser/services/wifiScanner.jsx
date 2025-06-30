/**
 * WiFi Scanner Service with Expo compatibility
 * Provides WiFi scanning functionality with graceful fallbacks
 * - Uses react-native-wifi-reborn when available (custom dev client/production)
 * - Falls back to Expo Network API when native modules unavailable (Expo Go)
 */

import * as Network from "expo-network";
import { Platform, Linking, PermissionsAndroid } from "react-native";

// Import API functions
import { registerDeviceViaWiFi, checkDeviceStatus } from "../utils/api";

// Production-ready logging configuration
const isDev = __DEV__;
const enableVerboseLogging = isDev && false; // Disable verbose logging even in development for cleaner output

const log = {
  info: (message, ...args) => {
    if (enableVerboseLogging) console.log(message, ...args);
  },
  warn: (message, ...args) => {
    console.warn(message, ...args); // Always show warnings
  },
  error: (message, ...args) => {
    console.error(message, ...args); // Always show errors
  },
  debug: (message, ...args) => {
    if (enableVerboseLogging) console.log("🔍", message, ...args);
  },
};

// Debug permission constants to identify null values
if (Platform.OS === "android") {
  log.info("📱 Android Permission Constants Check:");
  log.info(
    "ACCESS_FINE_LOCATION:",
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  log.info(
    "ACCESS_COARSE_LOCATION:",
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
  );
  log.info(
    "ACCESS_WIFI_STATE:",
    PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE
  );
  log.info(
    "CHANGE_WIFI_STATE:",
    PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE
  );
  log.info(
    "ACCESS_BACKGROUND_LOCATION:",
    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
  );

  // Check if any are null/undefined
  const nullPermissions = [];
  if (!PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    nullPermissions.push("ACCESS_FINE_LOCATION");
  if (!PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
    nullPermissions.push("ACCESS_COARSE_LOCATION");
  if (!PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE)
    nullPermissions.push("ACCESS_WIFI_STATE");
  if (!PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE)
    nullPermissions.push("CHANGE_WIFI_STATE");
  if (!PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION)
    nullPermissions.push("ACCESS_BACKGROUND_LOCATION");

  if (nullPermissions.length > 0) {
    console.warn("⚠️ Null/undefined permissions detected:", nullPermissions);
  } else {
    console.log("✅ All permission constants are valid");
  }
}

// Enhanced WiFi manager loading with better detection
let WifiManager = null;
let isWifiManagerAvailable = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

const initializeWifiManager = () => {
  initializationAttempts++;

  try {
    log.info(
      `🔄 Attempting WiFi manager initialization (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})`
    );

    // Reset previous state
    WifiManager = null;
    isWifiManagerAvailable = false;

    // Try multiple import methods for better compatibility
    let WifiReborn = null;    // Method 1: Direct require with proper error handling
    try {
      WifiReborn = require("react-native-wifi-reborn");
      log.info("✅ Direct require successful");
      
      // Validate the module structure
      if (WifiReborn && typeof WifiReborn === 'object') {
        log.info("📱 WiFi module structure:", Object.keys(WifiReborn));
      }
    } catch (directError) {
      log.warn("⚠️ Direct require failed:", directError.message);
      
      // Method 2: Try alternative import
      try {
        const { default: WifiDefault, ...WifiMethods } = require("react-native-wifi-reborn");
        WifiReborn = WifiDefault || WifiMethods;
        log.info("✅ Alternative import successful");
      } catch (altError) {
        log.warn("⚠️ Alternative import failed:", altError.message);
      }
    }    if (!WifiReborn) {
      throw new Error("react-native-wifi-reborn module not found or not accessible. Make sure it's properly installed and linked.");
    }

    // Extract WiFi manager - try different access patterns
    WifiManager = WifiReborn.default || WifiReborn;
    
    // If WifiManager is still not valid, try accessing methods directly
    if (!WifiManager || typeof WifiManager !== 'object') {
      WifiManager = WifiReborn;
    }

    if (!WifiManager) {
      throw new Error("WiFi manager object not found in module. The module may not be properly linked.");
    }

    log.info("📱 WiFi Manager object loaded, validating methods...");
    log.info("📱 Available methods:", Object.keys(WifiManager));

    // Comprehensive validation of required methods
    const requiredMethods = [
      "loadWifiList",
      "getCurrentWifiSSID",
      "getFrequency",
      "getCurrentSignalStrength",
      "getBSSID",
    ];

    const availableMethods = Object.keys(WifiManager);
    const missingMethods = requiredMethods.filter(
      (method) => typeof WifiManager[method] !== "function"
    );

    if (missingMethods.length > 0) {
      console.warn("⚠️ Missing critical methods:", missingMethods);
      // Don't fail completely if only some methods are missing
      if (typeof WifiManager.loadWifiList !== "function") {
        throw new Error("Critical method 'loadWifiList' not available");
      }
    }

    // Test the critical method
    if (typeof WifiManager.loadWifiList !== "function") {
      throw new Error("loadWifiList method not available or not a function");
    }

    isWifiManagerAvailable = true;
    log.info("✅ Native WiFi manager loaded and validated successfully");
    log.info(
      `📱 Methods validated: ${availableMethods.length} total, ${
        requiredMethods.length - missingMethods.length
      }/${requiredMethods.length} required methods available`
    );

    return true;
  } catch (error) {
    console.warn(
      `⚠️ Native WiFi manager initialization failed (attempt ${initializationAttempts}):`,
      error.message
    );

    WifiManager = null;
    isWifiManagerAvailable = false;

    // Log detailed error information
    log.error("WiFi Manager initialization error details:", {
      message: error.message,
      stack: error.stack,
      attempt: initializationAttempts,
      platform: Platform.OS,
      version: Platform.Version,
    });

    return false;
  }
};

// Initialize WiFi manager on module load with retry capability
let wifiInitialized = initializeWifiManager();
log.info(
  `📱 WiFi Manager Initial Initialization: ${
    wifiInitialized ? "SUCCESS" : "FAILED"
  }`
);

// Provide a function to retry initialization if needed
export const retryWifiManagerInitialization = () => {
  if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
    log.warn("⚠️ Maximum initialization attempts reached");
    return false;
  }

  log.info("🔄 Retrying WiFi manager initialization...");
  wifiInitialized = initializeWifiManager();
  return wifiInitialized;
};

// Permission state cache to avoid redundant checks
let permissionCache = {
  granted: false,
  lastChecked: 0,
  cacheTimeout: 5000, // 5 seconds cache
};

/**
 * Get valid WiFi permissions for the current platform
 */
const getWiFiPermissions = () => {
  if (Platform.OS !== "android") {
    return [];
  }

  const permissionList = [];

  // Essential permissions for WiFi scanning (location permissions)
  if (PermissionsAndroid.PERMISSIONS?.ACCESS_FINE_LOCATION) {
    permissionList.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    log.info("✅ Added ACCESS_FINE_LOCATION");
  } else {
    console.warn("⚠️ ACCESS_FINE_LOCATION not available");
  }

  if (PermissionsAndroid.PERMISSIONS?.ACCESS_COARSE_LOCATION) {
    permissionList.push(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
    log.info("✅ Added ACCESS_COARSE_LOCATION");
  } else {
    console.warn("⚠️ ACCESS_COARSE_LOCATION not available");
  }

  // Note: ACCESS_WIFI_STATE and CHANGE_WIFI_STATE are normal permissions (not dangerous)
  // They are granted automatically at install time and don't need runtime permission requests
  // They may not be available in PermissionsAndroid constants in some React Native versions

  log.info(`📱 Essential WiFi permissions found: ${permissionList.length}`);
  return permissionList;
};

/**
 * Get optional permissions that enhance functionality but aren't required
 */
const getOptionalWiFiPermissions = () => {
  if (Platform.OS !== "android") {
    return [];
  }

  const optionalPermissions = [];

  // Background location is optional and only needed for advanced features
  // It's commonly denied and not essential for basic WiFi scanning
  if (
    Platform.Version >= 29 &&
    PermissionsAndroid.PERMISSIONS?.ACCESS_BACKGROUND_LOCATION
  ) {
    optionalPermissions.push(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
    );
    log.info("📍 Added optional ACCESS_BACKGROUND_LOCATION (Android 10+)");
  }

  return optionalPermissions;
};

/**
 * Reset permission cache - call this when permissions might have changed
 */
export const resetPermissionCache = () => {
  permissionCache = {
    granted: false,
    lastChecked: 0,
    cacheTimeout: 5000,
  };
  log.info("🔄 Permission cache reset");
};

/**
 * Get signal strength level description
 */
export const getSignalLevel = (signal) => {
  if (signal > -50) return "excellent";
  if (signal > -60) return "good";
  if (signal > -70) return "fair";
  return "weak";
};

/**
 * Get current network information with proper fallbacks
 */
export const getCurrentNetworkInfo = async () => {
  try {
    log.info("📶 Getting current network information...");

    // Get basic network state from Expo
    const networkState = await Network.getNetworkStateAsync();
    const ipAddress = await Network.getIpAddressAsync();

    log.info("📶 Network state:", {
      isConnected: networkState.isConnected,
      type: networkState.type,
      isInternetReachable: networkState.isInternetReachable,
      ipAddress: ipAddress,
    });

    let currentSSID = null;
    let connectionDetails = {};

    // Use react-native-wifi-reborn for detailed WiFi information if available
    if (
      networkState.type === Network.NetworkStateType.WIFI &&
      WifiManager &&
      isWifiManagerAvailable
    ) {
      try {
        log.info("📱 Using native WiFi manager for detailed info...");

        // Get current WiFi SSID - try multiple times with different approaches
        let ssidAttempts = 0;
        const maxSSIDAttempts = 3;

        while (ssidAttempts < maxSSIDAttempts && !currentSSID) {
          try {
            ssidAttempts++;
            currentSSID = await WifiManager.getCurrentWifiSSID();
            log.info(`📶 SSID attempt ${ssidAttempts}: ${currentSSID}`);

            if (currentSSID && currentSSID.trim()) {
              break;
            }
          } catch (ssidError) {
            log.warn(
              `SSID retrieval attempt ${ssidAttempts} failed:`,
              ssidError.message
            );
            if (ssidAttempts >= maxSSIDAttempts) {
              throw ssidError;
            }
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        log.info("📶 Current SSID from native:", currentSSID);

        // Get additional WiFi details
        const frequency = await WifiManager.getFrequency();
        const signalStrength = await WifiManager.getCurrentSignalStrength();
        const bssid = await WifiManager.getBSSID();

        log.info("📶 WiFi details:", {
          frequency,
          signalStrength,
          bssid,
        });

        connectionDetails = {
          bssid: bssid,
          signal: signalStrength,
          frequency: frequency ? `${frequency} MHz` : "Unknown",
          signalLevel: getSignalLevel(signalStrength),
          realWifi: true,
        };
      } catch (wifiError) {
        console.warn("Could not get detailed WiFi info:", wifiError);

        // Try to get a meaningful SSID even without detailed info
        if (!currentSSID) {
          // If we don't have an SSID, try to extract it from the error or use a generic name
          const errorMessage = wifiError.message || "";

          if (errorMessage.includes("permission")) {
            currentSSID = "WiFi Network (Permission Required)";
          } else if (errorMessage.includes("not found")) {
            currentSSID = "WiFi Network (Not Available)";
          } else {
            currentSSID = "Connected WiFi Network";
          }
        }

        // Clean the SSID - remove quotes and extra characters
        currentSSID = currentSSID.replace(/["']/g, "").trim();

        connectionDetails = {
          signal: -50,
          frequency: "Unknown",
          signalLevel: "good",
          realWifi: false,
          error: wifiError.message,
        };
      }
    } else if (networkState.type === Network.NetworkStateType.WIFI) {
      // Fallback for when native WiFi manager is not available
      log.info("📶 Using fallback WiFi info (native not available)");
      currentSSID = "Connected WiFi Network";
      connectionDetails = {
        signal: -50,
        frequency: "2.4 GHz",
        signalLevel: "good",
        realWifi: false,
        fallback: true,
        note: "Using Expo fallback - limited WiFi details available",
      };
    }

    const result = {
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
      type:
        networkState.type === Network.NetworkStateType.WIFI
          ? "WIFI"
          : networkState.type === Network.NetworkStateType.CELLULAR
          ? "CELLULAR"
          : "UNKNOWN",
      ipAddress: ipAddress,
      ssid: currentSSID,
      connectionDetails: connectionDetails,
      nativeWifiAvailable: !!WifiManager && isWifiManagerAvailable,
      realWifi: !!WifiManager && isWifiManagerAvailable,
    };

    log.info("📶 Final network info:", result);
    return result;
  } catch (error) {
    console.error("Error getting network info:", error);
    return null;
  }
};
/**
 * Check if WiFi permissions are already granted
 */
export const checkWiFiPermissions = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (
      permissionCache.granted &&
      now - permissionCache.lastChecked < permissionCache.cacheTimeout
    ) {
      log.info("✅ Using cached permission state");
      return {
        success: true,
        granted: true,
      };
    }

    if (Platform.OS === "android") {
      // Only check essential permissions (location permissions)
      const essentialPermissions = getWiFiPermissions().filter(
        (permission) => permission && permission.trim().length > 0
      );

      // Also get optional permissions for informational purposes
      const optionalPermissions = getOptionalWiFiPermissions().filter(
        (permission) => permission && permission.trim().length > 0
      );

      if (essentialPermissions.length === 0) {
        console.warn("⚠️ No essential permissions found");
        return {
          success: false,
          granted: false,
          error: "No essential permissions available",
        };
      }

      log.info(
        `🔐 Checking ${essentialPermissions.length} essential WiFi permissions...`
      );
      if (optionalPermissions.length > 0) {
        log.info(
          `📍 Also checking ${optionalPermissions.length} optional permissions...`
        );
      }

      // Check essential permissions
      const essentialResults = await Promise.all(
        essentialPermissions.map(async (permission) => {
          try {
            if (!permission) {
              console.warn("⚠️ Null permission detected, skipping");
              return false;
            }
            const result = await PermissionsAndroid.check(permission);
            log.info(`Essential permission ${permission}: ${result}`);
            return result;
          } catch (error) {
            console.warn(
              `⚠️ Error checking essential permission ${permission}:`,
              error
            );
            return false;
          }
        })
      );

      // Check optional permissions (don't fail if these are denied)
      const optionalResults = await Promise.all(
        optionalPermissions.map(async (permission) => {
          try {
            if (!permission) {
              return false;
            }
            const result = await PermissionsAndroid.check(permission);
            log.info(`Optional permission ${permission}: ${result}`);
            return result;
          } catch (error) {
            console.warn(
              `⚠️ Error checking optional permission ${permission}:`,
              error
            );
            return false;
          }
        })
      );

      // Only require essential permissions to be granted
      const essentialGranted = essentialResults.every(
        (result) => result === true
      );
      const optionalGranted = optionalResults.every(
        (result) => result === true
      );

      // Update cache based on essential permissions only
      permissionCache = {
        granted: essentialGranted,
        lastChecked: Date.now(),
        cacheTimeout: 5000,
      };

      return {
        success: true, // Always return success to prevent blocking
        granted: essentialGranted,
        essentialPermissions: essentialPermissions.map((permission, index) => ({
          permission,
          granted: essentialResults[index],
          required: true,
        })),
        optionalPermissions: optionalPermissions.map((permission, index) => ({
          permission,
          granted: optionalResults[index],
          required: false,
        })),
        allOptionalGranted: optionalGranted,
        needsPermissions: !essentialGranted,
      };
    }

    return { success: true, granted: true };
  } catch (error) {
    console.error("Permission check error:", error);
    return {
      success: true,
      granted: false,
      error: error.message,
      needsPermissions: true,
    };
  }
};

/**
 * Request necessary permissions for WiFi operations with better user experience
 */
export const requestWiFiPermissions = async (showDialog = true) => {
  try {
    if (Platform.OS === "android") {
      // Reset cache before checking to ensure fresh permission state
      resetPermissionCache();

      // Check if essential permissions are already granted
      const permissionCheck = await checkWiFiPermissions();

      if (permissionCheck.granted) {
        log.info("✅ Essential WiFi permissions already granted");
        return { success: true, alreadyGranted: true };
      }

      if (showDialog) {
        log.info("🔐 Requesting essential WiFi permissions...");
      }

      // Get only essential permissions for request (location permissions)
      const essentialPermissions = getWiFiPermissions();
      const optionalPermissions = getOptionalWiFiPermissions();

      if (essentialPermissions.length === 0) {
        console.warn("⚠️ No essential permissions to request");
        return {
          success: false,
          granted: false,
          error: "No essential permissions available",
        };
      }

      log.info(
        `🔐 Requesting ${essentialPermissions.length} essential permissions...`
      );

      let grantedEssential;
      try {
        grantedEssential = await PermissionsAndroid.requestMultiple(
          essentialPermissions
        );
      } catch (permissionError) {
        console.error("Permission request failed:", permissionError);
        return {
          success: false,
          error: "Permission request failed: " + permissionError.message,
          canRetry: true,
        };
      }

      const essentialGranted = Object.values(grantedEssential).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      // Optionally request background location if available, but don't fail if denied
      let optionalGranted = {};
      if (optionalPermissions.length > 0 && essentialGranted) {
        log.info(
          `📍 Requesting ${optionalPermissions.length} optional permissions...`
        );
        try {
          optionalGranted = await PermissionsAndroid.requestMultiple(
            optionalPermissions
          );
          const optionalSuccess = Object.values(optionalGranted).every(
            (status) => status === PermissionsAndroid.RESULTS.GRANTED
          );

          if (optionalSuccess) {
            log.info("✅ Optional permissions also granted");
          } else {
            log.info("⚠️ Some optional permissions denied (this is OK)");
          }
        } catch (optionalError) {
          console.warn(
            "⚠️ Optional permission request failed (continuing anyway):",
            optionalError
          );
        }
      }

      // Update cache with essential permission state only
      permissionCache = {
        granted: essentialGranted,
        lastChecked: Date.now(),
        cacheTimeout: 5000,
      };

      if (!essentialGranted) {
        // Log which essential permissions were denied
        const deniedPermissions = Object.entries(grantedEssential)
          .filter(([, status]) => status !== PermissionsAndroid.RESULTS.GRANTED)
          .map(([permission]) => permission);

        const neverAskAgainPermissions = Object.entries(grantedEssential)
          .filter(
            ([, status]) =>
              status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
          )
          .map(([permission]) => permission);

        console.warn(
          "❌ Essential WiFi permissions denied:",
          deniedPermissions
        );

        // Different error messages based on denial type
        let errorMessage =
          "Location permissions are required for WiFi scanning and device discovery.";
        let canOpenSettings = true;

        if (neverAskAgainPermissions.length > 0) {
          errorMessage +=
            " Some permissions were permanently denied. Please enable them manually in your device settings.";
          canOpenSettings = true;
        } else {
          errorMessage +=
            " Please grant location permissions to enable device discovery.";
        }

        return {
          success: false,
          error: errorMessage,
          detailedError:
            "Location permission is required by Android for WiFi scanning. This is a security measure to protect user privacy.",
          canOpenSettings,
          deniedPermissions,
          neverAskAgainPermissions,
          permissionsNeeded: [
            "Fine Location (required for WiFi scanning)",
            "Coarse Location (required for network discovery)",
          ],
          canRetry: neverAskAgainPermissions.length === 0,
        };
      }

      log.info("✅ Essential WiFi permissions granted successfully");
    }

    return { success: true };
  } catch (error) {
    console.error("Permission request error:", error);
    return {
      success: false,
      error: "Failed to request permissions: " + error.message,
      canRetry: true,
    };
  }
};

/**
 * Enhanced airplane mode detection (best effort)
 */
export const checkAirplaneMode = async () => {
  try {
    // Check if we can reach the internet
    const networkState = await Network.getNetworkStateAsync();

    // If no network connection at all, might be airplane mode
    if (!networkState.isConnected && !networkState.isInternetReachable) {
      // Additional check: try to get network info
      try {
        const ipAddress = await Network.getIpAddressAsync();
        return !ipAddress; // If no IP, likely airplane mode
      } catch {
        return true; // Error getting IP suggests airplane mode
      }
    }

    return false;
  } catch (error) {
    console.warn("Could not detect airplane mode:", error);
    return false; // Default to not airplane mode if we can't detect
  }
};

/**
 * Get WiFi scanner status and capabilities
 */
export const getWiFiScannerStatus = () => {
  return {
    nativeModuleAvailable: !!WifiManager && isWifiManagerAvailable,
    wifiManagerLoaded: !!WifiManager,
    methodsAvailable: WifiManager ? Object.keys(WifiManager) : [],
    platform: Platform.OS,
    version: Platform.Version,
    permissions: {
      cached: permissionCache.granted,
      lastChecked: permissionCache.lastChecked,
    },
    capabilities: {
      canScanNetworks: !!WifiManager && isWifiManagerAvailable,
      canConnectToWiFi: !!WifiManager && isWifiManagerAvailable,
      canScanDevices: true, // Always available via network ping
      canOpenSettings: true,
    },
  };
};

/**
 * Get permission status with detailed breakdown
 */
export const getPermissionStatus = async () => {
  try {
    if (Platform.OS !== "android") {
      return {
        platform: Platform.OS,
        required: false,
        allGranted: true,
        permissions: [],
      };
    }

    const essentialPermissions = getWiFiPermissions();
    const optionalPermissions = getOptionalWiFiPermissions();

    const allPermissions = [...essentialPermissions, ...optionalPermissions];
    const results = {};

    for (const permission of allPermissions) {
      try {
        if (permission) {
          results[permission] = await PermissionsAndroid.check(permission);
        }
      } catch (error) {
        console.warn(`Error checking permission ${permission}:`, error);
        results[permission] = false;
      }
    }

    const essentialGranted = essentialPermissions.every(
      (p) => results[p] === true
    );
    const allGranted = allPermissions.every((p) => results[p] === true);

    return {
      platform: Platform.OS,
      essentialGranted,
      allGranted,
      permissions: results,
      essentialPermissions,
      optionalPermissions,
    };
  } catch (error) {
    console.error("Error getting permission status:", error);
    return {
      platform: Platform.OS,
      error: error.message,
      essentialGranted: false,
      allGranted: false,
      permissions: {},
    };
  }
};

/**
 * Get detailed network status including capabilities and device info
 */
export const getDetailedNetworkStatus = async () => {
  try {
    log.info("📡 Starting WiFi network and device discovery...");

    // Get current network info
    const networkInfo = await getCurrentNetworkInfo();

    // Get WiFi scanner status
    const scannerStatus = getWiFiScannerStatus();

    // Check permissions
    const permissionStatus = await checkWiFiPermissions();

    // Check airplane mode
    const isAirplaneModeEnabled = await checkAirplaneMode();

    // If connected to WiFi, try to scan for devices
    let deviceScanResult = null;
    if (networkInfo?.isConnected && networkInfo.type === "WIFI") {
      try {
        deviceScanResult = await scanLocalNetworkDevices();
      } catch (deviceScanError) {
        console.warn("Device scan failed:", deviceScanError);
      }
    }

    // Build compatible response structure
    const result = {
      success: true,
      networkInfo: networkInfo,
      scannerStatus: scannerStatus,
      permissions: permissionStatus,
      deviceScan: deviceScanResult,
      timestamp: new Date().toISOString(), // Compatibility properties for existing code
      isConnected: networkInfo?.isConnected || false,
      isInternetReachable: networkInfo?.isInternetReachable || false,
      isAirplaneModeEnabled: isAirplaneModeEnabled,
      canScanWifi:
        (permissionStatus?.granted ||
          (networkInfo?.isConnected && networkInfo.type === "WIFI")) &&
        (networkInfo?.isConnected || false) &&
        !isAirplaneModeEnabled,
      type: networkInfo?.type || "UNKNOWN",
      ssid: networkInfo?.ssid || null,
      devices: deviceScanResult?.devices || [],
      relevantDevices: deviceScanResult?.relevantDevices || [],
    };

    return result;
  } catch (error) {
    console.error("Failed to get detailed network status:", error);
    return {
      success: false,
      error: error.message || "Failed to get network status",
      networkInfo: null,
      scannerStatus: getWiFiScannerStatus(),
      permissions: { granted: false, error: error.message },
      deviceScan: null,
      // Compatibility properties for existing code
      isConnected: false,
      isInternetReachable: false,
      isAirplaneModeEnabled: true, // Assume airplane mode if we can't detect
      canScanWifi: false,
      type: "UNKNOWN",
      ssid: null,
      devices: [],
      relevantDevices: [],
    };
  }
};

/**
 * Open WiFi settings
 */
export const openWiFiSettings = async () => {
  try {
    if (Platform.OS === "ios") {
      await Linking.openURL("App-Prefs:root=WIFI");
    } else {
      await Linking.sendIntent("android.settings.WIFI_SETTINGS");
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to open WiFi settings:", error);
    return {
      success: false,
      error: "Failed to open WiFi settings",
    };
  }
};

/**
 * Open app settings for permissions
 */
export const openAppSettings = async () => {
  try {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
    } else {
      await Linking.openSettings();
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to open app settings:", error);
    return {
      success: false,
      error: "Failed to open app settings",
    };
  }
};

/**
 * Validate device connection before registration
 */
export const validateDeviceConnection = async (deviceData) => {
  try {
    log.info("🔍 Validating device connection:", deviceData);
    log.info("🔍 Device data keys:", Object.keys(deviceData || {}));
    log.info("🔍 Device IP:", deviceData?.ip);
    log.info("🔍 Device hostname:", deviceData?.hostname);
    log.info("🔍 Device device_id:", deviceData?.device_id);

    // Check if we have sufficient device information
    if (!deviceData.ip && !deviceData.hostname && !deviceData.device_id) {
      console.error("❌ Device validation failed: missing all identifiers");
      return {
        isValid: false,
        error:
          "Device information is incomplete - missing IP address, hostname, or device ID",
        suggestion:
          "Please provide at least an IP address or device identifier",
        details: {
          hasIP: !!deviceData.ip,
          hasHostname: !!deviceData.hostname,
          hasDeviceId: !!deviceData.device_id,
          providedData: deviceData,
        },
      };
    }

    // Validate IP address format if provided
    if (deviceData.ip) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(deviceData.ip)) {
        return {
          isValid: false,
          error: `Invalid IP address format: ${deviceData.ip}`,
          suggestion: "Please enter a valid IP address (e.g., 192.168.1.100)",
        };
      }
    }

    // Validate device_id format if provided
    if (deviceData.device_id) {
      const deviceId = deviceData.device_id.trim();
      if (deviceId.length < 2) {
        return {
          isValid: false,
          error: "Device ID is too short",
          suggestion: "Device ID should be at least 2 characters long",
        };
      }

      // Clean device_id for consistency
      deviceData.device_id = deviceId
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .toUpperCase();
    }

    return {
      isValid: true,
      deviceData: deviceData,
      message: "Device connection validated successfully",
    };
  } catch (error) {
    console.error("Device validation error:", error);
    return {
      isValid: false,
      error: error.message || "Failed to validate device connection",
      details: error.stack,
    };
  }
};

/**
 * Check if device is already registered (using API function)
 */
export const checkIfDeviceRegistered = async (token, deviceId) => {
  try {
    const data = await checkDeviceStatus(token, deviceId);
    return data;
  } catch (error) {
    console.error("Error checking device status:", error);
    return { exists: false, error: error.message };
  }
};

/**
 * Register a selected device directly
 */
export const registerSelectedDevice = async (
  token,
  deviceInfo,
  userInfo = {}
) => {
  try {
    log.info("🔄 Registering selected device...", deviceInfo);

    if (!token) {
      throw new Error("Authentication token required");
    }

    if (!deviceInfo) {
      throw new Error("Device information required");
    }

    // Validate device info
    const validation = await validateDeviceConnection(deviceInfo);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        suggestion: validation.suggestion,
      };
    }

    // Use the validated device data
    const validatedDevice = validation.deviceData;

    // Format for registration
    const registrationData = formatDeviceForRegistration(
      validatedDevice,
      userInfo
    );

    log.info("📝 Device registration data:", registrationData);

    // Check if device already exists
    const existsCheck = await checkIfDeviceRegistered(
      token,
      registrationData.device_id
    );

    if (existsCheck.exists) {
      return {
        success: true,
        alreadyExists: true,
        device: existsCheck.device,
        message: `Device "${
          existsCheck.device?.name || registrationData.device_id
        }" is already registered`,
      };
    }

    // Register the device
    const result = await registerDeviceViaWiFi(token, registrationData);

    log.info("✅ Device registered successfully:", result);

    return {
      success: true,
      device: result,
      message: `Device "${result.name}" registered successfully`,
      isNew: true,
    };
  } catch (error) {
    console.error("❌ Device registration failed:", error);
    return {
      success: false,
      error: error.message || "Device registration failed",
      suggestion: "Please check the device information and try again",
    };
  }
};

export const scanWiFiNetworks = async () => {
  try {
    log.info("📡 Starting WiFi network scan...");
    log.info("📱 WiFi Manager Status:", {
      available: !!WifiManager,
      validated: isWifiManagerAvailable,
      platform: Platform.OS,
      version: Platform.Version,
      initAttempts: initializationAttempts,
    });

    // Get current network info first
    const networkInfo = await getCurrentNetworkInfo();
    log.info("Current network info:", networkInfo);    // Enhanced WiFi manager availability check with retry logic
    if (!WifiManager || !isWifiManagerAvailable) {
      log.info("📡 Native WiFi module not available or not validated");
      log.info("Module status:", {
        WifiManager: !!WifiManager,
        isWifiManagerAvailable,
        initializationAttempts,
        maxAttempts: MAX_INIT_ATTEMPTS
      });

      // Try to reinitialize WiFi manager if we haven't exceeded max attempts
      if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        log.info("🔄 Attempting to reinitialize WiFi manager...");
        const reinitResult = retryWifiManagerInitialization();

        if (reinitResult) {
          log.info("✅ WiFi manager reinitialized successfully");
          // Continue with the scan
        } else {
          log.error("❌ WiFi manager reinitialization failed - Cannot scan for networks");
          return {
            success: false,
            error: "WiFi scanning not available - native module failed to initialize",
            suggestion: "Please ensure react-native-wifi-reborn is properly installed and the app is built as a development build (not Expo Go)",
            moduleError: "Native WiFi module unavailable",
            fallback: false
          };
        }
      } else {
        log.error("❌ Max initialization attempts reached - Cannot scan for networks");
        return {
          success: false,
          error: "WiFi scanning not available - native module initialization failed after multiple attempts",
          suggestion: "Please rebuild the app or check if react-native-wifi-reborn is properly installed",
          moduleError: "Native WiFi module failed to initialize",
          maxAttemptsReached: true,
          fallback: false
        };
      }
    }    // Validate that we can actually use the WiFi manager
    try {
      if (!WifiManager || typeof WifiManager.loadWifiList !== "function") {
        console.error(
          "❌ WiFi manager validation failed - missing loadWifiList method"
        );
        log.error("WiFi Manager validation details:", {
          managerExists: !!WifiManager,
          loadWifiListType: typeof WifiManager?.loadWifiList,
          availableMethods: WifiManager ? Object.keys(WifiManager) : [],
        });
        return {
          success: false,
          error: "WiFi scanning not available - loadWifiList method not found",
          suggestion: "Please ensure the app is built as a development build with react-native-wifi-reborn properly linked",
          moduleError: "Critical method missing",
          fallback: false
        };
      }

      log.info("✅ WiFi manager validation passed");
    } catch (validationError) {
      console.error("❌ WiFi manager validation error:", validationError);
      return {
        success: false,
        error: "WiFi scanning not available - module validation failed",
        suggestion: "Please rebuild the app with react-native-wifi-reborn properly configured",
        moduleError: validationError.message,
        fallback: false
      };
    }    // Check if permissions are already granted first
    const permissionCheck = await checkWiFiPermissions();

    if (!permissionCheck.granted) {
      log.info("🔐 WiFi permissions needed for scanning...");
      
      const permissionResult = await requestWiFiPermissions();
      if (!permissionResult.success) {
        console.error("Permission request failed:", permissionResult);
        return {
          success: false,
          error: "WiFi scanning requires location permissions",
          suggestion: "Please grant location permissions in your device settings to scan for WiFi networks",
          permissionError: permissionResult.error,
          canOpenSettings: true
        };
      }
    } else {
      log.info("✅ WiFi permissions already granted for scanning");
    }

    log.info("📡 Starting native WiFi network scan...");

    let scanResults = [];
    let scanAttempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    // Try multiple scan attempts for better reliability
    while (scanAttempts < maxAttempts) {
      try {
        scanAttempts++;
        log.info(`Scan attempt ${scanAttempts}/${maxAttempts}`);

        // Add a small delay before each scan attempt
        if (scanAttempts > 1) {
          log.info("⏱️ Waiting before retry...");
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // Perform actual WiFi scan with timeout
        log.info("🔍 Calling WifiManager.loadWifiList()...");

        // Create a promise with timeout for the WiFi scan
        const scanPromise = WifiManager.loadWifiList();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("WiFi scan timed out after 10 seconds")),
            10000
          )
        );

        const wifiNetworks = await Promise.race([scanPromise, timeoutPromise]);
        log.info(
          `Found ${
            wifiNetworks?.length || 0
          } networks in scan attempt ${scanAttempts}`
        );

        if (
          wifiNetworks &&
          Array.isArray(wifiNetworks) &&
          wifiNetworks.length > 0
        ) {
          log.info("📶 Processing WiFi scan results...");

          // Process scan results
          scanResults = wifiNetworks
            .filter((network) => {
              // More robust network filtering
              return (
                network &&
                typeof network === "object" &&
                network.SSID &&
                network.SSID.trim().length > 0
              );
            })
            .map((network, index) => {
              const isCurrentNetwork = networkInfo?.ssid === network.SSID;

              // Determine if network is secure
              const capabilities = network.capabilities || "";
              const isSecure =
                capabilities.includes("WPA") ||
                capabilities.includes("WEP") ||
                (capabilities.includes("PSK") &&
                  !capabilities.includes("NONE"));

              return {
                ssid: network.SSID,
                bssid: network.BSSID || "Unknown",
                signal: network.level || -70,
                frequency: network.frequency || 2400,
                capabilities: capabilities || "[OPEN]",
                secure: isSecure,
                level: getSignalLevel(network.level || -70),
                timestamp: Date.now(),
                isCurrent: isCurrentNetwork,
                isHidden: !network.SSID || network.SSID.trim() === "",
                rawData: network, // Include raw data for debugging
              };
            })
            .filter((network) => !network.isHidden); // Remove hidden networks

          // Sort by signal strength (strongest first)
          scanResults.sort((a, b) => b.signal - a.signal);

          // Remove duplicates based on SSID (keep strongest signal)
          const uniqueNetworks = [];
          const seenSSIDs = new Set();

          for (const network of scanResults) {
            if (!seenSSIDs.has(network.ssid)) {
              seenSSIDs.add(network.ssid);
              uniqueNetworks.push(network);
            }
          }

          scanResults = uniqueNetworks;
          log.info(`✅ Processed ${scanResults.length} unique networks`);

          // If we found networks, return them
          if (scanResults.length > 0) {
            return {
              success: true,
              networks: scanResults,
              currentNetwork: networkInfo,
              scanTime: new Date().toISOString(),
              method: "react_native_wifi_reborn",
              realWifi: true,
              totalFound: scanResults.length,
              scanAttempts: scanAttempts,
              nativeModule: true,
            };
          }
        } else {
          log.info(
            `⚠️ Scan attempt ${scanAttempts} returned no networks or invalid data`
          );
          lastError = new Error(`No networks found in attempt ${scanAttempts}`);
        }

        // If no networks found, continue to next attempt
        if (scanAttempts < maxAttempts) {
          log.info("No networks found, will retry...");
        }
      } catch (scanError) {
        console.error(`WiFi scan attempt ${scanAttempts} error:`, scanError);
        lastError = scanError;        // If this was the last attempt, handle the error
        if (scanAttempts >= maxAttempts) {
          console.error("❌ All native scan attempts failed");
          
          return {
            success: false,
            error: "WiFi scan failed after multiple attempts: " + scanError.message,
            suggestion:
              "Please check if WiFi is enabled and permissions are granted. Try turning WiFi off and on again.",
            scanAttempts: scanAttempts,
            nativeModule: true,
            detailedError: scanError.message
          };
        }
      }
    }    // If we get here, all attempts failed but no exception was thrown
    console.warn("❌ All scan attempts completed but no networks found");
    
    return {
      success: false,
      error: "No WiFi networks found after multiple scan attempts",
      suggestion:
        "Please check if WiFi is enabled and other devices can see networks. Try restarting WiFi or moving closer to access points.",
      scanAttempts: scanAttempts,
      lastError: lastError?.message,
      nativeModule: true,
    };  } catch (error) {
    console.error("❌ WiFi scanning error:", error);

    return {
      success: false,
      error: error.message || "WiFi network scanning failed",
      suggestion:
        "Please check WiFi settings and permissions. Make sure the app is built as a development build with react-native-wifi-reborn properly configured.",
      nativeModule: !!WifiManager,
      detailedError: error.stack
    };
  }
};
/**
 * Scan for devices on the local network
 * Real network device discovery only
 */
export const scanLocalNetworkDevices = async () => {
  try {
    const networkInfo = await getCurrentNetworkInfo();

    if (!networkInfo?.isConnected) {
      return {
        success: false,
        error: "Not connected to any network",
        suggestion: "Please connect to a WiFi network first",
      };
    }

    if (networkInfo.type !== "WIFI") {
      return {
        success: false,
        error: "Device scanning is only available on WiFi networks",
        currentNetworkType: networkInfo.type,
        suggestion: "Please connect to a WiFi network to scan for devices",
      };
    }

    // Get network subnet for scanning
    const ipAddress = networkInfo.ipAddress;
    if (!ipAddress) {
      return {
        success: false,
        error: "Could not determine network IP address",
        suggestion: "Check your WiFi connection and try again",
      };
    }

    // Extract subnet (assuming /24 network)
    const subnet = ipAddress.substring(0, ipAddress.lastIndexOf("."));

    log.info(`🔍 Would scan network ${subnet}.0/24 for devices...`);
    log.info(`📶 Current WiFi: ${networkInfo.ssid || "Unknown"}`);

    // Note: Real device scanning would require additional native modules
    // For now, return empty results with guidance
    return {
      success: true,
      devices: [],
      relevantDevices: [],
      totalFound: 0,
      relevantFound: 0,
      networkInfo: {
        ...networkInfo,
        subnet: `${subnet}.0/24`,
        currentIP: ipAddress,
      },
      scanTime: new Date().toISOString(),
      realNetworkScan: false,
      scanMethod: "real_scan_not_available",
      note: "Real device scanning requires additional native modules. Please use manual IP entry to connect to devices.",
    };
  } catch (error) {
    console.error("Network device scanning error:", error);
    return {
      success: false,
      error: error.message || "Failed to scan network devices",
      suggestion: "Try manual device entry or check network connection",    };
  }
};

/**
 * Complete device registration flow
 */
export const completeDeviceRegistration = async (
  token,
  deviceInfo,
  userProvidedInfo = {}
) => {
  try {
    log.info("🔄 Starting device registration flow...", deviceInfo);

    if (!token) {
      throw new Error("Authentication token is required");
    }

    // Validate device information - make sure we have at least some identifying information
    if (!deviceInfo) {
      throw new Error("Device information is required");
    }

    // Ensure we have at least some way to identify the device
    if (!deviceInfo.ip && !deviceInfo.device_id && !deviceInfo.hostname) {
      // Try to generate device info from available data
      if (!deviceInfo.ip && !deviceInfo.hostname) {
        // Create a fallback device ID
        const fallbackId = `DEVICE_${Date.now()}`;
        log.info(
          `⚠️ No device IP, hostname, or device_id provided. Using fallback: ${fallbackId}`
        );
        deviceInfo.device_id = fallbackId;
        deviceInfo.hostname = `Device-${fallbackId.slice(-6)}`;
      }
    }

    // Log device info for debugging
    log.info("📱 Device info for registration:", {
      ip: deviceInfo.ip,
      hostname: deviceInfo.hostname,
      device_id: deviceInfo.device_id,
      name: deviceInfo.name,
    });

    // Format device data for registration
    const registrationData = formatDeviceForRegistration(
      deviceInfo,
      userProvidedInfo
    );

    log.info("📝 Registration data prepared:", registrationData);

    // First check if device already exists
    const existingCheck = await checkIfDeviceRegistered(
      token,
      registrationData.device_id
    );

    if (existingCheck.exists) {
      log.info("⚠️ Device already exists in system");
      return {
        success: true,
        alreadyExists: true,
        device: existingCheck.device,
        message: `Device "${
          existingCheck.device?.name || registrationData.device_id
        }" is already registered`,
      };
    }

    // Register the device via WiFi endpoint
    try {
      const result = await registerDeviceViaWiFi(token, registrationData);

      log.info("✅ Device registered successfully:", result);

      return {
        success: true,
        device: result,
        message: `Device "${result.name}" registered successfully`,
        isNew: true,
      };
    } catch (apiError) {
      console.error("❌ API registration failed:", apiError);
      throw new Error(`Registration failed: ${apiError.message}`);
    }
  } catch (error) {
    console.error("❌ Device registration flow failed:", error);
    return {
      success: false,
      error: error.message || "Device registration failed",
      details: error.stack,
    };
  }
};

/**
 * Format device information for registration
 */
const formatDeviceForRegistration = (device, additionalInfo = {}) => {
  let deviceId =
    device.hostname || device.ip?.replace(/\./g, "-") || device.device_id;
  if (deviceId) {
    deviceId = deviceId.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
  } else {
    deviceId = `DEVICE_${Date.now()}`;
  }

  return {
    device_id: deviceId,
    name: additionalInfo.name || device.hostname || `Device ${device.ip}`,
    room_number: additionalInfo.room_number || "Unassigned",
    floor_number: parseInt(additionalInfo.floor_number, 10) || 0,
    tissue_type: additionalInfo.tissue_type || "hand_towel",
    meter_capacity: additionalInfo.meter_capacity || 500,
    mac_address: device.mac !== "Unknown" ? device.mac : null,
    ip_address: device.ip,
    hostname: device.hostname,
    device_type: device.deviceType || "Smart Device",
    manufacturer: device.manufacturer || "Unknown",
    model: additionalInfo.model || device.deviceType,
    firmware_version: additionalInfo.firmware_version || "1.0.0",
    discovery_method: device.manual
      ? "manual"
      : device.qrCode
      ? "qr_code"
      : device.bluetooth
      ? "bluetooth"
      : "network_scan",
    port: device.port || 80,
    services: device.services || ["HTTP"],
  };
};

/**
 * Parse WiFi QR code data
 * Format: WIFI:T:<security>;S:<ssid>;P:<password>;H:<hidden>;;
 */
export const validateAndParseQRCode = (scannedData) => {
  try {
    log.info("🔍 Validating QR code data:", scannedData);
    log.info("🔍 QR code data type:", typeof scannedData);
    log.info("🔍 QR code data length:", scannedData?.length);

    if (!scannedData || typeof scannedData !== "string") {
      throw new Error("Invalid QR code data");
    }

    const trimmedData = scannedData.trim();
    log.info("🔍 Trimmed data:", trimmedData);

    // 1. Check for WiFi QR code format (WIFI:T:WPA;S:SSID;P:password;H:false;;)
    if (trimmedData.startsWith("WIFI:")) {
      log.info("📶 Detected standard WiFi QR code");
      const wifiData = parseWiFiQRCode(trimmedData);
      if (wifiData.success) {
        return {
          success: true,
          type: "wifi",
          data: wifiData.data,
          action: "connect_wifi",
          message: `WiFi network detected: ${wifiData.data.ssid}`,
        };
      } else {
        log.info("❌ WiFi QR code parsing failed:", wifiData.error);
      }
    }

    // 2. Check for plain text WiFi credentials (like "Galaxy M05 5740 khadar123" or "I Wont Tell")
    log.info("🔍 Checking if text looks like WiFi credentials...");
    const isWifiCredentials = isPlainTextWiFiCredentials(trimmedData);
    log.info("🔍 Is WiFi credentials:", isWifiCredentials);

    if (isWifiCredentials) {
      log.info("📱 Detected plain text WiFi credentials");
      try {
        const wifiData = parsePlainTextWiFi(trimmedData);
        return {
          success: true,
          type: "wifi",
          data: wifiData,
          action: "connect_wifi",
          message: `WiFi network detected: ${wifiData.ssid}`,
        };
      } catch (parseError) {
        log.info("❌ Plain text WiFi parsing failed:", parseError.message);
      }
    }

    // 3. Check for device JSON format
    if (trimmedData.startsWith("{") && trimmedData.endsWith("}")) {
      try {
        log.info("📱 Attempting to parse as device JSON");
        const deviceInfo = JSON.parse(trimmedData);

        if (deviceInfo.ip || deviceInfo.hostname) {
          return {
            success: true,
            type: "device",
            data: deviceInfo,
            action: "add_device",
            message: `Device detected: ${deviceInfo.hostname || deviceInfo.ip}`,
          };
        }
      } catch (_jsonError) {
        log.info("⚠️ Not valid JSON format");
      }
    } // 4. Check for plain IP address
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipRegex.test(trimmedData)) {
      log.info("🌐 Detected IP address");
      return {
        success: true,
        type: "ip",
        data: {
          ip: trimmedData,
          hostname: `Device-${trimmedData.split(".").pop()}`,
          type: "Smart Device",
        },
        action: "add_device",
        message: `IP address detected: ${trimmedData}`,
      };
    }

    // 5. Fallback: Try to treat any reasonable text as a WiFi network name
    log.info("🔍 Attempting fallback WiFi parsing...");
    if (
      trimmedData.length >= 3 &&
      trimmedData.length <= 50 &&
      !trimmedData.includes("\n") &&
      !trimmedData.includes("\t") &&
      /^[A-Za-z0-9\s_.-]+$/.test(trimmedData)
    ) {
      log.info("📱 Using fallback WiFi network parsing");
      try {
        const fallbackWifiData = {
          ssid: trimmedData,
          password: "",
          security: "unknown",
          hidden: false,
          isOpen: true,
          qrSource: true,
          parsedFrom: "fallback",
        };

        return {
          success: true,
          type: "wifi",
          data: fallbackWifiData,
          action: "connect_wifi",
          message: `WiFi network detected (fallback): ${trimmedData}`,
        };
      } catch (fallbackError) {
        log.info(
          "❌ Fallback WiFi parsing also failed:",
          fallbackError.message
        );
      }
    }

    // If none of the above formats match
    throw new Error("QR code format not recognized");
  } catch (error) {
    console.error("❌ QR code validation error:", error);
    return {
      success: false,
      error: error.message,
      suggestion:
        "Make sure the QR code contains:\n• WiFi network information (WIFI: format)\n• Plain text WiFi credentials (NetworkName password)\n• Device JSON with IP/hostname\n• Plain IP address",
      rawData: scannedData,
    };
  }
};

/**
 * Check if the text looks like plain WiFi credentials
 */
const isPlainTextWiFiCredentials = (text) => {
  if (!text || typeof text !== "string") return false;

  const trimmedText = text.trim();
  log.info("🔍 Checking WiFi credentials for:", trimmedText);

  // Must have at least 2 characters and no special format indicators
  if (trimmedText.length < 2) {
    log.info("❌ Text too short");
    return false;
  }
  if (
    trimmedText.startsWith("WIFI:") ||
    trimmedText.startsWith("{") ||
    trimmedText.includes("://")
  ) {
    log.info("❌ Text has special format indicators");
    return false;
  }

  // Enhanced patterns for WiFi credentials
  const patterns = [
    // Common WiFi network patterns like "NetworkName password"
    /^[A-Za-z0-9\s_-]+ [A-Za-z0-9@#$%^&*!]{4,}$/,

    // Phone hotspot patterns like "Galaxy M05 5740 khadar123" or "iPhone password123"
    /^(Galaxy|iPhone|Pixel|OnePlus|Xiaomi|Samsung|Huawei|Oppo|Vivo|Mi|Redmi)\s+[A-Za-z0-9\s_-]+ [A-Za-z0-9@#$%^&*!]+$/i,

    // General format with multiple words and potential password
    /^[A-Za-z][A-Za-z0-9\s_-]{2,50} [A-Za-z0-9@#$%^&*!]{3,}$/,

    // Network name with numbers and password
    /^[A-Za-z0-9\s_-]+ \d{2,5} [A-Za-z0-9@#$%^&*!]+$/,

    // Networks with spaces (like "I Wont Tell password123")
    /^[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z0-9@#$%^&*!]+$/,

    // Two word network names with password
    /^[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z0-9@#$%^&*!]+$/,

    // Three word network names (like "I Wont Tell")
    /^[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+$/,

    // Single word network names (no password)
    /^[A-Za-z0-9_-]{3,}$/,

    // Two word network names (no obvious password)
    /^[A-Za-z]+\s+[A-Za-z]+$/,

    // Network names with numbers but no obvious password
    /^[A-Za-z0-9\s_-]{3,30}$/,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const matches = pattern.test(trimmedText);
    log.info(
      `🔍 Pattern ${i + 1} (${pattern.source}): ${matches ? "✅" : "❌"}`
    );
    if (matches) {
      log.info("✅ WiFi credentials pattern matched!");
      return true;
    }
  }

  log.info("❌ No WiFi credentials pattern matched");
  return false;
};

/**
 * Parse plain text WiFi credentials
 */
const parsePlainTextWiFi = (text) => {
  log.info("📱 Parsing plain text WiFi credentials:", text);

  try {
    const trimmedText = text.trim();
    const parts = trimmedText.split(/\s+/);

    let ssid = "";
    let password = "";
    if (parts.length === 2) {
      // Simple format: "NetworkName password"
      ssid = parts[0];
      password = parts[1];
    } else if (parts.length >= 3) {
      // Complex format like "Galaxy M05 5740 khadar123" or "I Wont Tell password123"
      // Check if the last part looks like a password (contains numbers/special chars or is long enough)
      const lastPart = parts[parts.length - 1];
      const isPassword = /[0-9@#$%^&*!]/.test(lastPart) || lastPart.length >= 8;

      if (isPassword) {
        // Last part is likely the password
        password = lastPart;
        ssid = parts.slice(0, -1).join(" ");
      } else {
        // No clear password, treat entire string as SSID
        ssid = trimmedText;
        password = "";
      }

      log.info(`🔍 Multi-part parsing: "${ssid}" | "${password}"`);
    } else {
      // Single word - might be just network name (no password)
      ssid = trimmedText;
      password = "";
    }

    log.info(`✅ Parsed SSID: "${ssid}", Password: "${password}"`);

    if (!ssid) {
      throw new Error("Could not extract WiFi network name from text");
    }

    return {
      ssid: ssid,
      password: password,
      security: password ? "WPA2" : "nopass",
      hidden: false,
      isOpen: !password,
      qrSource: true,
      parsedFrom: "plaintext",
    };
  } catch (error) {
    console.error("❌ Plain text WiFi parsing failed:", error);
    throw new Error(`Plain text WiFi parsing failed: ${error.message}`);
  }
};

/**
 * Parse WiFi QR code data
 * Format: WIFI:T:<security>;S:<ssid>;P:<password>;H:<hidden>;;
 */
const parseWiFiQRCode = (qrData) => {
  try {
    log.info("🔍 Parsing WiFi QR code:", qrData);

    if (!qrData || typeof qrData !== "string") {
      throw new Error("Invalid QR data type");
    }

    const trimmed = qrData.trim();

    if (!trimmed.startsWith("WIFI:")) {
      throw new Error("Not a WiFi QR code - missing WIFI: prefix");
    }

    // Remove "WIFI:" prefix and split by semicolons
    const afterPrefix = trimmed.substring(5);
    log.info("After WIFI: prefix:", afterPrefix);

    const parts = afterPrefix.split(";");
    log.info("Split parts:", parts);

    const data = {};

    // Parse each part
    for (const part of parts) {
      if (part.trim() === "") continue; // Skip empty parts

      if (part.includes(":")) {
        const colonIndex = part.indexOf(":");
        const key = part.substring(0, colonIndex);
        const value = part.substring(colonIndex + 1);

        log.info(`Parsing: ${key} = ${value}`);

        switch (key.toUpperCase()) {
          case "T":
            data.security = value || "nopass";
            break;
          case "S":
            // Unescape special characters in SSID
            data.ssid = value.replace(/\\(.)/g, "$1");
            break;
          case "P":
            // Unescape special characters in password
            data.password = value.replace(/\\(.)/g, "$1");
            break;
          case "H":
            data.hidden = value.toLowerCase() === "true";
            break;
          default:
            log.info(`Unknown WiFi QR field: ${key}`);
        }
      }
    }

    log.info("Parsed WiFi data:", data);

    if (!data.ssid) {
      throw new Error("No SSID found in WiFi QR code");
    }

    const result = {
      ssid: data.ssid,
      password: data.password || "",
      security: data.security || "nopass",
      hidden: data.hidden || false,
      isOpen: data.security === "nopass" || !data.password,
    };

    log.info("✅ WiFi QR code parsed successfully:", result);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ WiFi QR parsing error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to parse WiFi QR code",
    };
  }
};

/**
 * Complete QR code processing for device registration
 */
export const processQRCodeForDeviceRegistration = async (
  token,
  qrData,
  userInfo = {}
) => {
  try {
    log.info("🔍 Processing QR code for device registration...");

    // Validate and parse QR code
    const qrResult = validateAndParseQRCode(qrData);

    if (!qrResult.success) {
      return qrResult; // Return parsing error
    } // Handle different QR code types
    switch (qrResult.type) {
      case "wifi":
        // WiFi QR code - return connection instructions with consistent format
        log.info("📶 WiFi QR detected:", qrResult.data.ssid);

        return {
          success: true,
          type: "wifi",
          step: "wifi_detected",
          action: "connect_wifi",
          data: qrResult.data,
          wifiData: qrResult.data,
          message: `WiFi network detected: ${qrResult.data.ssid}`,
          subMessage: qrResult.data.password
            ? `Password: ${qrResult.data.password}`
            : "No password required",
          instructions: [
            "1. Go to your device's WiFi settings",
            `2. Connect to network: "${qrResult.data.ssid}"`,
            qrResult.data.password
              ? `3. Enter password: "${qrResult.data.password}"`
              : "3. No password required - just connect",
            "4. Return to this app and continue",
          ],
          buttons: [
            {
              label: "Cancel",
              action: "cancel",
              style: "secondary",
            },
            {
              label: "Continue",
              action: "continue_after_wifi",
              style: "primary",
            },
          ],
          originalQR: qrData,
        };

      case "device":
      case "ip":
        // Device QR code - proceed with registration
        log.info("📱 Device QR detected, proceeding with registration...");

        // Complete the registration flow
        const registrationResult = await completeDeviceRegistration(
          token,
          qrResult.data,
          userInfo
        );

        return {
          ...registrationResult,
          type: "device",
          qrData: qrResult.data,
          originalQR: qrData,
        };

      default:
        return {
          success: false,
          error: `Unsupported QR code type: ${qrResult.type}`,
          suggestion: "Please scan a WiFi QR code or device QR code",
        };
    }
  } catch (error) {
    console.error("❌ QR processing error:", error);
    return {
      success: false,
      error: error.message || "Failed to process QR code",
      details: error.stack,
    };
  }
};

/**
 * Process WiFi QR code with enhanced device discovery flow
 * This function connects to WiFi and then scans for devices
 */
export const processWiFiQRWithDeviceFlow = async (wifiData, userInfo = {}) => {
  try {
    log.info("🔄 Starting WiFi QR with device flow...", wifiData);

    if (!wifiData || !wifiData.ssid) {
      throw new Error("Invalid WiFi data - missing SSID");
    }

    // Step 1: Get current network status
    const currentNetwork = await getCurrentNetworkInfo();
    log.info("📶 Current network:", currentNetwork);

    // Step 2: Check if already connected to the target network
    if (currentNetwork?.isConnected && currentNetwork.ssid === wifiData.ssid) {
      log.info("✅ Already connected to target WiFi network");

      // Skip connection and go directly to device scanning
      return await performDeviceDiscoveryFlow(wifiData, userInfo);
    } // Step 3: For Expo Go, we can't programmatically connect to WiFi
    // Show instructions to user and then provide retry option
    log.info("📱 Running in Expo Go - cannot auto-connect to WiFi");

    return {
      success: true,
      step: "connection_required",
      action: "manual_connect_with_retry",
      wifiData: wifiData,
      message: `WiFi Connected Successfully! ✓`,
      subMessage: `Please connect to "${wifiData.ssid}" manually`,
      instructions: [
        `1. Go to WiFi settings on your device`,
        `2. Connect to network: "${wifiData.ssid}"`,
        `3. ${
          wifiData.password
            ? `Use password: "${wifiData.password}"`
            : "No password required"
        }`,
        `4. Return to this app and tap "Continue" to scan for devices`,
      ],
      buttons: [
        {
          label: "Cancel",
          action: "cancel",
          style: "secondary",
        },
        {
          label: "Continue",
          action: "retry_device_scan",
          style: "primary",
        },
      ],
      nextAction: "retry_device_scan",
      canRetry: true,
    };
  } catch (error) {
    console.error("❌ WiFi QR device flow error:", error);
    return {
      success: false,
      error: error.message || "WiFi QR processing failed",
      step: "error",
    };
  }
};

/**
 * Perform device discovery after WiFi connection
 */
const performDeviceDiscoveryFlow = async (wifiData, userInfo = {}) => {
  try {
    log.info("🔍 Starting device discovery flow...");

    // Step 1: Scan for local network devices
    const deviceScanResult = await scanLocalNetworkDevices();
    log.info("📡 Device scan result:", deviceScanResult);

    if (deviceScanResult.success) {
      const allDevices = deviceScanResult.devices || [];
      const relevantDevices = deviceScanResult.relevantDevices || [];

      if (relevantDevices.length > 0) {
        return {
          success: true,
          step: "devices_found",
          action: "select_device",
          message: `Found ${relevantDevices.length} smart device(s) on network "${wifiData.ssid}"`,
          wifiData: wifiData,
          devicesFound: allDevices,
          relevantDevices: relevantDevices,
          totalFound: allDevices.length,
          relevantFound: relevantDevices.length,
          networkInfo: deviceScanResult.networkInfo,
        };
      } else if (allDevices.length > 0) {
        return {
          success: true,
          step: "generic_devices_found",
          action: "manual_selection",
          message: `Found ${allDevices.length} device(s) on network "${wifiData.ssid}", but none appear to be smart dispensers`,
          wifiData: wifiData,
          devicesFound: allDevices,
          relevantDevices: [],
          totalFound: allDevices.length,
          relevantFound: 0,
          networkInfo: deviceScanResult.networkInfo,
          suggestion:
            "You can manually enter device details or try scanning again",
        };
      }
    }

    // No devices found - provide manual options
    return {
      success: true,
      step: "no_devices_found",
      action: "manual_entry",
      message: `Connected to "${wifiData.ssid}" but no devices found on network`,
      wifiData: wifiData,
      devicesFound: [],
      relevantDevices: [],
      totalFound: 0,
      relevantFound: 0,
      networkInfo: deviceScanResult.networkInfo,
      suggestions: [
        "Ensure your smart dispenser is powered on",
        "Check if the device is connected to the same WiFi network",
        "Try manually entering the device IP address",
        "Verify the device is in setup/pairing mode",
      ],
      buttons: [
        {
          label: "Scan Again",
          action: "retry_device_scan",
          style: "secondary",
        },
        {
          label: "Manual IP Entry",
          action: "manual_device_entry",
          style: "primary",
        },
      ],
    };
  } catch (error) {
    console.error("❌ Device discovery flow error:", error);
    return {
      success: false,
      error: error.message || "Device discovery failed",
      step: "discovery_error",
      wifiData: wifiData,
      suggestion: "Try manual device entry or check network connection",
    };
  }
};

/**
 * Retry device scanning after WiFi connection (when user returns from manual connection)
 */
export const retryDeviceScanAfterWiFi = async (wifiData, userInfo = {}) => {
  try {
    log.info("🔄 Retrying device scan after WiFi connection...", wifiData.ssid);

    // Step 1: Check if now connected to the target network
    const currentNetwork = await getCurrentNetworkInfo();
    log.info("📶 Current network after manual connection:", currentNetwork);

    if (currentNetwork?.isConnected && currentNetwork.ssid === wifiData.ssid) {
      log.info("✅ Successfully connected to target WiFi network");

      // Proceed with device discovery
      return await performDeviceDiscoveryFlow(wifiData, userInfo);
    } else {
      // Still not connected to target network
      return {
        success: false,
        step: "connection_failed",
        action: "retry_connection",
        message: "Not connected to target WiFi network",
        currentNetwork: currentNetwork?.ssid || "Unknown",
        targetNetwork: wifiData.ssid,
        suggestion: `Please ensure you're connected to "${wifiData.ssid}" and try again`,
        buttons: [
          {
            label: "Try Again",
            action: "retry_connection",
            style: "primary",
          },
          {
            label: "Manual Device Entry",
            action: "manual_device_entry",
            style: "secondary",
          },
        ],
      };
    }
  } catch (error) {
    console.error("❌ Device scan retry error:", error);
    return {
      success: false,
      error: error.message || "Device scan retry failed",
      step: "retry_error",
      suggestion: "Try manual device entry or check network connection",
    };
  }
};

/**
 * Handle manual WiFi connection result and proceed with device scanning
 */
export const handleManualWiFiConnectionResult = async (
  wifiData,
  userInfo = {}
) => {
  try {
    log.info("🔄 Handling manual WiFi connection result...");

    // Check if user is now connected to the correct network
    const currentNetwork = await getCurrentNetworkInfo();

    if (currentNetwork?.isConnected) {
      if (currentNetwork.ssid === wifiData.ssid) {
        log.info(
          "✅ Connected to correct WiFi network, scanning for devices..."
        );

        // Proceed with device discovery
        const deviceScanResult = await performDeviceDiscoveryFlow(
          wifiData,
          userInfo
        );
        return deviceScanResult;
      } else {
        log.info(`⚠️ Connected to different network: ${currentNetwork.ssid}`);
        return {
          success: false,
          step: "wrong_network",
          message: "Connected to wrong WiFi network",
          currentNetwork: currentNetwork.ssid,
          expectedNetwork: wifiData.ssid,
          suggestion: `Please connect to "${wifiData.ssid}" and try again`,
          action: "retry_connection",
        };
      }
    } else {
      log.info("❌ Not connected to any WiFi network");
      return {
        success: false,
        step: "no_connection",
        message: "Not connected to WiFi",
        suggestion: "Please connect to WiFi and try again",
        action: "retry_connection",
      };
    }
  } catch (error) {
    console.error("❌ Manual WiFi connection handling error:", error);
    return {
      success: false,
      error: error.message || "Failed to handle WiFi connection",
      step: "connection_error",
    };
  }
};

/**
 * Continue after WiFi connection - simplified version
 */
export const continueAfterWiFiConnection = async (wifiData, userInfo = {}) => {
  try {
    log.info("🔄 Continuing after WiFi connection...", wifiData.ssid);

    // Step 1: Check current network connection
    const currentNetwork = await getCurrentNetworkInfo();
    log.info("📶 Current network status:", currentNetwork);

    // Step 2: Verify WiFi connection
    if (!currentNetwork?.isConnected) {
      return {
        success: false,
        step: "not_connected",
        message: "Not connected to WiFi",
        suggestion: "Please connect to WiFi first and try again",
        action: "retry_connection",
        buttons: [
          {
            label: "Try Again",
            action: "retry_connection",
            style: "primary",
          },
        ],
      };
    }

    if (currentNetwork.type !== "WIFI") {
      return {
        success: false,
        step: "not_wifi",
        message: "Not connected to WiFi network",
        currentConnection: currentNetwork.type,
        suggestion: "Please connect to a WiFi network and try again",
        action: "retry_connection",
        buttons: [
          {
            label: "Try Again",
            action: "retry_connection",
            style: "primary",
          },
        ],
      };
    }

    // Step 3: Check if connected to the expected network (optional)
    const expectedNetwork = wifiData.ssid;
    const actualNetwork = currentNetwork.ssid;

    if (actualNetwork !== expectedNetwork) {
      log.info(
        `⚠️ Connected to different network. Expected: ${expectedNetwork}, Got: ${actualNetwork}`
      );
      // Don't fail here, just log a warning - user might have connected to a different network
    }

    log.info(`✅ Connected to WiFi: ${actualNetwork || "Unknown"}`);

    // Step 4: Scan for devices on the network
    log.info("🔍 Scanning for devices on network...");

    const deviceScanResult = await scanLocalNetworkDevices();
    log.info("📡 Device scan completed:", deviceScanResult);

    if (!deviceScanResult.success) {
      return {
        success: false,
        step: "scan_failed",
        message: "Failed to scan for devices",
        error: deviceScanResult.error,
        suggestion: "Try manual device entry or check network connection",
        action: "manual_entry",
        buttons: [
          {
            label: "Try Again",
            action: "retry_scan",
            style: "secondary",
          },
          {
            label: "Manual Entry",
            action: "manual_device_entry",
            style: "primary",
          },
        ],
      };
    }

    const { devices = [], relevantDevices = [] } = deviceScanResult;

    // Step 5: Handle scan results
    if (relevantDevices.length > 0) {
      return {
        success: true,
        step: "devices_found",
        action: "select_device",
        message: `Found ${relevantDevices.length} smart device(s)`,
        subMessage: `Connected to: ${actualNetwork || "WiFi"}`,
        wifiData: wifiData,
        currentNetwork: actualNetwork,
        devices: devices,
        relevantDevices: relevantDevices,
        totalFound: devices.length,
        relevantFound: relevantDevices.length,
        networkInfo: deviceScanResult.networkInfo,
        buttons: [
          {
            label: "Scan Again",
            action: "retry_scan",
            style: "secondary",
          },
        ],
      };
    } else if (devices.length > 0) {
      return {
        success: true,
        step: "generic_devices_found",
        action: "manual_selection",
        message: `Found ${devices.length} device(s) but none appear to be smart dispensers`,
        subMessage: `Connected to: ${actualNetwork || "WiFi"}`,
        wifiData: wifiData,
        currentNetwork: actualNetwork,
        devices: devices,
        relevantDevices: [],
        totalFound: devices.length,
        relevantFound: 0,
        networkInfo: deviceScanResult.networkInfo,
        suggestion: "You can manually select a device or enter IP manually",
        buttons: [
          {
            label: "Scan Again",
            action: "retry_scan",
            style: "secondary",
          },
          {
            label: "Manual Entry",
            action: "manual_device_entry",
            style: "primary",
          },
        ],
      };
    } else {
      return {
        success: true,
        step: "no_devices_found",
        action: "manual_entry",
        message: "No devices found on network",
        subMessage: `Connected to: ${actualNetwork || "WiFi"}`,
        wifiData: wifiData,
        currentNetwork: actualNetwork,
        devices: [],
        relevantDevices: [],
        totalFound: 0,
        relevantFound: 0,
        networkInfo: deviceScanResult.networkInfo,
        suggestions: [
          "Make sure your device is powered on",
          "Check if device is connected to the same WiFi",
          "Try manual IP entry",
          "Verify device is in pairing mode",
        ],
        buttons: [
          {
            label: "Scan Again",
            action: "retry_scan",
            style: "secondary",
          },
          {
            label: "Manual Entry",
            action: "manual_device_entry",
            style: "primary",
          },
        ],
      };
    }
  } catch (error) {
    console.error("❌ Continue after WiFi error:", error);
    return {
      success: false,
      step: "error",
      message: "Failed to continue after WiFi connection",
      error: error.message,
      suggestion: "Try manual device entry or restart the process",
      action: "manual_entry",
      buttons: [
        {
          label: "Try Again",
          action: "retry_connection",
          style: "secondary",
        },
        {
          label: "Manual Entry",
          action: "manual_device_entry",
          style: "primary",
        },
      ],
    };
  }
};

/**
 * Retry device scan - simplified version
 */
export const retryDeviceScan = async (networkInfo = null) => {
  try {
    log.info("🔄 Retrying device scan...");

    // Get current network if not provided
    if (!networkInfo) {
      const currentNetwork = await getCurrentNetworkInfo();
      if (!currentNetwork?.isConnected || currentNetwork.type !== "WIFI") {
        return {
          success: false,
          step: "not_connected",
          message: "Not connected to WiFi",
          suggestion: "Please connect to WiFi first",
          action: "connect_wifi",
        };
      }
      networkInfo = currentNetwork;
    }

    // Perform device scan
    log.info("🔍 Scanning for devices...");
    const deviceScanResult = await scanLocalNetworkDevices();

    if (!deviceScanResult.success) {
      return {
        success: false,
        step: "scan_failed",
        message: "Device scan failed",
        error: deviceScanResult.error,
        suggestion: "Try manual device entry",
        action: "manual_entry",
      };
    }

    const { devices = [], relevantDevices = [] } = deviceScanResult;

    return {
      success: true,
      step: relevantDevices.length > 0 ? "devices_found" : "no_devices_found",
      action: relevantDevices.length > 0 ? "select_device" : "manual_entry",
      message:
        relevantDevices.length > 0
          ? `Found ${relevantDevices.length} smart device(s)`
          : "No smart devices found",
      currentNetwork: networkInfo.ssid,
      devices: devices,
      relevantDevices: relevantDevices,
      totalFound: devices.length,
      relevantFound: relevantDevices.length,
      networkInfo: deviceScanResult.networkInfo,
    };
  } catch (error) {
    console.error("❌ Retry device scan error:", error);
    return {
      success: false,
      step: "error",
      message: "Failed to scan for devices",
      error: error.message,
      suggestion: "Try manual device entry",
      action: "manual_entry",
    };
  }
};

/**
 * Test WiFi module functionality
 * This function helps diagnose WiFi module issues
 */
export const testWiFiModule = async () => {
  log.info("🧪 Starting WiFi module diagnostic test...");

  const diagnostics = {
    moduleLoaded: !!WifiManager,
    moduleValidated: isWifiManagerAvailable,
    platform: Platform.OS,
    version: Platform.Version,
    availableMethods: WifiManager ? Object.keys(WifiManager) : [],
    errors: [],
    tests: {},
  };

  // Test 1: Module Loading
  try {
    const testModule = require("react-native-wifi-reborn");
    diagnostics.tests.moduleImport = {
      success: true,
      hasDefault: !!testModule.default,
      hasModule: !!testModule,
      type: typeof testModule,
    };
  } catch (error) {
    diagnostics.tests.moduleImport = {
      success: false,
      error: error.message,
    };
    diagnostics.errors.push(`Module import failed: ${error.message}`);
  }

  // Test 2: Method Availability
  if (WifiManager) {
    const requiredMethods = [
      "loadWifiList",
      "getCurrentWifiSSID",
      "getFrequency",
      "getCurrentSignalStrength",
    ];
    diagnostics.tests.methodAvailability = {};

    requiredMethods.forEach((method) => {
      diagnostics.tests.methodAvailability[method] = {
        available: typeof WifiManager[method] === "function",
        type: typeof WifiManager[method],
      };
    });
  }

  // Test 3: Basic WiFi Info (if available)
  if (WifiManager && isWifiManagerAvailable) {
    try {
      const currentSSID = await WifiManager.getCurrentWifiSSID();
      diagnostics.tests.wifiInfo = {
        success: true,
        ssid: currentSSID,
        hasSSID: !!currentSSID,
      };
    } catch (error) {
      diagnostics.tests.wifiInfo = {
        success: false,
        error: error.message,
      };
      diagnostics.errors.push(`WiFi info retrieval failed: ${error.message}`);
    }
  }

  // Test 4: Network State
  try {
    const networkState = await Network.getNetworkStateAsync();
    diagnostics.tests.networkState = {
      success: true,
      isConnected: networkState.isConnected,
      type: networkState.type,
      isWifi: networkState.type === Network.NetworkStateType.WIFI,
    };
  } catch (error) {
    diagnostics.tests.networkState = {
      success: false,
      error: error.message,
    };
  }

  log.info("🧪 WiFi module diagnostics completed:", diagnostics);
  return diagnostics;
};

/**
 * Force reinitialize WiFi module
 * Use this if the module failed to load initially
 */
export const reinitializeWiFiModule = () => {
  log.info("🔄 Force reinitializing WiFi module...");

  // Clear the current module
  WifiManager = null;
  isWifiManagerAvailable = false;

  // Try to reinitialize
  const success = initializeWifiManager();

  log.info(
    `🔄 WiFi module reinitialization: ${success ? "SUCCESS" : "FAILED"}`
  );
  return success;
};

// Export all functions for use in other components
export default {
  // Permission functions
  checkWiFiPermissions,
  requestWiFiPermissions,
  resetPermissionCache,
  getPermissionStatus,

  // Network functions
  getCurrentNetworkInfo,
  getDetailedNetworkStatus,
  checkAirplaneMode,

  // WiFi scanning functions
  scanWiFiNetworks,
  // Device discovery functions
  scanLocalNetworkDevices,
  validateDeviceConnection, // QR code functions
  validateAndParseQRCode,
  processQRCodeForDeviceRegistration,
  processWiFiQRWithDeviceFlow,
  retryDeviceScanAfterWiFi,
  handleManualWiFiConnectionResult,
  continueAfterWiFiConnection,
  retryDeviceScan, // Device registration functions
  completeDeviceRegistration,
  checkIfDeviceRegistered,
  registerSelectedDevice,
  // Utility functions
  getSignalLevel,
  getWiFiScannerStatus,
  openWiFiSettings,

  // Diagnostic functions
  testWiFiModule,
  reinitializeWiFiModule,
};
