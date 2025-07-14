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
import { CustomAlert } from "../common/CustomAlert";

const ManualDeviceIPEntry = ({
  ssid = "",
  password = "",
  ip = "", // This is the dispenser IP passed from WifiPopup
  onSubmit,
  onCancel,
  visible = true,
}) => {
  const { themeColors, isDark } = useThemeContext();
  // Derive iconBg if not present in themeColors
  const colors = {
    ...themeColors,
    iconBg: themeColors.iconBg || (isDark ? themeColors.surface : "#F4F8FF"),
  };
  const styles = createStyles(colors, isDark);
  const [dispenserIp, setDispenserIp] = useState(ip);
  const [routerSsid, setRouterSsid] = useState("");
  const [routerPassword, setRouterPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleContinue = async () => {
    if (!dispenserIp) {
      setError("Device IP address is missing");
      return;
    }
    if (!routerSsid) {
      setError("Please enter the router SSID");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      // Send router credentials to the dispenser's IP address using POST /submit with JSON body
      const dispenserEndpoint = `http://${dispenserIp}/submit`;
      const routerCredentials = {
        ssid: routerSsid,
        password: routerPassword,
      };
      console.log(`Sending router credentials to ${dispenserEndpoint}`);
      try {
        const response = await fetch(dispenserEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(routerCredentials),
          timeout: 10000, // 10 second timeout
        });
        const responseData = await response.text();
        console.log("Dispenser configuration response:", responseData);
      } catch (fetchError) {
        console.error("Error sending credentials to dispenser:", fetchError);
        setAlertMessage(
          fetchError?.message ||
            "Network request failed. Please check the device IP and your connection."
        );
        setShowAlert(true);
        // Continue with onSubmit even if the direct API call fails
      }

      // Call onSubmit with all the data to continue with device registration in the app
      // Defensive: ensure all values are strings, never undefined
      await onSubmit({
        dispenserIp:
          typeof dispenserIp === "string"
            ? dispenserIp
            : dispenserIp
            ? String(dispenserIp)
            : "",
        dispenserSsid:
          typeof ssid === "string" ? ssid : ssid ? String(ssid) : "",
        dispenserPassword:
          typeof password === "string"
            ? password
            : password
            ? String(password)
            : "",
        routerSsid:
          typeof routerSsid === "string"
            ? routerSsid
            : routerSsid
            ? String(routerSsid)
            : "",
        routerPassword:
          typeof routerPassword === "string"
            ? routerPassword
            : routerPassword
            ? String(routerPassword)
            : "",
      });
    } catch (err) {
      console.error("Error submitting router credentials:", err);
      setAlertMessage(
        err?.message || "Failed to send credentials. Please try again."
      );
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={onCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertContainer}>
            {/* Close button */}
            {onCancel && (
              <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            )}
            {/* Icon */}
            <View
              style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}
            >
              <Ionicons name="wifi" size={38} color={colors.primary} />
            </View>
            {/* Title */}
            <Text style={styles.title}>Router Wi-Fi Setup</Text>

            <Text style={styles.message}>
              Enter your router Wi-Fi credentials to connect the dispenser to
              your network.
            </Text>

            <Text style={styles.label}>Dispenser IP Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 192.168.4.1"
              value={dispenserIp}
              onChangeText={setDispenserIp}
              keyboardType="numeric"
              autoCapitalize="none"
              placeholderTextColor={colors.text + "99"}
            />
            {(!dispenserIp || dispenserIp.trim() === "") && (
              <Text style={styles.error}>
                Please enter the dispenser&apos;s IP address.
              </Text>
            )}

            <Text style={styles.label}>Dispenser SSID</Text>
            <Text style={styles.value}>{ssid}</Text>

            <Text style={styles.label}>Dispenser Password</Text>
            <Text style={styles.value}>{password ? "••••••••" : "(none)"}</Text>

            <Text style={styles.label}>Router SSID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Router SSID"
              value={routerSsid}
              onChangeText={setRouterSsid}
              autoCapitalize="none"
              placeholderTextColor={colors.text + "99"}
            />

            <Text style={styles.label}>Router Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Router Password"
              value={routerPassword}
              onChangeText={setRouterPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={colors.text + "99"}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleContinue}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Connecting </Text>
                  </View>
                ) : (
                  <Text style={styles.actionButtonText}>Connect Wi-Fi</Text>
                )}
              </TouchableOpacity>
              {onCancel && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  onPress={onCancel}
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
      {/* Custom Alert for errors */}
      <CustomAlert
        visible={showAlert}
        onClose={() => setShowAlert(false)}
        title="Network Error"
        message={alertMessage}
        type="error"
        themeColors={themeColors}
        isDark={isDark}
        primaryAction={{ text: "OK", onPress: () => setShowAlert(false) }}
      />
    </>
  );
};

function createStyles(colors, isDark) {
  return StyleSheet.create({
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    alertContainer: {
      width: "100%",
      maxWidth: 700,
      minWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingVertical: 28,
      paddingHorizontal: 48,
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
      top: 16,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
      backgroundColor: colors.inputbg,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
      backgroundColor: colors.iconBg || "#F4F8FF",
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 10,
      color: colors.heading,
      letterSpacing: 0.2,
    },
    message: {
      fontSize: 18,
      color: colors.text,
      marginBottom: 18,
      textAlign: "center",
      maxWidth: 520,
      alignSelf: "center",
    },
    label: {
      fontSize: 16,
      marginBottom: 2,
      marginTop: 12,
      color: colors.text,
      fontWeight: "600",
      alignSelf: "flex-start",
      width: "100%",
    },
    value: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
      alignSelf: "flex-start",
      width: "100%",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputbg,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      fontSize: 16,
      marginBottom: 2,
      width: "100%",
      marginTop: 2,
      color: colors.text,
      alignSelf: "center",
    },
    actionsContainer: {
      flexDirection: "row",
      gap: 20,
      width: "100%",
      marginTop: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      minHeight: 44,
      marginHorizontal: 4,
    },
    actionButtonText: {
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: 0.2,
      color: "#fff",
      textAlign: "center",
    },
    secondaryButtonText: {
      color: colors.text,
    },
    error: {
      color: colors.error,
      marginBottom: 8,
      textAlign: "center",
      fontWeight: "600",
      fontSize: 15,
    },
  });
}

export default ManualDeviceIPEntry;
