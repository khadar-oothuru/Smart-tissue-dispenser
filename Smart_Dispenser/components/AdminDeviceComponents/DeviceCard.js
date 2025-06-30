// components/AdminDeviceComponents/DeviceCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const DeviceCard = ({ device, onEdit, onDelete }) => {
  const { themeColors, isDark } = useThemeContext();

  const styles = createStyles(themeColors, isDark);

  const handleEdit = () => onEdit?.(device);
  const handleDelete = () => onDelete?.(device);

  const createdDate = device?.created_at
    ? new Date(device.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  // Format device ID - prefer device_id for WiFi devices, fallback to id
  const displayId = device?.device_id
    ? device.device_id.slice(-6).toUpperCase()
    : device?.id;

  // Get registration icon
  const getRegistrationIcon = () => {
    if (device?.registration_type === "wifi") {
      return (
        <MaterialCommunityIcons
          name="wifi"
          size={14}
          color={themeColors.primary}
        />
      );
    }
    return (
      <MaterialCommunityIcons
        name="pencil"
        size={14}
        color={themeColors.text}
      />
    );
  };

  // Get device metadata info
  const getDeviceInfo = () => {
    if (device?.metadata && device.metadata.model) {
      return `${device.metadata.model} • v${
        device.metadata.firmware_version || "1.0"
      }`;
    }
    return device?.registration_type === "wifi"
      ? "WiFi Device"
      : "Manual Entry";
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="hardware-chip-outline"
            size={24}
            color={themeColors.primary}
          />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.nameRow}>
            <Text style={styles.deviceName}>
              {device?.name || `Device ${displayId}`}
            </Text>
            {getRegistrationIcon()}
          </View>
          <Text style={styles.deviceId}>ID: {displayId}</Text>
          <Text style={styles.deviceMeta}>{getDeviceInfo()}</Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        {/* Details Row */}
        <View style={styles.detailsRow}>
          {/* Floor Section */}
          <View style={styles.detailSection}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="business" size={20} color={themeColors.primary} />
            </View>
            <Text style={styles.detailLabel}>Floor</Text>
            <Text style={styles.detailValue}>
              {device?.floor_number !== undefined ? device.floor_number : "N/A"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Room Section */}
          <View style={styles.detailSection}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="bed" size={20} color={themeColors.primary} />
            </View>
            <Text style={styles.detailLabel}>Room</Text>
            <Text style={styles.detailValue}>
              {device?.room_number || "N/A"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Date Section */}
          <View style={styles.detailSection}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color={themeColors.primary} />
            </View>
            <Text style={styles.detailLabel}>Added</Text>
            <Text style={styles.detailValue}>{createdDate}</Text>
          </View>
        </View>

        {/* WiFi Device Metadata Row */}
        {device?.metadata && device.metadata.last_heartbeat && (
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={themeColors.text}
                style={styles.metadataIcon}
              />
              <Text style={styles.metadataText}>
                Last seen:{" "}
                {new Date(device.metadata.last_heartbeat).toLocaleString()}
              </Text>
            </View>
            {device.metadata.signal_strength && (
              <View style={styles.metadataItem}>
                <MaterialCommunityIcons
                  name="wifi"
                  size={14}
                  color={
                    device.metadata.signal_strength > -60
                      ? "#4CAF50"
                      : "#FFC107"
                  }
                  style={styles.metadataIcon}
                />
                <Text style={styles.metadataText}>
                  {device.metadata.signal_strength} dBm
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            accessibilityLabel="Edit device"
          >
            <Ionicons
              name="newspaper-outline"
              size={18}
              color={themeColors.primary}
            />
            <Text style={[styles.buttonText, { color: themeColors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityLabel="Delete device"
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={themeColors.danger}
            />
            <Text style={[styles.buttonText, { color: themeColors.danger }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (themeColors, isDark) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
      marginHorizontal: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: isDark
        ? `${themeColors.primary}20`
        : `${themeColors.primary}15`,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? themeColors.primary : "transparent",
    },
    headerContent: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    deviceName: {
      fontSize: 20,
      fontWeight: "600",
      color: themeColors.heading,
    },
    deviceId: {
      fontSize: 13,
      color: themeColors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    deviceMeta: {
      fontSize: 12,
      color: themeColors.text,
      opacity: 0.6,
      marginTop: 2,
      fontStyle: "italic",
    },
    detailsCard: {
      backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 8,
      elevation: isDark ? 0 : 3,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? themeColors.border : "transparent",
    },
    detailsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    detailSection: {
      flex: 1,
      alignItems: "center",
    },
    detailIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark
        ? `${themeColors.primary}20`
        : `${themeColors.primary}15`,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? `${themeColors.primary}40` : "transparent",
    },
    detailLabel: {
      fontSize: 12,
      color: themeColors.text,
      marginBottom: 4,
      opacity: 0.7,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: themeColors.heading,
    },
    divider: {
      width: 1,
      height: 60,
      backgroundColor: themeColors.border,
      marginHorizontal: 8,
      opacity: isDark ? 0.3 : 0.2,
    },
    metadataRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      marginBottom: 16,
    },
    metadataItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    metadataIcon: {
      marginRight: 6,
    },
    metadataText: {
      fontSize: 12,
      color: themeColors.text,
      opacity: 0.7,
    },
    actionButtonsRow: {
      flexDirection: "row",
      gap: 12,
    },
    editButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: isDark
        ? `${themeColors.primary}15`
        : `${themeColors.primary}10`,
      borderWidth: 1,
      borderColor: themeColors.primary,
      gap: 6,
    },
    deleteButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: isDark
        ? `${themeColors.danger}15`
        : `${themeColors.danger}10`,
      borderWidth: 1,
      borderColor: themeColors.danger,
      gap: 6,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "600",
    },
  });

export default DeviceCard;
