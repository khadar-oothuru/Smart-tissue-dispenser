import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";

const AnalyticsFilters = ({
  selectedPeriod,
  selectedDevice,
  devices,
  onPeriodChange,
  onDeviceChange,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const periods = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "Yearly", value: "yearly" },
  ];

  const deviceOptions = [
    { label: "All Devices", value: "all" },
    ...devices.map((device) => ({
      label: device.name || `Device ${device.id}`,
      value: device.id.toString(),
    })),
  ];

  const handlePeriodPickerOpen = () => {
    setShowPeriodPicker(true);
  };

  const handleDevicePickerOpen = () => {
    setShowDevicePicker(true);
  };

  const handlePeriodSelect = (value) => {
    onPeriodChange(value);
    setShowPeriodPicker(false);
  };

  const handleDeviceSelect = (value) => {
    onDeviceChange(value);
    setShowDevicePicker(false);
  };

  const renderDropdown = (label, value, onPress, showIcon = true) => (
    <TouchableOpacity
      style={[
        styles.glassDropdownButton,
        {
          backgroundColor: isDark
            ? themeColors.surface
            : themeColors.background,
          borderColor: isDark ? themeColors.border : "rgba(255, 255, 255, 0.2)",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={
          isDark
            ? [themeColors.surface, themeColors.background]
            : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.6)"]
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.dropdownContent}>
        <Text
          style={[
            styles.glassDropdownLabel,
            { color: themeColors.text + "80" },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[styles.glassDropdownValue, { color: themeColors.heading }]}
        >
          {value}
        </Text>
      </View>
      {showIcon && (
        <Ionicons name="chevron-down" size={20} color={themeColors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderModal = (
    visible,
    onClose,
    data,
    selectedValue,
    onSelect,
    title
  ) => {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            onClose();
          }}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: themeColors.background,
                borderColor: themeColors.border || themeColors.text + "20",
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    themeColors.border || themeColors.text + "10",
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={data}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor:
                        selectedValue === item.value
                          ? themeColors.primary + "10"
                          : "transparent",
                      borderBottomColor:
                        themeColors.border || themeColors.text + "10",
                    },
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      {
                        color:
                          selectedValue === item.value
                            ? themeColors.primary
                            : themeColors.text,
                        fontWeight:
                          selectedValue === item.value ? "600" : "400",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={themeColors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const getSelectedPeriodLabel = () => {
    const period = periods.find((p) => p.value === selectedPeriod);
    return period ? period.label : "Select Period";
  };

  const getSelectedDeviceLabel = () => {
    const device = deviceOptions.find((d) => d.value === selectedDevice);
    return device ? device.label : "Select Device";
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.filterItem}>
          {renderDropdown(
            "Period",
            getSelectedPeriodLabel(),
            handlePeriodPickerOpen
          )}
        </View>

        <View style={styles.filterItem}>
          {renderDropdown(
            "Device",
            getSelectedDeviceLabel(),
            handleDevicePickerOpen
          )}
        </View>
      </View>

      {renderModal(
        showPeriodPicker,
        () => {
          setShowPeriodPicker(false);
        },
        periods,
        selectedPeriod,
        handlePeriodSelect,
        "Select Period"
      )}

      {renderModal(
        showDevicePicker,
        () => {
          setShowDevicePicker(false);
        },
        deviceOptions,
        selectedDevice,
        handleDeviceSelect,
        "Select Device"
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },

  // Glass-Style Dropdown Button
  glassDropdownButton: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  glassDropdownLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "600",
    opacity: 0.8,
  },
  glassDropdownValue: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // Legacy styles (keeping for compatibility)
  dropdownButton: {
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownContent: {
    flex: 1,
    justifyContent: "center",
  },
  dropdownLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
  },
});

export default AnalyticsFilters;
