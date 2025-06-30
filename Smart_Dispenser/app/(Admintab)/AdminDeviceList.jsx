import React, { useEffect, useState, useCallback } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  AppState,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";
import { useDeviceOperations } from "../../hooks/useDeviceOperations";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  checkWiFiPermissions,
  getCurrentNetworkInfo,
  resetPermissionCache,
  getDetailedNetworkStatus,
  getPermissionStatus,
  requestWiFiPermissions,
  scanWiFiNetworks,
  scanLocalNetworkDevices,
  openWiFiSettings,
  validateDeviceConnection,
  checkIfDeviceRegistered,
  completeDeviceRegistration,
} from "../../services/wifiScanner";
import { CustomAlert } from "../../components/common/CustomAlert";
import { debugPermissions } from "../../utils/permissionDebugger";

// Import modular components
import AddDeviceModal from "../../components/AdminDeviceComponents/AddDeviceModal";
import DeviceCard from "../../components/AdminDeviceComponents/DeviceCard";
import DeviceHeader from "../../components/AdminDeviceComponents/DeviceHeader";
import WiFiModal from "../../components/AdminDeviceComponents/WiFiModal";
import WiFiOptionsModal from "../../components/AdminDeviceComponents/WiFiOptionsModal";
import WiFiQRScanner from "../../components/AdminDeviceComponents/WiFiQRScanner";
import NetworkStatus from "../../components/AdminDeviceComponents/NetworkStatus";
import { ScreenWrapper } from "@/components/common/ScreenWrapper";

