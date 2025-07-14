import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const WifiPopup = ({
  dispenserIp = "",
  initialSsid = "",
  initialPassword = "",
  onSuccess,
  onClose,
  visible = true,
}) => {
  const { themeColors, isDark } = useThemeContext();
  // Derive iconBg if not present in themeColors
  const colors = {
    ...themeColors,
    iconBg: themeColors.iconBg || (isDark ? themeColors.surface : "#F4F8FF"),
  };
  const styles = createStyles(colors, isDark);

  const [ssid, setSsid] = useState(initialSsid);
  const [password, setPassword] = useState(initialPassword);
  const [ip, setIp] = useState(dispenserIp);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [isAutoFilled, setIsAutoFilled] = useState(
    !!initialSsid && !!initialPassword
  );

  // Update state when props change
  useEffect(() => {
    setSsid(initialSsid);
    setPassword(initialPassword);
    setIp(dispenserIp);
    setIsAutoFilled(!!initialSsid && !!initialPassword);
  }, [initialSsid, initialPassword, dispenserIp]);

  const submitForm = async () => {
    if (!ssid) {
      setError("Dispenser SSID is required");
      return;
    }

    if (!ip) {
      setError("Dispenser IP address is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setResponseMsg("");

    try {
      // Pass the information to the parent component
      if (onSuccess) {
        onSuccess({ ssid, password, dispenserIp: ip });
      }
      setResponseMsg("Continuing to router setup...");
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          {/* Close button */}
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          {/* Icon */}
          <View
            style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}
          >
            <Ionicons
              name={
                error
                  ? "close-circle"
                  : responseMsg
                  ? "checkmark-circle"
                  : "wifi"
              }
              size={38}
              color={
                error
                  ? colors.error
                  : responseMsg
                  ? colors.success
                  : colors.primary
              }
            />
          </View>
          {/* Title */}
          <Text style={styles.title}>{"Dispenser Wi-Fi Setup"}</Text>
          {/* Message */}
          {responseMsg ? (
            <Text style={styles.successMessage}>{responseMsg}</Text>
          ) : error ? (
            <Text style={styles.errorMessage}>{error}</Text>
          ) : (
            <Text style={styles.message}>
              Confirm the dispenser Wi-Fi details and enter its IP address.
            </Text>
          )}

          {/* Form */}
          <Text style={styles.label}>Dispenser SSID</Text>
          <TextInput
            style={[styles.input, isAutoFilled && styles.autoFilledInput]}
            placeholder="Enter Dispenser SSID"
            value={ssid}
            onChangeText={(text) => {
              setSsid(text);
              if (isAutoFilled) setIsAutoFilled(false);
            }}
            autoCapitalize="none"
            placeholderTextColor={colors.text + "99"}
            editable={!initialSsid}
          />
          {initialSsid && (
            <Text style={styles.autoFilledText}>Auto-filled from QR code</Text>
          )}

          <Text style={styles.label}>Dispenser Password</Text>
          <TextInput
            style={[styles.input, isAutoFilled && styles.autoFilledInput]}
            placeholder="Enter Dispenser Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (isAutoFilled) setIsAutoFilled(false);
            }}
            secureTextEntry
            autoCapitalize="none"
            placeholderTextColor={colors.text + "99"}
            editable={!initialPassword}
          />
          {initialPassword && (
            <Text style={styles.autoFilledText}>Auto-filled from QR code</Text>
          )}

          <Text style={styles.label}>Dispenser IP Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 192.168.4.1"
            value={ip}
            onChangeText={setIp}
            keyboardType="numeric"
            autoCapitalize="none"
            placeholderTextColor={colors.text + "99"}
          />
          {(!ip || ip.trim() === "") && (
            <Text style={styles.helperText}>
              Please enter the dispenser&apos;s IP address manually (not found
              in QR).
            </Text>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={submitForm}
            >
              <Text style={styles.actionButtonText}>Continue</Text>
            </TouchableOpacity>
            {onClose && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.secondaryButtonText,
                    { color: colors.text },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default WifiPopup;

function createStyles(colors, isDark) {
  return StyleSheet.create({
    helperText: {
      fontSize: 13,
      color: colors.error,
      marginBottom: 8,
      marginTop: 2,
      alignSelf: "flex-start",
      fontStyle: "italic",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    autoFilledInput: {
      backgroundColor: isDark ? `${colors.primary}20` : `${colors.primary}10`,
      borderColor: colors.primary,
    },
    autoFilledText: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 2,
      marginBottom: 8,
      alignSelf: "flex-start",
      fontStyle: "italic",
    },
    alertContainer: {
      width: "90%",
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      elevation: 10,
      position: "relative",
    },
    closeButton: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
      backgroundColor: colors.inputbg,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
      backgroundColor: colors.iconBg,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 12,
      color: colors.heading,
      letterSpacing: 0.2,
    },
    message: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
      textAlign: "center",
    },
    successMessage: {
      fontSize: 16,
      color: colors.success,
      marginBottom: 20,
      textAlign: "center",
      fontWeight: "600",
    },
    errorMessage: {
      fontSize: 16,
      color: colors.error,
      marginBottom: 20,
      textAlign: "center",
      fontWeight: "600",
    },
    label: {
      fontSize: 15,
      marginBottom: 4,
      marginTop: 14,
      color: colors.text,
      fontWeight: "600",
      alignSelf: "flex-start",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputbg,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      fontSize: 16,
      marginBottom: 2,
      width: "100%",
      marginTop: 2,
      color: colors.text,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
      marginTop: 28,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      minHeight: 48,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.2,
      color: "#fff",
      textAlign: "center",
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
    },
    secondaryButtonText: {
      color: colors.text,
    },
  });
}
