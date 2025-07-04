import React, { useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const AddDeviceModal = ({
  visible,
  editingDevice,
  onClose,
  onSubmit,
  onShowAlert,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const styles = createStyles(themeColors, isDark);
  const [formData, setFormData] = useState({
    name: "",
    room_number: "",
    floor_number: "",
    tissue_type: "hand_towel",
    gender: "male", // Default gender for rest room paper dispensers
    meter_capacity: 500,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if this is a WiFi-registered device
  const isWiFiDevice = editingDevice?.registration_type === "wifi";

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      if (editingDevice) {
        console.log("🔧 Editing device:", editingDevice);
        console.log("🔧 Device gender:", editingDevice.gender);
        console.log("🔧 Device tissue_type:", editingDevice.tissue_type);
        setFormData({
          name: editingDevice.name || "",
          room_number: editingDevice.room_number || "",
          floor_number: editingDevice.floor_number?.toString() || "",
          tissue_type: editingDevice.tissue_type || "hand_towel",
          gender: editingDevice.gender || "male", // Include gender for existing devices
          meter_capacity: editingDevice.meter_capacity || 500,
        });
      } else {
        setFormData({
          name: "",
          room_number: "",
          floor_number: "",
          tissue_type: "hand_towel",
          gender: "male", // Default gender for new devices
          meter_capacity: 500,
        });
      }
      setErrors({});
    }
  }, [visible, editingDevice]);
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Device name is required";
    }

    if (!formData.room_number.trim()) {
      newErrors.room_number = "Room number is required";
    }

    if (!formData.floor_number.trim()) {
      newErrors.floor_number = "Floor number is required";
    } else if (isNaN(parseInt(formData.floor_number, 10))) {
      newErrors.floor_number = "Floor number must be a valid number";
    }

    // Validate meter capacity
    const meterCapacityNum = parseInt(formData.meter_capacity, 10);
    if (!formData.meter_capacity.toString().trim()) {
      newErrors.meter_capacity = "Meter capacity is required";
    } else if (isNaN(meterCapacityNum)) {
      newErrors.meter_capacity = "Meter capacity must be a valid number";
    } else if (meterCapacityNum <= 0) {
      newErrors.meter_capacity = "Meter capacity must be greater than 0";
    } else if (meterCapacityNum > 99999) {
      newErrors.meter_capacity = "Meter capacity cannot exceed 99999";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert floor_number to integer
      const deviceData = {
        name: formData.name.trim(),
        room_number: formData.room_number.trim(),
        floor_number: parseInt(formData.floor_number, 10),
        tissue_type: formData.tissue_type,
        gender:
          formData.tissue_type === "toilet_paper" ? formData.gender : null, // Only include gender for rest room paper
        meter_capacity: parseInt(formData.meter_capacity, 10),
      };

      console.log("💾 Submitting device data:", deviceData);

      const success = await onSubmit(deviceData);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error submitting device:", error);

      // Use custom alert instead of native Alert
      if (onShowAlert) {
        onShowAlert({
          title: "Error",
          message: "Failed to save device. Please try again.",
          icon: "alert-circle",
          action: null,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (field, value) => {
    let processedValue = value;

    // Handle meter_capacity as number
    if (field === "meter_capacity") {
      // Allow only numeric characters
      processedValue = value.replace(/[^0-9]/g, "");
      // Convert to number, but keep as string for display
      processedValue =
        processedValue === "" ? "" : parseInt(processedValue, 10);
    }

    // When tissue type changes, reset gender to default
    if (field === "tissue_type") {
      setFormData((prev) => ({
        ...prev,
        [field]: processedValue,
        gender: processedValue === "toilet_paper" ? "male" : prev.gender, // Reset gender for rest room paper
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingDevice ? "Edit Device" : "Add New Device"}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          {/* WiFi Device Info Banner */}
          {isWiFiDevice && editingDevice && (
            <View style={styles.wifiInfoBanner}>
              <View style={styles.wifiInfoLeft}>
                <MaterialCommunityIcons
                  name="wifi-check"
                  size={18}
                  color={themeColors.primary}
                />
                <Text style={styles.wifiInfoText}>WiFi Device Connected</Text>
              </View>
              {editingDevice.device_id && (
                <View style={styles.deviceIdContainer}>
                  <Text style={styles.deviceIdLabel}>ID:</Text>
                  <Text style={styles.deviceIdText}>
                    {editingDevice.device_id.slice(-6).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}
          {/* Device Metadata Info */}
          {editingDevice && (
            <View style={styles.metadataContainer}>
              <Text style={styles.metadataTitle}>Device Information</Text>

              {/* WiFi Device Technical Details */}
              {editingDevice.metadata && (
                <>
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Model:</Text>
                    <Text style={styles.metadataValue}>
                      {editingDevice.metadata.model || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Firmware:</Text>
                    <Text style={styles.metadataValue}>
                      v{editingDevice.metadata.firmware_version || "N/A"}
                    </Text>
                  </View>
                  {editingDevice.metadata.mac_address && (
                    <View style={styles.metadataRow}>
                      <Text style={styles.metadataLabel}>MAC Address:</Text>
                      <Text style={styles.metadataValue}>
                        {editingDevice.metadata.mac_address}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Tissue Type and Meter Capacity Information */}
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Tissue Type:</Text>{" "}
                <Text style={styles.metadataValue}>
                  {editingDevice.tissue_type === "hand_towel"
                    ? "Hand Towel"
                    : editingDevice.tissue_type === "toilet_paper"
                    ? "Rest Room Paper"
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Meter Capacity:</Text>
                <Text style={styles.metadataValue}>
                  {editingDevice.meter_capacity || "N/A"}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Reference Value:</Text>
                <Text style={styles.metadataValue}>
                  {editingDevice.refer_value ||
                    editingDevice.meter_capacity ||
                    "N/A"}
                </Text>
              </View>
            </View>
          )}
          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Device Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => handleChange("name", text)}
                placeholder="Enter device name"
                placeholderTextColor={themeColors.text + "80"}
                editable={!isSubmitting}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Room Number *</Text>
              <TextInput
                style={[styles.input, errors.room_number && styles.inputError]}
                value={formData.room_number}
                onChangeText={(text) => handleChange("room_number", text)}
                placeholder="Enter room number"
                placeholderTextColor={themeColors.text + "80"}
                editable={!isSubmitting}
              />
              {errors.room_number && (
                <Text style={styles.errorText}>{errors.room_number}</Text>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Floor Number *</Text>
              <TextInput
                style={[styles.input, errors.floor_number && styles.inputError]}
                value={formData.floor_number}
                onChangeText={(text) => handleChange("floor_number", text)}
                placeholder="Enter floor number"
                placeholderTextColor={themeColors.text + "80"}
                keyboardType="numeric"
                editable={!isSubmitting}
              />
              {errors.floor_number && (
                <Text style={styles.errorText}>{errors.floor_number}</Text>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tissue Type *</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    formData.tissue_type === "hand_towel" &&
                      styles.pickerOptionSelected,
                  ]}
                  onPress={() => handleChange("tissue_type", "hand_towel")}
                  disabled={isSubmitting}
                >
                  <MaterialCommunityIcons
                    name="paper-roll"
                    size={20}
                    color={
                      formData.tissue_type === "hand_towel"
                        ? "#fff"
                        : themeColors.primary
                    }
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.pickerText,
                      formData.tissue_type === "hand_towel" &&
                        styles.pickerTextSelected,
                    ]}
                  >
                    Hand Towel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    formData.tissue_type === "toilet_paper" &&
                      styles.pickerOptionSelected,
                  ]}
                  onPress={() => handleChange("tissue_type", "toilet_paper")}
                  disabled={isSubmitting}
                >
                  <MaterialCommunityIcons
                    name="toilet"
                    size={20}
                    color={
                      formData.tissue_type === "toilet_paper"
                        ? "#fff"
                        : themeColors.primary
                    }
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.pickerText,
                      formData.tissue_type === "toilet_paper" &&
                        styles.pickerTextSelected,
                    ]}
                  >
                    Rest Room Paper
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Gender Selection - Only show for rest room paper */}
            {formData.tissue_type === "toilet_paper" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rest Room Type *</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      styles.genderOption,
                      formData.gender === "male" && styles.pickerOptionSelected,
                    ]}
                    onPress={() => handleChange("gender", "male")}
                    disabled={isSubmitting}
                  >
                    <MaterialCommunityIcons
                      name="human-male"
                      size={20}
                      color={formData.gender === "male" ? "#fff" : "#4A90E2"}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.pickerText,
                        formData.gender === "male" && styles.pickerTextSelected,
                      ]}
                    >
                      Men Rest Room
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      styles.genderOption,
                      formData.gender === "female" &&
                        styles.pickerOptionSelected,
                    ]}
                    onPress={() => handleChange("gender", "female")}
                    disabled={isSubmitting}
                  >
                    <MaterialCommunityIcons
                      name="human-female"
                      size={20}
                      color={formData.gender === "female" ? "#fff" : "#E91E63"}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.pickerText,
                        formData.gender === "female" &&
                          styles.pickerTextSelected,
                      ]}
                    >
                      Women Rest Room
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meter Capacity *</Text>
              <View style={styles.meterCapacityContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.meterInput,
                    errors.meter_capacity && styles.inputError,
                  ]}
                  value={formData.meter_capacity.toString()}
                  onChangeText={(value) =>
                    handleChange("meter_capacity", value)
                  }
                  placeholder="Enter capacity"
                  keyboardType="numeric"
                  editable={!isSubmitting}
                  maxLength={5}
                />
                <View style={styles.meterPresetButtons}>
                  {[500, 1000, 1500, 2000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.presetButton,
                        formData.meter_capacity === preset &&
                          styles.presetButtonActive,
                      ]}
                      onPress={() =>
                        handleChange("meter_capacity", preset.toString())
                      }
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          formData.meter_capacity === preset &&
                            styles.presetButtonTextActive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {errors.meter_capacity && (
                <Text style={styles.errorText}>{errors.meter_capacity}</Text>
              )}
              <View style={styles.helperContainer}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color={themeColors.textSecondary}
                />
                <Text style={styles.helperText}>
                  Reference value will be set to {formData.meter_capacity}
                </Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingDevice ? "Update" : "Add"} Device
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Dynamic styles function that takes theme colors
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
      minHeight: "50%",
      maxHeight: "90%",
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
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border || themeColors.inputbg,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: themeColors.heading,
    },
    wifiInfoBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: `${themeColors.primary}10`,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 20,
      marginTop: 12,
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
    deviceIdContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${themeColors.primary}20`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    deviceIdLabel: {
      fontSize: 11,
      color: themeColors.primary,
      fontWeight: "500",
      marginRight: 4,
    },
    deviceIdText: {
      fontSize: 12,
      color: themeColors.primary,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontWeight: "bold",
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
    helperContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      gap: 6,
    },
    metadataContainer: {
      backgroundColor: themeColors.inputbg,
      marginHorizontal: 20,
      marginTop: 12,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    metadataTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: themeColors.heading,
      marginBottom: 12,
    },
    metadataRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    metadataLabel: {
      fontSize: 13,
      color: themeColors.text,
      opacity: 0.7,
    },
    metadataValue: {
      fontSize: 13,
      color: themeColors.text,
      fontWeight: "500",
    },
    formContainer: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: themeColors.heading,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border || themeColors.inputbg,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: themeColors.heading,
      backgroundColor: themeColors.inputbg,
    },
    inputError: {
      borderColor: "#dc3545",
    },
    errorText: {
      color: "#dc3545",
      fontSize: 14,
      marginTop: 4,
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
      flexDirection: "row",
    },
    pickerOptionSelected: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    genderOption: {
      minHeight: 50,
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
    buttonContainer: {
      flexDirection: "row",
      padding: 20,
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
  });

export default AddDeviceModal;
