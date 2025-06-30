import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
import { openWiFiSettings } from "../../services/wifiScanner";

const WiFiModal = ({
  visible,
  wifiDevices,
  onClose,
  onConnect,
  onShowAlert,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const styles = createStyles(themeColors, isDark);

  const [connecting, setConnecting] = useState(false);
  const [connectingSSID, setConnectingSSID] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceDetails, setDeviceDetails] = useState({
    name: "",
    room_number: "",
    floor_number: "",
    tissue_type: "hand_towel",
    meter_capacity: 500,
  });
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [manualSSID, setManualSSID] = useState("");

  const extractDeviceIdFromIdentifier = (device) => {
    // For network devices, use hostname or IP-based ID
    if (device.hostname) {
      return device.hostname.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    }
    if (device.ip) {
      return device.ip.replace(/\./g, "-").toUpperCase();
    }
    // Fallback for SSID-based devices
    if (device.ssid) {
      const parts = device.ssid.split("_");
      return parts[parts.length - 1] || device.ssid;
    }
    return "UNKNOWN";
  };

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    const deviceId = extractDeviceIdFromIdentifier(device);
    setDeviceDetails({
      name: device.hostname || device.ssid || `Device ${deviceId.slice(-4)}`,
      room_number: "",
      floor_number: "",
      tissue_type: "hand_towel",
      meter_capacity: 500,
    });
    setShowDetailsForm(true);
  };

  const handleManualEntry = async () => {
    if (!manualSSID.trim()) {
      // Use custom alert instead of native Alert
      if (onShowAlert) {
        onShowAlert({
          title: "Error",
          message: "Please enter a device IP address or hostname",
          icon: "alert-circle",
          action: null,
        });
      }
      return;
    }

    try {
      // Create a manual device entry
      const manualDevice = {
        ip: manualSSID, // Assuming it's an IP address
        hostname: `Device-${manualSSID}`,
        deviceType: "Smart Device",
        manufacturer: "Unknown",
        manual: true,
        discovered: new Date().toISOString(),
      };

      handleSelectDevice(manualDevice);
      setShowManualEntry(false);
      setManualSSID("");

      // Show success
      if (onShowAlert) {
        onShowAlert({
          title: "Device Added",
          message: `Device ${manualSSID} added successfully`,
          icon: "check-circle",
          action: null,
        });
      }
    } catch (error) {
      // Use custom alert instead of native Alert
      if (onShowAlert) {
        onShowAlert({
          title: "Error",
          message: error.message || "Failed to add device manually",
          icon: "alert-circle",
          action: null,
        });
      }
    }
  };

  const handleConnect = async () => {
    if (!selectedDevice) return;

    if (!deviceDetails.name.trim()) {
      // Use custom alert instead of native Alert
      if (onShowAlert) {
        onShowAlert({
          title: "Error",
          message: "Please enter a device name",
          icon: "alert-circle",
          action: null,
        });
      }
      return;
    }
    setConnecting(true);
    setConnectingSSID(
      selectedDevice.hostname || selectedDevice.ip || selectedDevice.ssid
    );
    try {
      // Format device data using the utility
      const formattedDevice = formatDeviceForRegistration(selectedDevice, {
        name: deviceDetails.name.trim(),
        room_number: deviceDetails.room_number.trim() || "Unassigned",
        floor_number: parseInt(deviceDetails.floor_number, 10) || 0,
        tissue_type: deviceDetails.tissue_type,
        meter_capacity: parseInt(deviceDetails.meter_capacity, 10),
        model: selectedDevice.deviceType || "Smart Device",
        firmware_version: "1.0.0",
      });

      const success = await onConnect(formattedDevice);

      if (success) {
        resetForm();
      }
    } catch (error) {
      console.error("Connection error:", error);
      // You could show an alert here if needed
      if (onShowAlert) {
        onShowAlert({
          title: "Connection Error",
          message: error.message || "Failed to connect to device",
          icon: "wifi-off",
          action: null,
        });
      }
    } finally {
      setConnecting(false);
      setConnectingSSID(null);
    }
  };
  const resetForm = () => {
    setShowDetailsForm(false);
    setShowManualEntry(false);
    setShowInstructions(false);
    setSelectedDevice(null);
    setDeviceDetails({
      name: "",
      room_number: "",
      floor_number: "",
      tissue_type: "hand_towel",
      meter_capacity: 500,
    });
    setManualSSID("");
  };

  const handleClose = () => {
    if (!connecting) {
      resetForm();
      onClose();
    }
  };

  const getSignalStrength = (signal) => {
    if (signal > -50) return { icon: "wifi-strength-4", color: "#4CAF50" };
    if (signal > -60) return { icon: "wifi-strength-3", color: "#8BC34A" };
    if (signal > -70) return { icon: "wifi-strength-2", color: "#FFC107" };
    return { icon: "wifi-strength-1", color: "#FF5722" };
  };
  const renderInstructions = () => {
    const instructions = getDeviceSetupInstructions();

    return (
      <View style={styles.instructionsContainer}>
        <Text style={styles.formTitle}>Device Setup Instructions</Text>
        <Text style={styles.formSubtitle}>
          Follow these steps to connect your smart device
        </Text>

        <ScrollView style={styles.instructionsList}>
          {instructions.map((step, index) => (
            <View key={index} style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setShowInstructions(false)}
          >
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={openWiFiSettings}
          >
            <MaterialCommunityIcons
              name="wifi-settings"
              size={16}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.connectButtonText}>Open WiFi Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Helper functions for the component
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
        : "network_scan",
      port: device.port || 80,
      services: device.services || ["HTTP"],
    };
  };

  const getDeviceSetupInstructions = () => {
    return [
      "1. Ensure your smart dispenser is powered on",
      "2. Connect the device to your WiFi network",
      "3. Check if the device is accessible on the network",
      "4. Enter the required device details below",
      "5. Click 'Add Device' to complete registration",
    ];
  };
  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Fixed Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showDetailsForm
                  ? "Configure Device"
                  : showManualEntry
                  ? "Manual Device Entry"
                  : showInstructions
                  ? "Setup Instructions"
                  : "Available Devices"}
              </Text>
              <TouchableOpacity onPress={handleClose} disabled={connecting}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            {/* Scrollable Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {connecting && (
                <View style={styles.connectingContainer}>
                  <ActivityIndicator size="large" color={themeColors.primary} />
                  <Text style={styles.connectingText}>
                    Registering device from {connectingSSID}...
                  </Text>
                  <Text style={styles.connectingSubtext}>
                    This may take a few seconds
                  </Text>
                </View>
              )}
              {showInstructions && !connecting && renderInstructions()}
              {!showDetailsForm &&
                !showManualEntry &&
                !showInstructions &&
                !connecting && (
                  <>
                    {wifiDevices.length > 0 ? (
                      <>
                        <Text style={styles.instructionText}>
                          Select a smart device to connect
                        </Text>
                        <ScrollView
                          style={styles.wifiList}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        >
                          {wifiDevices.map((device, index) => {
                            const signalInfo = device.signal
                              ? getSignalStrength(device.signal)
                              : { icon: "wifi", color: themeColors.primary };
                            return (
                              <TouchableOpacity
                                key={index}
                                style={styles.wifiItem}
                                onPress={() => handleSelectDevice(device)}
                                disabled={connecting}
                              >
                                <View style={styles.wifiInfo}>
                                  <View style={styles.wifiLeft}>
                                    <Text style={styles.wifiSSID}>
                                      {device.hostname ||
                                        device.ssid ||
                                        device.ip}
                                    </Text>
                                    <View style={styles.wifiDetails}>
                                      <MaterialCommunityIcons
                                        name={signalInfo.icon}
                                        size={16}
                                        color={signalInfo.color}
                                      />
                                      {device.signal && (
                                        <Text style={styles.wifiSignalText}>
                                          {device.signal} dBm
                                        </Text>
                                      )}
                                      <Text style={styles.deviceIdText}>
                                        {device.deviceType || "Smart Device"}
                                      </Text>
                                      {device.ip && (
                                        <Text style={styles.deviceIdText}>
                                          IP: {device.ip}
                                        </Text>
                                      )}
                                    </View>
                                  </View>

                                  <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={themeColors.text}
                                  />
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </>
                    ) : (
                      <View style={styles.emptyState}>
                        <MaterialCommunityIcons
                          name="wifi-off"
                          size={48}
                          color={themeColors.text}
                          style={styles.emptyIcon}
                        />
                        <Text style={styles.emptyTitle}>No devices found</Text>
                        <Text style={styles.emptyText}>
                          Make sure your ESP32 device is in setup mode and try
                          manual entry
                        </Text>
                      </View>
                    )}
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => setShowManualEntry(true)}
                      >
                        <Text style={styles.cancelButtonText}>
                          Manual Entry
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.button, styles.submitButton]}
                        onPress={() => setShowInstructions(true)}
                      >
                        <Text style={styles.submitButtonText}>
                          Instructions
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              {showManualEntry && !connecting && (
                <View style={styles.formContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>IP Address or Hostname *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        !manualSSID.trim() && styles.inputError,
                      ]}
                      value={manualSSID}
                      onChangeText={setManualSSID}
                      placeholder="e.g., 192.168.1.100 or device-name"
                      placeholderTextColor={themeColors.text + "80"}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={50}
                    />
                    {!manualSSID.trim() && (
                      <Text style={styles.errorText}>
                        IP address or hostname is required
                      </Text>
                    )}
                    <View style={styles.helperContainer}>
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={16}
                        color={themeColors.textSecondary}
                      />
                      <Text style={styles.helperText}>
                        Make sure your device is connected to the same network
                      </Text>
                    </View>
                  </View>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => {
                        setShowManualEntry(false);
                        setManualSSID("");
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.submitButton,
                        !manualSSID.trim() && styles.buttonDisabled,
                      ]}
                      onPress={handleManualEntry}
                      disabled={!manualSSID.trim()}
                    >
                      <Text style={styles.submitButtonText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {showDetailsForm && !connecting && (
                <View style={styles.formContainer}>
                  {/* Device Info Banner */}
                  <View style={styles.wifiInfoBanner}>
                    <View style={styles.wifiInfoLeft}>
                      <MaterialCommunityIcons
                        name="wifi-check"
                        size={18}
                        color={themeColors.primary}
                      />
                      <Text style={styles.wifiInfoText}>
                        Device:
                        {selectedDevice?.hostname ||
                          selectedDevice?.ip ||
                          selectedDevice?.ssid ||
                          "Unknown"}
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    style={styles.formScrollContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Device Name *</Text>
                      <TextInput
                        style={[
                          styles.input,
                          !deviceDetails.name.trim() && styles.inputError,
                        ]}
                        value={deviceDetails.name}
                        onChangeText={(text) =>
                          setDeviceDetails({ ...deviceDetails, name: text })
                        }
                        placeholder="e.g., Living Room Sensor"
                        placeholderTextColor={themeColors.text + "80"}
                        maxLength={50}
                      />
                      {!deviceDetails.name.trim() && (
                        <Text style={styles.errorText}>
                          Device name is required
                        </Text>
                      )}
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Room Number</Text>
                      <TextInput
                        style={styles.input}
                        value={deviceDetails.room_number}
                        onChangeText={(text) =>
                          setDeviceDetails({
                            ...deviceDetails,
                            room_number: text,
                          })
                        }
                        placeholder="e.g., 101, Lab-A"
                        placeholderTextColor={themeColors.text + "80"}
                        maxLength={20}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Floor Number</Text>
                      <TextInput
                        style={styles.input}
                        value={deviceDetails.floor_number}
                        onChangeText={(text) =>
                          setDeviceDetails({
                            ...deviceDetails,
                            floor_number: text,
                          })
                        }
                        placeholder="e.g., 1, 2, 3"
                        keyboardType="numeric"
                        placeholderTextColor={themeColors.text + "80"}
                        maxLength={3}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Tissue Type *</Text>
                      <View style={styles.pickerContainer}>
                        <TouchableOpacity
                          style={[
                            styles.pickerOption,
                            deviceDetails.tissue_type === "hand_towel" &&
                              styles.pickerOptionSelected,
                          ]}
                          onPress={() =>
                            setDeviceDetails({
                              ...deviceDetails,
                              tissue_type: "hand_towel",
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.pickerText,
                              deviceDetails.tissue_type === "hand_towel" &&
                                styles.pickerTextSelected,
                            ]}
                          >
                            Hand Towel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.pickerOption,
                            deviceDetails.tissue_type === "toilet_paper" &&
                              styles.pickerOptionSelected,
                          ]}
                          onPress={() =>
                            setDeviceDetails({
                              ...deviceDetails,
                              tissue_type: "toilet_paper",
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.pickerText,
                              deviceDetails.tissue_type === "toilet_paper" &&
                                styles.pickerTextSelected,
                            ]}
                          >
                            Toilet Paper
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Meter Capacity *</Text>
                      <View style={styles.meterCapacityContainer}>
                        <TextInput
                          style={[styles.input, styles.meterInput]}
                          value={deviceDetails.meter_capacity.toString()}
                          onChangeText={(value) =>
                            setDeviceDetails({
                              ...deviceDetails,
                              meter_capacity: parseInt(value, 10) || 0,
                            })
                          }
                          placeholder="Enter capacity"
                          keyboardType="numeric"
                          maxLength={5}
                        />
                        <View style={styles.meterPresetButtons}>
                          {[500, 1000, 1500, 2000].map((preset) => (
                            <TouchableOpacity
                              key={preset}
                              style={[
                                styles.presetButton,
                                deviceDetails.meter_capacity === preset &&
                                  styles.presetButtonActive,
                              ]}
                              onPress={() =>
                                setDeviceDetails({
                                  ...deviceDetails,
                                  meter_capacity: preset,
                                })
                              }
                            >
                              <Text
                                style={[
                                  styles.presetButtonText,
                                  deviceDetails.meter_capacity === preset &&
                                    styles.presetButtonTextActive,
                                ]}
                              >
                                {preset}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={styles.helperContainer}>
                        <MaterialCommunityIcons
                          name="information-outline"
                          size={16}
                          color={themeColors.textSecondary}
                        />
                        <Text style={styles.helperText}>
                          Reference value will be set to
                          {deviceDetails.meter_capacity}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>

                  {/* Fixed Footer */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => {
                        setShowDetailsForm(false);
                        setSelectedDevice(null);
                      }}
                      disabled={connecting}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.submitButton,
                        (!deviceDetails.name.trim() || connecting) &&
                          styles.buttonDisabled,
                      ]}
                      onPress={handleConnect}
                      disabled={connecting || !deviceDetails.name.trim()}
                    >
                      {connecting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          Connect Device
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const createStyles = (themeColors, isDark) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: themeColors.surface || themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      minHeight: "85%",
      maxHeight: "98%",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: -5,
      },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
      borderWidth: 1,
      borderColor: isDark ? themeColors.border : "transparent",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border || themeColors.inputbg,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: themeColors.heading,
    },
    instructionText: {
      fontSize: 14,
      color: themeColors.text,
      marginBottom: 16,
      opacity: 0.8,
    },
    connectingContainer: {
      alignItems: "center",
      marginVertical: 20,
      padding: 20,
      backgroundColor: themeColors.inputbg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border || "transparent",
    },
    connectingText: {
      marginTop: 12,
      fontSize: 16,
      color: themeColors.text,
      textAlign: "center",
      fontWeight: "500",
    },
    connectingSubtext: {
      marginTop: 4,
      fontSize: 12,
      color: themeColors.text,
      opacity: 0.6,
    },
    wifiList: {
      maxHeight: 250,
      marginBottom: 16,
    },
    wifiItem: {
      borderWidth: 1,
      borderColor: themeColors.border || themeColors.inputbg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      backgroundColor: themeColors.inputbg,
    },
    wifiItemConnecting: {
      backgroundColor: themeColors.primaryLight || themeColors.inputbg,
      borderColor: themeColors.primary || themeColors.heading,
    },
    wifiInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    wifiLeft: {
      flex: 1,
    },
    wifiSSID: {
      fontSize: 16,
      fontWeight: "600",
      color: themeColors.heading,
      marginBottom: 4,
    },
    wifiDetails: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    wifiSignalText: {
      fontSize: 13,
      color: themeColors.text,
      opacity: 0.8,
    },
    deviceIdText: {
      fontSize: 12,
      color: themeColors.text,
      opacity: 0.6,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: themeColors.heading,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: themeColors.text,
      opacity: 0.7,
      textAlign: "center",
      paddingHorizontal: 20,
    },
    modalBody: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 16,
    },
    formContainer: {
      padding: 10,
      flex: 1,
    },
    formScrollContainer: {
      flex: 1,
    },
    wifiInfoBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: `${themeColors.primary}10`,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: `${themeColors.primary}30`,
    },
    wifiInfoLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    wifiInfoText: {
      fontSize: 14,
      color: themeColors.primary,
      fontWeight: "600",
      marginLeft: 8,
    },
    inputGroup: {
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: themeColors.heading,
      marginBottom: 8,
    },
    buttonContainer: {
      flexDirection: "row",
      padding: 10,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border || themeColors.inputbg,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: themeColors.inputbg,
      borderWidth: 1,
      borderColor: themeColors.border || themeColors.text + "30",
    },
    submitButton: {
      backgroundColor: themeColors.primary,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    cancelButtonText: {
      color: themeColors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border || themeColors.inputbg,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: themeColors.heading,
      backgroundColor: themeColors.inputbg,
      width: "100%",
    },
    inputError: {
      borderColor: "#dc3545",
    },
    errorText: {
      color: "#dc3545",
      fontSize: 14,
      marginTop: 4,
    },
    // Instructions specific styles
    instructionsContainer: {
      marginTop: 8,
    },
    instructionsList: {
      maxHeight: 350,
      marginVertical: 16,
    },
    instructionStep: {
      flexDirection: "row",
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: themeColors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2,
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    stepText: {
      flex: 1,
      fontSize: 15,
      color: themeColors.text,
      lineHeight: 22,
      paddingTop: 4,
    },
    // Device specific styles
    deviceType: {
      fontSize: 12,
      color: themeColors.primary,
      fontWeight: "500",
      marginTop: 2,
    },
    deviceManufacturer: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginTop: 1,
    },
    deviceIP: {
      fontSize: 10,
      color: themeColors.textSecondary,
      fontFamily: "monospace",
      marginTop: 1,
    },
    pickerContainer: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    pickerOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border || themeColors.inputbg,
      backgroundColor: themeColors.inputbg,
      alignItems: "center",
      justifyContent: "center",
    },
    pickerOptionSelected: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    pickerText: {
      fontSize: 14,
      fontWeight: "500",
      color: themeColors.text,
    },
    pickerTextSelected: {
      color: "#fff",
    },
    helperText: {
      fontSize: 12,
      color: themeColors.text + "80",
      marginTop: 4,
      fontStyle: "italic",
    },
    helperContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      gap: 6,
    },
    meterCapacityContainer: {
      gap: 12,
    },
    meterInput: {
      textAlign: "center",
      fontWeight: "600",
      fontSize: 18,
    },
    meterPresetButtons: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "space-between",
    },
    presetButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: themeColors.border || themeColors.inputbg,
      backgroundColor: themeColors.inputbg,
      alignItems: "center",
      justifyContent: "center",
    },
    presetButtonActive: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    presetButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: themeColors.text,
    },
    presetButtonTextActive: {
      color: "#fff",
    },
  });

export default WiFiModal;