const AdminDeviceList = () => {
  const { accessToken, user } = useAuth();
  const { themeColors, isDark } = useThemeContext();

  // Create dynamic styles
  const styles = createStyles(themeColors);

  // Use the custom hook
  const {
    devices,
    loading,
    error,
    refreshing,
    loadDevices,
    onRefresh,
    handleDeviceSubmit,
    handleDeviceUpdate,
    handleDeviceDelete,
    handleWiFiConnect,
    filterDevices,
    clearError,
  } = useDeviceOperations(accessToken); // Local UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [showWifiOptionsModal, setShowWifiOptionsModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [wifiDevices, setWifiDevices] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionCheckDone, setPermissionCheckDone] = useState(false);
  // Custom modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showWifiSetupModal, setShowWifiSetupModal] = useState(false);
  const [showDiscoveryFailedModal, setShowDiscoveryFailedModal] =
    useState(false);
  const [showAuthErrorModal, setShowAuthErrorModal] = useState(false);
  const [showDeviceExistsModal, setShowDeviceExistsModal] = useState(false);

  // WiFi QR processing state
  const [pendingWifiQRDevice, setPendingWifiQRDevice] = useState(null);
  // Modal content states
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    icon: "",
    action: null,
    deviceToDelete: null,
    existingDevice: null,
  }); // Check network status and permissions on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check permissions first
        const permissionCheck = await checkWiFiPermissions();
        setPermissionsGranted(permissionCheck.granted);
        setPermissionCheckDone(true);

        // Check network status
        const status = await getCurrentNetworkInfo();
        setNetworkStatus(status);

        // Run debug permissions if we detect any issues
        if (!permissionCheck.granted) {
          console.log("🔍 Permission issues detected, running debug report...");
          await debugPermissions();
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        setPermissionCheckDone(true);
        // Run debug on errors too
        await debugPermissions();
      }
    };

    initializeApp(); // Set up periodic network check
    const interval = setInterval(async () => {
      try {
        const status = await getCurrentNetworkInfo();
        setNetworkStatus(status);
      } catch (error) {
        console.error("Error checking network status:", error);
      }
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, []);
  // Listen for app state changes to recheck permissions when returning from settings
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === "active" && !permissionCheckDone) {
        console.log("📱 App returned to foreground, rechecking permissions...");
        try {
          // Reset cache and recheck permissions
          resetPermissionCache();
          const permissionCheck = await checkWiFiPermissions();
          setPermissionsGranted(permissionCheck.granted);
          setPermissionCheckDone(true);
          console.log(
            "✅ Permission recheck completed:",
            permissionCheck.granted
          );
        } catch (error) {
          console.error("Error rechecking permissions:", error);
          setPermissionCheckDone(true);
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [permissionCheckDone, permissionsGranted]);

  // Debug logging
  useEffect(() => {
    console.log("🎯 AdminDeviceList - Auth state:", {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length,
      user: user?.username || "No user",
    });
  }, [accessToken, user]);

  // Load devices on component mount and when accessToken changes
  useEffect(() => {
    let isMounted = true;

    const initializeDevices = async () => {
      if (!accessToken) {
        console.warn("⚠️ AdminDeviceList: No access token available");
        return;
      }

      console.log("🚀 AdminDeviceList: Initializing devices...");

      try {
        if (isMounted) {
          await loadDevices();
        }
      } catch (err) {
        console.error("❌ AdminDeviceList: Failed to initialize devices:", err);
        if (isMounted) {
          setModalContent({
            title: "Error",
            message:
              "Failed to load devices. Please check your connection and try again.",
            icon: "alert-circle",
            action: () => loadDevices(),
          });
          setShowErrorModal(true);
        }
      }
    };

    initializeDevices();

    return () => {
      isMounted = false;
    };
  }, [accessToken, loadDevices]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        clearError();
      }
    };
  }, [error, clearError]);

  // Filter devices based on search term - with null safety
  const filteredDevices = filterDevices(searchTerm);

  const handleAddDevice = useCallback(() => {
    console.log("➕ Opening add device modal");
    setEditingDevice(null);
    setShowAddModal(true);
  }, []);

  const handleEditDevice = useCallback((device) => {
    console.log("✏️ Opening edit device modal for:", device.name);
    setEditingDevice(device);
    setShowAddModal(true);
  }, []);
  const handleSubmitDevice = useCallback(
    async (deviceData) => {
      console.log("💾 AdminDeviceList: Submitting device data:", deviceData);
      const startTime = Date.now();

      try {
        let success = false;

        if (editingDevice) {
          // Update existing device
          console.log("🔄 AdminDeviceList: Updating existing device...");
          success = await handleDeviceUpdate(editingDevice.id, deviceData);
        } else {
          // Add new device
          console.log("➕ AdminDeviceList: Adding new device...");
          success = await handleDeviceSubmit(deviceData);
        }

        if (success) {
          console.log(
            `✅ AdminDeviceList: Device operation successful in ${
              Date.now() - startTime
            }ms`
          );
          setShowAddModal(false);
          setEditingDevice(null);

          // Show success modal with enhanced message
          setModalContent({
            title: "Success!",
            message: editingDevice
              ? "Device updated successfully and synced across all views"
              : "Device added successfully and synced across all views",
            icon: "checkmark-circle",
            action: null,
          });
          setShowSuccessModal(true);

          // The store already handles synchronization, no additional refresh needed
          console.log(
            "ℹ️ AdminDeviceList: Store synchronization handled automatically"
          );
        } else {
          console.log("❌ AdminDeviceList: Device operation failed");
        }

        return success;
      } catch (error) {
        console.error(
          "❌ AdminDeviceList: Error in handleSubmitDevice:",
          error
        );
        setModalContent({
          title: "Error",
          message: error.message || "Failed to save device",
          icon: "alert-circle",
          action: null,
        });
        setShowErrorModal(true);
        return false;
      }
    },
    [editingDevice, handleDeviceSubmit, handleDeviceUpdate]
  );

  const handleDeleteDeviceConfirm = useCallback(async (device) => {
    console.log("🗑️ Preparing to delete device:", device.name);

    setModalContent({
      title: "Delete Device",
      message: `Are you sure you want to delete "${device.name}"?`,
      icon: "trash",
      deviceToDelete: device,
    });
    setShowDeleteConfirmModal(true);
  }, []);
  const confirmDeleteDevice = useCallback(async () => {
    const device = modalContent.deviceToDelete;
    console.log(
      "🗑️ AdminDeviceList: Confirming device deletion:",
      device?.name
    );
    setShowDeleteConfirmModal(false);
    const startTime = Date.now();

    try {
      const success = await handleDeviceDelete(device);
      if (success) {
        console.log(
          `✅ AdminDeviceList: Device deleted successfully in ${
            Date.now() - startTime
          }ms`
        );
        setModalContent({
          title: "Success!",
          message: "Device deleted successfully and synced across all views",
          icon: "checkmark-circle",
          action: null,
        });
        setShowSuccessModal(true);
        // Store synchronization is handled automatically
        console.log(
          "ℹ️ AdminDeviceList: Store synchronization handled automatically"
        );
      }
    } catch (error) {
      console.error("❌ AdminDeviceList: Error in confirmDeleteDevice:", error);
      setModalContent({
        title: "Error",
        message: error.message || "Failed to delete device",
        icon: "alert-circle",
        action: null,
      });
      setShowErrorModal(true);
    }
  }, [modalContent.deviceToDelete, handleDeviceDelete]); // Updated WiFi scan function to directly open QR scanner
  const handleWifiScan = useCallback(async () => {
    console.log("� Opening WiFi QR scanner directly..."); // Open the WiFi options modal first
    setShowWifiOptionsModal(true);
  }, []);
  const handleWiFiSetupConfirm = useCallback(async (openSettings) => {
    setShowWifiSetupModal(false);
    if (openSettings) {
      // Open WiFi settings and reset permission check to revalidate when user returns
      const result = await openWiFiSettings();
      if (!result.success) {
        console.error("Failed to open WiFi settings:", result.error);
      } else {
        console.log(
          "📱 Opened WiFi settings, will recheck permissions on return"
        );
        // Reset permission state and cache to recheck when user returns to app
        resetPermissionCache();
        setPermissionsGranted(false);
        setPermissionCheckDone(false);
      }

      // When returning from settings, proceed to scan for devices
      setTimeout(async () => {
        try {
          const deviceScanResult = await scanLocalNetworkDevices();
          if (deviceScanResult.success && deviceScanResult.devices.length > 0) {
            setWifiDevices(deviceScanResult.devices);
          } else {
            setWifiDevices([]); // Empty array for manual entry
          }
          setShowWifiModal(true);
        } catch (error) {
          console.error("Post-settings device scan failed:", error);
          setWifiDevices([]);
          setShowWifiModal(true);
        }
      }, 1000);
    } else {
      // Reset permission state and cache to recheck before manual entry
      resetPermissionCache();
      setPermissionsGranted(false);
      setPermissionCheckDone(false);
      setWifiDevices([]);
      setShowWifiModal(true);
    }
  }, []);

  // Updated WiFi connect function
  const handleConnectWifi = useCallback(
    async (deviceData) => {
      console.log("🔗 Connecting to device with data:", deviceData);
      console.log("🔗 Device data type:", typeof deviceData);
      console.log("🔗 Device data keys:", Object.keys(deviceData || {}));

      try {
        // Validate connection first
        console.log("🔍 Starting device validation...");
        const validation = await validateDeviceConnection(deviceData);
        console.log("🔍 Validation result:", validation);

        if (!validation.isValid) {
          console.error("❌ Device validation failed:", validation);
          setModalContent({
            title: "Connection Error",
            message: validation.error,
            icon: "alert-circle",
            action: null,
          });
          setShowErrorModal(true);
          return false;
        }

        // Check if device is already registered
        if (accessToken && deviceData.device_id) {
          const statusCheck = await checkIfDeviceRegistered(
            accessToken,
            deviceData.device_id
          );
          if (statusCheck.exists) {
            setModalContent({
              title: "Device Already Registered",
              message: `This device (${statusCheck.device?.name}) is already registered in the system.`,
              icon: "information-circle",
              existingDevice: statusCheck.device,
              action: () => {
                setShowWifiModal(false);
                // No need to call loadDevices() - data is already current
              },
            });
            setShowDeviceExistsModal(true);
            return false;
          }
        }
        const success = await handleWiFiConnect(deviceData);
        if (success) {
          console.log(
            "✅ AdminDeviceList: WiFi device registration successful"
          );
          setShowWifiModal(false);
          setWifiDevices([]);
          setModalContent({
            title: "Success!",
            message:
              "WiFi device connected successfully and synced to dashboard",
            icon: "checkmark-circle",
            action: null,
          });
          setShowSuccessModal(true);

          // Store synchronization is handled automatically
          console.log(
            "ℹ️ AdminDeviceList: WiFi device state synced automatically"
          );
        }
        return success;
      } catch (error) {
        console.error("❌ Error in handleConnectWifi:", error);
        return false;
      }
    },
    [handleWiFiConnect, accessToken]
  );

  // Handle token expiration or auth issues
  useEffect(() => {
    if (
      error &&
      typeof error === "string" &&
      (error.includes("401") || error.includes("Unauthorized"))
    ) {
      console.warn("🔒 Authentication error detected:", error);
      setModalContent({
        title: "Authentication Error",
        message: "Your session has expired. Please log in again.",
        icon: "lock-closed",
        action: () => clearError(),
      });
      setShowAuthErrorModal(true);
    }
  }, [error, clearError]);
  // Handle WiFi network scanning option
  const handleWifiNetworkScan = useCallback(async () => {
    console.log("📡 Starting WiFi network and device discovery...");
    console.log("🔍 DEBUG: Initial state check:", {
      permissionsGranted,
      permissionCheckDone,
      networkStatus,
    });

    setShowWifiOptionsModal(false);
    setScanning(true);

    try {
      // First check network connectivity and airplane mode
      console.log("🌐 Checking network status...");
      const detailedStatus = await getDetailedNetworkStatus();
      console.log("🌐 Network status result:", detailedStatus);
      setNetworkStatus(detailedStatus);

      if (detailedStatus.isAirplaneModeEnabled) {
        console.log("✈️ Airplane mode is enabled");
        throw new Error(
          "Please disable airplane mode to scan for WiFi networks and devices"
        );
      }

      if (!detailedStatus.isConnected) {
        console.log("📡 No network connection detected");
        throw new Error("Please connect to a WiFi network to discover devices");
      }

      if (!detailedStatus.canScanWifi) {
        console.log("🚫 WiFi scanning not available");
        throw new Error(
          "WiFi scanning is not available. Please check your network connection"
        );
      }

      // Get detailed permission status for better debugging
      console.log("🔐 Getting permission status...");
      const permissionStatus = await getPermissionStatus();
      console.log("📊 Permission Status:", permissionStatus);

      // Use cached permission state first, but be more intelligent about it
      let hasValidPermissions = permissionsGranted;
      console.log("🔐 Current permission state:", {
        hasValidPermissions,
        permissionsGranted,
        permissionCheckDone,
      });

      // If permissions not checked yet or essential permissions are missing, check again
      if (!permissionCheckDone || !permissionsGranted) {
        console.log("🔐 Checking WiFi permissions...");
        const permissionCheck = await checkWiFiPermissions();
        console.log("🔐 Permission check result:", permissionCheck);

        hasValidPermissions = permissionCheck.granted;
        setPermissionsGranted(permissionCheck.granted);
        setPermissionCheckDone(true);

        // Log detailed permission info
        if (permissionCheck.essentialPermissions) {
          console.log(
            "Essential permissions:",
            permissionCheck.essentialPermissions
          );
        }
        if (permissionCheck.optionalPermissions) {
          console.log(
            "Optional permissions:",
            permissionCheck.optionalPermissions
          );
        }
      }

      // Request permissions only if essential ones are not granted
      if (!hasValidPermissions) {
        console.log("🔐 Essential WiFi permissions not granted, requesting...");

        // Reset cache before requesting to avoid stale state
        resetPermissionCache();

        const hasPermission = await requestWiFiPermissions();
        console.log("🔐 Permission request result:", hasPermission);

        if (!hasPermission.success) {
          console.error("❌ Permission request failed:", hasPermission.error);

          const isNeverAskAgain =
            hasPermission.neverAskAgainPermissions?.length > 0;

          setModalContent({
            title: isNeverAskAgain
              ? "Permissions Required"
              : "Permission Required",
            message:
              hasPermission.error +
              (isNeverAskAgain
                ? "\n\nTo enable WiFi scanning:\n1. Open device Settings\n2. Go to Apps > Smart Dispenser > Permissions\n3. Enable Location permissions"
                : "\n\nTip: Location permission is required by Android for WiFi scanning to protect your privacy."),
            icon: "lock-closed",
            action: hasPermission.canOpenSettings
              ? () => {
                  openWiFiSettings();
                }
              : null,
          });
          setShowErrorModal(true);
          setScanning(false);
          return;
        } else {
          // Update cached permission state
          setPermissionsGranted(true);
          hasValidPermissions = true;
          console.log("✅ Essential permissions granted successfully");
        }
      } else {
        console.log("✅ WiFi permissions already granted (cached)");
      }

      // Start real WiFi network scanning
      console.log("📡 Starting WiFi network scan...");
      const wifiScanResult = await scanWiFiNetworks();
      console.log("📡 WiFi scan result:", wifiScanResult);

      if (!wifiScanResult.success) {
        console.error("❌ WiFi scan failed:", wifiScanResult.error);
        throw new Error(wifiScanResult.error || "WiFi network scan failed");
      }

      console.log(
        `📡 Found ${wifiScanResult.networks?.length || 0} WiFi networks`
      );

      // Start local network device scanning
      console.log("🔍 Starting local network device scan...");
      const deviceScanResult = await scanLocalNetworkDevices();
      console.log("🔍 Device scan result:", deviceScanResult);

      if (deviceScanResult.success && deviceScanResult.devices?.length > 0) {
        // Found devices on the network
        console.log(
          `✅ Found ${deviceScanResult.devices.length} devices:`,
          deviceScanResult.devices
        );
        setWifiDevices(deviceScanResult.devices);
        setShowWifiModal(true);
      } else {
        // No devices found, show manual entry option
        console.log("⚠️ No devices found on network");
        setModalContent({
          title: "No Devices Found",
          message: `Scanned ${
            wifiScanResult.networks?.length || 0
          } WiFi networks but found no smart devices. Would you like to try manual device entry?`,
          icon: "wifi-off",
          action: () => {
            setWifiDevices([]);
            setShowWifiModal(true);
          },
        });
        setShowDiscoveryFailedModal(true);
      }

      setScanning(false);
      console.log("✅ WiFi network scan completed successfully");
    } catch (error) {
      console.error("❌ Device discovery failed:", error);
      console.error("❌ Error stack:", error.stack);

      // Determine error type and provide appropriate message
      let errorTitle = "Discovery Failed";
      let errorMessage = error.message || "Unable to discover devices";
      let errorIcon = "wifi-off";

      if (error.message?.includes("airplane mode")) {
        errorTitle = "Airplane Mode Detected";
        errorMessage = "Please disable airplane mode and try again";
        errorIcon = "airplane";
      } else if (error.message?.includes("connect to a WiFi")) {
        errorTitle = "No WiFi Connection";
        errorMessage = "Please connect to a WiFi network and try again";
        errorIcon = "wifi-off";
      } else if (error.message?.includes("permission")) {
        errorTitle = "Permission Error";
        errorMessage =
          error.message +
          "\n\nPlease grant the required permissions in device settings";
        errorIcon = "lock-closed";
      } else {
        errorMessage +=
          "\n\nTip: Make sure your device is connected to the same WiFi network as your smart devices";
      }

      console.log("📢 Showing error modal:", {
        errorTitle,
        errorMessage,
        errorIcon,
      });

      setModalContent({
        title: errorTitle,
        message: errorMessage,
        icon: errorIcon,
        action: () => {
          setWifiDevices([]);
          setShowWifiModal(true);
        },
      });
      setShowDiscoveryFailedModal(true);
      setScanning(false);
    }
  }, [permissionsGranted, permissionCheckDone, networkStatus]);
  // Handle WiFi QR code scanning option
  const handleWifiQRScan = useCallback(() => {
    console.log("📱 Opening WiFi QR scanner directly...");
    setShowWifiOptionsModal(false); // Open QR scanner directly
    setShowQRScanner(true);
  }, []);

  // Handle QR scan success
  const handleQRScanSuccess = useCallback(
    async (qrResult) => {
      setShowQRScanner(false);
      console.log("📱 QR Scan Success:", qrResult);

      try {
        if (qrResult.type === "wifi") {
          // Handle WiFi QR code - proceed directly to device registration flow
          console.log("🔗 Processing WiFi QR code:", qrResult.data); // Generate a more robust device entry from WiFi QR data for registration
          const cleanSSID = qrResult.data.ssid.replace(/[^a-zA-Z0-9]/g, "");
          const deviceId = `WIFI_${cleanSSID.toUpperCase()}_${Date.now()
            .toString()
            .slice(-6)}`;
          const hostname = `WiFi-${cleanSSID}`;

          const wifiDeviceData = {
            ip: "192.168.1.100", // Default IP - will be updated when device connects
            hostname: hostname,
            deviceType: "Smart Dispenser",
            manufacturer: "ESP32",
            qrCode: true,
            manual: false,
            discovered: new Date().toISOString(),
            ssid: qrResult.data.ssid,
            wifiPassword: qrResult.data.password,
            connectionType: "wifi_qr",
            registration_type: "wifi", // Mark as WiFi registration
            device_id: deviceId,
            mac: "00:00:00:00:00:00", // Default MAC address
            port: 80,
            services: ["HTTP", "WiFi Setup"],
            // Additional metadata for WiFi devices
            wifiData: {
              ssid: qrResult.data.ssid,
              password: qrResult.data.password,
              security: qrResult.data.security || "WPA2",
              hidden: qrResult.data.hidden || false,
            },
          };

          console.log("📱 Generated WiFi device data:", wifiDeviceData); // Show WiFi info and proceed to device registration
          setModalContent({
            title: "WiFi QR Code Detected! 📶",
            message:
              `Network: "${qrResult.data.ssid}"\n` +
              `Security: ${qrResult.data.password ? "Secured" : "Open"}\n\n` +
              `This will register a device for this WiFi network. You can customize the device details next.`,
            icon: "wifi",
            action: () => {
              try {
                console.log("🚀 WiFi QR action triggered!");
                console.log("📋 WiFi device data to be set:", wifiDeviceData);
                console.log(
                  "📋 Current wifiDevices state before setting:",
                  wifiDevices
                );
                console.log("📋 Current showWifiModal state:", showWifiModal);

                // Set the device data first
                setWifiDevices([wifiDeviceData]);

                // Log after setting
                console.log("📋 WiFi devices set successfully");

                // Use a longer delay to ensure state is properly updated
                setTimeout(() => {
                  console.log("📋 Attempting to open WiFi modal...");
                  console.log(
                    "📋 Current wifiDevices length:",
                    wifiDevices.length
                  );
                  setShowWifiModal(true);
                  console.log("📋 setShowWifiModal(true) called");
                }, 300);
              } catch (error) {
                console.error("❌ Error in WiFi QR action:", error);
              }
            },
          });
          setShowSuccessModal(true);
        } else if (qrResult.type === "device" || qrResult.type === "ip") {
          // Handle device QR code - create device object and register directly
          console.log("📱 Processing device QR code:", qrResult.data);

          const deviceData = {
            ip: qrResult.data.ip,
            hostname:
              qrResult.data.hostname ||
              qrResult.data.name ||
              `Device-${qrResult.data.ip}`,
            deviceType:
              qrResult.data.type || qrResult.data.deviceType || "Smart Device",
            manufacturer: qrResult.data.manufacturer || "Unknown",
            qrCode: true,
            manual: false,
            discovered: new Date().toISOString(),
            ...qrResult.data,
          };

          // Try to register the device directly
          if (accessToken) {
            try {
              setScanning(true);
              const registrationResult = await completeDeviceRegistration(
                accessToken,
                deviceData,
                {
                  name: deviceData.hostname,
                  tissue_type: "hand_towel",
                  meter_capacity: 500,
                }
              );
              setScanning(false);

              if (registrationResult.success) {
                setModalContent({
                  title: "Device Registered! ✅",
                  message: `Device "${registrationResult.device.name}" has been successfully registered.`,
                  icon: "checkmark-circle",
                  action: () => {
                    loadDevices(); // Refresh device list
                  },
                });
                setShowSuccessModal(true);
              } else {
                // Registration failed - show device details form
                setWifiDevices([deviceData]);
                setShowWifiModal(true);
                setModalContent({
                  title: "Device Found! 📱",
                  message: `Device detected but registration needs additional details.\n\nDevice: ${deviceData.hostname}\nIP: ${deviceData.ip}`,
                  icon: "information-circle",
                  action: null,
                });
                setShowSuccessModal(true);
              }
            } catch (error) {
              setScanning(false);
              console.error("Device registration error:", error);
              // Show device details form for manual registration
              setWifiDevices([deviceData]);
              setShowWifiModal(true);
            }
          } else {
            // No token - show device details form
            setWifiDevices([deviceData]);
            setShowWifiModal(true);
          }
        } else {
          // Unknown QR code type
          setModalContent({
            title: "QR Code Scanned",
            message: `QR code detected but format not recognized.\n\nType: ${
              qrResult.type || "Unknown"
            }\n\nPlease scan a WiFi QR code or device QR code.`,
            icon: "qrcode",
            action: () => {
              setShowQRScanner(true);
            },
          });
          setShowErrorModal(true);
        }
      } catch (error) {
        console.error("❌ QR scan processing error:", error);
        setModalContent({
          title: "QR Scan Error",
          message: error.message || "Failed to process QR code",
          icon: "alert-circle",
          action: null,
        });
        setShowErrorModal(true);
      }
    },
    [accessToken, loadDevices, wifiDevices, showWifiModal]
  );

  // Handle QR scan error
  const handleQRScanError = useCallback((error) => {
    setShowQRScanner(false);
    setModalContent({
      title: "Scan Error",
      message: error || "Failed to scan QR code",
      icon: "camera-off",
      action: null,
    });
    setShowErrorModal(true);
  }, []);

  // Handle QR scan close
  const handleQRScanClose = useCallback(() => {
    setShowQRScanner(false);
  }, []);

  // Handle pending WiFi QR device processing
  useEffect(() => {
    if (pendingWifiQRDevice && !showSuccessModal) {
      console.log("🔄 Processing pending WiFi QR device:", pendingWifiQRDevice);
      setWifiDevices([pendingWifiQRDevice]);

      setTimeout(() => {
        console.log("📱 Opening WiFi modal for pending device");
        setShowWifiModal(true);
        setPendingWifiQRDevice(null); // Clear the pending device
      }, 200);
    }
  }, [pendingWifiQRDevice, showSuccessModal]);

  // Show loading screen while initial load
  if (loading && (!devices || devices.length === 0) && !refreshing) {
    return (
      <LoadingScreen
        message="Loading Devices"
        submessage="Fetching your device data..."
        iconName="devices"
        variant="fullscreen"
        customIcon={
          <MaterialCommunityIcons
            name="devices"
            size={50}
            color={themeColors.primary}
          />
        }
      />
    );
  }
  // Show scanning loading screen
  if (scanning) {
    return (
      <LoadingScreen
        message="Scanning WiFi Networks"
        submessage="Discovering available networks and smart devices..."
        iconName="wifi"
        variant="fullscreen"
        customIcon={
          <MaterialCommunityIcons
            name="wifi"
            size={50}
            color={themeColors.primary}
          />
        }
      />
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <DeviceHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddDevice={handleAddDevice}
          onWifiScan={handleWifiScan}
          scanning={scanning}
        />
        {/* Network Status Component - Now Active! */}
        <NetworkStatus />
        <ScrollView
          style={styles.deviceList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
            />
          }
        >
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
              <Text style={styles.debugText}>
                Token: {accessToken ? "✓ Available" : "✗ Missing"}
              </Text>
            </View>
          )}
          {/* Network Connection Warning */}
          {networkStatus && !networkStatus.isConnected && (
            <View style={styles.warningContainer}>
              <MaterialCommunityIcons
                name="wifi-off"
                size={20}
                color="#FF6B6B"
              />
              <Text style={styles.warningText}>
                No network connection. Some features may be unavailable.
              </Text>
            </View>
          )}
          {filteredDevices.length > 0 ? (
            filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onEdit={handleEditDevice}
                onDelete={handleDeleteDeviceConfirm}
              />
            ))
          ) : !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name={searchTerm ? "magnify-remove-outline" : "devices-off"}
                size={64}
                color={themeColors.text}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>
                {error
                  ? "Error loading devices"
                  : searchTerm
                  ? "No devices match your search"
                  : "No devices found"}
              </Text>
              {!error && !searchTerm && (
                <Text style={styles.emptySubtext}>
                  Tap the + button to add your first device
                </Text>
              )}
            </View>
          ) : null}
        </ScrollView>
        <AddDeviceModal
          visible={showAddModal}
          editingDevice={editingDevice}
          onClose={() => {
            setShowAddModal(false);
            setEditingDevice(null);
          }}
          onSubmit={handleSubmitDevice}
        />
        <WiFiModal
          visible={showWifiModal}
          wifiDevices={wifiDevices}
          onClose={() => setShowWifiModal(false)}
          onConnect={handleConnectWifi}
          onShowAlert={(alertContent) => {
            console.log("📢 WiFi Modal Alert:", alertContent);
            setModalContent({
              title: alertContent.title || "Alert",
              message:
                typeof alertContent.message === "string"
                  ? alertContent.message
                  : JSON.stringify(alertContent.message) || "An error occurred",
              icon: alertContent.icon || "alert-circle",
              action: alertContent.action,
            });

            // Determine modal type based on content
            if (
              alertContent.title?.toLowerCase().includes("success") ||
              alertContent.title?.toLowerCase().includes("connected")
            ) {
              setShowSuccessModal(true);
            } else {
              setShowErrorModal(true);
            }
          }}
        />
        {/* Custom Error Modal */}
        <CustomAlert
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title={modalContent.title}
          message={modalContent.message}
          type="error"
          primaryAction={
            modalContent.action
              ? {
                  text: "Retry",
                  onPress: modalContent.action,
                }
              : null
          }
          secondaryAction={{
            text: modalContent.action ? "Cancel" : "OK",
            onPress: () => {},
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* Success Modal */}
        <CustomAlert
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title={modalContent.title}
          message={modalContent.message}
          type="success"
          primaryAction={{
            text: "Got it",
            onPress: () => {
              console.log("🎯 Success modal 'Got it' button pressed");
              // Execute the action if it exists
              if (modalContent.action) {
                console.log("🎯 Executing modal action...");
                try {
                  modalContent.action();
                } catch (error) {
                  console.error("❌ Error executing modal action:", error);
                }
              } else {
                console.log("⚠️ No modal action to execute");
              }
              setShowSuccessModal(false);
            },
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* Delete Confirmation Modal */}
        <CustomAlert
          visible={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          title={modalContent.title}
          message={modalContent.message}
          type="error"
          primaryAction={{
            text: "Delete",
            onPress: confirmDeleteDevice,
          }}
          secondaryAction={{
            text: "Cancel",
            onPress: () => {},
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* WiFi Setup Modal */}
        <CustomAlert
          visible={showWifiSetupModal}
          onClose={() => setShowWifiSetupModal(false)}
          title="Smart Device Discovery"
          message={
            "To discover smart devices on your network:\n\n" +
            "1. Ensure your smart devices are connected to the same WiFi network\n" +
            "2. Make sure your devices are powered on and in discovery mode\n" +
            "3. Check your WiFi settings if needed\n" +
            "4. Return to this app to scan for devices\n\n" +
            "Would you like to open WiFi settings to verify your connection?"
          }
          type="info"
          primaryAction={{
            text: "Open WiFi Settings",
            onPress: () => handleWiFiSetupConfirm(true),
          }}
          secondaryAction={{
            text: "Continue Scanning",
            onPress: () => handleWiFiSetupConfirm(false),
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* Discovery Failed Modal */}
        <CustomAlert
          visible={showDiscoveryFailedModal}
          onClose={() => setShowDiscoveryFailedModal(false)}
          title={modalContent.title}
          message={modalContent.message}
          type="error"
          primaryAction={{
            text: "Manual Entry",
            onPress: () => modalContent.action && modalContent.action(),
          }}
          secondaryAction={{
            text: "Cancel",
            onPress: () => {},
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* Device Already Exists Modal */}
        <CustomAlert
          visible={showDeviceExistsModal}
          onClose={() => setShowDeviceExistsModal(false)}
          title={modalContent.title}
          message={modalContent.message}
          type="info"
          primaryAction={{
            text: "OK",
            onPress: () => modalContent.action && modalContent.action(),
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* Auth Error Modal */}
        <CustomAlert
          visible={showAuthErrorModal}
          onClose={() => setShowAuthErrorModal(false)}
          title={modalContent.title}
          message={modalContent.message}
          type="error"
          primaryAction={{
            text: "OK",
            onPress: () => modalContent.action && modalContent.action(),
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* WiFi Options Modal */}
        <WiFiOptionsModal
          visible={showWifiOptionsModal}
          onClose={() => setShowWifiOptionsModal(false)}
          onWifiNetworkScan={handleWifiNetworkScan}
          onWifiQRScan={handleWifiQRScan}
        />
        {/* QR Scanner Modal */}
        <Modal
          visible={showQRScanner}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <WiFiQRScanner
            onClose={handleQRScanClose}
            onScanSuccess={handleQRScanSuccess}
            onScanError={handleQRScanError}
            title="Scan WiFi or Device QR Code"
          />
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

// Dynamic styles function that takes theme colors
const createStyles = (themeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    deviceList: {
      flex: 1,
      padding: 1,
    },
    errorContainer: {
      backgroundColor: themeColors.surface || themeColors.inputbg,
      padding: 12,
      marginBottom: 16,
      marginHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border || "#ff6b6b",
    },
    errorText: {
      color: "#ff6b6b",
      fontSize: 14,
    },
    debugText: {
      marginTop: 8,
      fontSize: 12,
      color: themeColors.text,
      fontStyle: "italic",
      opacity: 0.6,
    },
    warningContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFF5F5",
      padding: 12,
      marginBottom: 16,
      marginHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FFDDDD",
    },
    warningText: {
      marginLeft: 8,
      fontSize: 14,
      color: "#FF6B6B",
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 64,
    },
    emptyIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    emptyText: {
      fontSize: 18,
      color: themeColors.text,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      color: themeColors.text,
      marginTop: 8,
      textAlign: "center",
      opacity: 0.7,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "80%",
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      padding: 16,
      elevation: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 16,
    },
    wifiOptionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.card,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      elevation: 2,
    },
    wifiOptionTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
  });

export default AdminDeviceList;
