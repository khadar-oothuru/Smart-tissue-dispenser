import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import OTPModal from "../../components/common/otpModal";
import { CustomAlert } from "../../components/common/CustomAlert";
import { useThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  changePasswordWithOTP,
  sendPasswordChangeOTP,
  verifyPasswordChangeOTP,
} from "../../utils/api";
import AdminService from "../../services/AdminService";

export default function ChangePassword() {
  const router = useRouter();
  const { themeColors, isDark } = useThemeContext();
  const auth = useAuth();
  const { user } = auth;
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.is_staff;

  // Initialize AdminService with auth context for admin users
  useEffect(() => {
    if (isAdmin) {
      AdminService.setAuthContext(auth);
    }
  }, [isAdmin, auth]);
  // CustomAlert States
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    primaryAction: null,
    secondaryAction: null,
  });

  useEffect(() => {
    let interval;
    if (timer > 0 && showOtpModal) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, showOtpModal]);
  // CustomAlert Functions
  const showCustomAlert = (title, message, type = "error", action = null) => {
    setCustomAlert({
      visible: true,
      type,
      title,
      message,
      primaryAction: action
        ? {
            text: "OK",
            onPress: () => {
              setCustomAlert((prev) => ({ ...prev, visible: false }));
              action();
            },
          }
        : {
            text: "OK",
            onPress: () =>
              setCustomAlert((prev) => ({ ...prev, visible: false })),
          },
      secondaryAction: null,
    });
  };

  const validatePasswords = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showCustomAlert("Error", "Please fill all fields");
      return false;
    }
    if (newPassword.length < 8) {
      showCustomAlert("Error", "New password must be at least 8 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      showCustomAlert("Error", "New passwords do not match");
      return false;
    }
    if (oldPassword === newPassword) {
      showCustomAlert(
        "Error",
        "New password must be different from old password"
      );
      return false;
    }
    return true;
  };
  const handleSendOTP = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      if (isAdmin) {
        await AdminService.sendPasswordChangeOTP();
      } else {
        const token = await AsyncStorage.getItem("accessToken");
        await sendPasswordChangeOTP(token);
      }
      setShowOtpModal(true);
      setTimer(600); // 10 minutes
    } catch (error) {
      showCustomAlert("Error", error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };
  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      if (isAdmin) {
        await AdminService.sendPasswordChangeOTP();
      } else {
        const token = await AsyncStorage.getItem("accessToken");
        await sendPasswordChangeOTP(token);
      }
      showCustomAlert("Success", "New OTP sent to your email", "success");
      setTimer(600);
    } catch (error) {
      showCustomAlert("Error", error.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };
  const handleVerifyOtp = async (enteredOtp) => {
    setOtpLoading(true);
    try {
      if (isAdmin) {
        // Step 1: Verify OTP using the verification endpoint
        await AdminService.verifyPasswordChangeOTP(enteredOtp);

        // Step 2: Once OTP is verified, change the password
        await AdminService.changePasswordWithOTP(
          oldPassword,
          newPassword,
          enteredOtp
        );
      } else {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) throw new Error("User not authenticated");

        // Step 1: Verify OTP using the verification endpoint
        await verifyPasswordChangeOTP(token, enteredOtp);

        // Step 2: Once OTP is verified, change the password
        await changePasswordWithOTP(
          token,
          oldPassword,
          newPassword,
          enteredOtp
        );
      }

      showCustomAlert(
        "Success",
        "Password changed successfully",
        "success",
        () => {
          setShowOtpModal(false);
          router.back();
        }
      );
    } catch (error) {
      showCustomAlert(
        "Error",
        error.message || "Failed to verify OTP or change password"
      );
    } finally {
      setOtpLoading(false);
    }
  };
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Header with gradient background like Notifications page */}
      <LinearGradient
        colors={
          isDark
            ? [themeColors.surface, themeColors.background]
            : ["#ffffff", themeColors.background]
        }
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark
                  ? `${themeColors.primary}25`
                  : `${themeColors.primary}12`,
                borderWidth: 0,
                shadowOpacity: isDark ? 0.06 : 0,
                elevation: isDark ? 2 : 0,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
              Change Password
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Add separator line */}
        <View
          style={[
            styles.separator,
            { backgroundColor: isDark ? themeColors.border : "#E0E0E0" },
          ]}
        />

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Current Password
            </Text>
            <View
              style={[
                styles.passwordInput,
                {
                  backgroundColor: isDark
                    ? themeColors.surface
                    : themeColors.inputbg,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: themeColors.heading }]}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                placeholderTextColor={
                  isDark
                    ? themeColors.text + "70"
                    : themeColors.placeholder || "#999"
                }
                secureTextEntry={!showOldPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowOldPassword(!showOldPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showOldPassword ? "eye-off" : "eye"}
                  size={24}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              New Password
            </Text>
            <View
              style={[
                styles.passwordInput,
                {
                  backgroundColor: isDark
                    ? themeColors.surface
                    : themeColors.inputbg,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: themeColors.heading }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={
                  isDark
                    ? themeColors.text + "70"
                    : themeColors.placeholder || "#999"
                }
                secureTextEntry={!showNewPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={24}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Confirm New Password
            </Text>
            <View
              style={[
                styles.passwordInput,
                {
                  backgroundColor: isDark
                    ? themeColors.surface
                    : themeColors.inputbg,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: themeColors.heading }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={
                  isDark
                    ? themeColors.text + "70"
                    : themeColors.placeholder || "#999"
                }
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={24}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={[
              styles.requirements,
              { backgroundColor: isDark ? themeColors.surface : "#f5f5f5" },
            ]}
          >
            <Text
              style={[styles.requirementTitle, { color: themeColors.text }]}
            >
              Password requirements:
            </Text>
            <Text
              style={[
                styles.requirement,
                { color: themeColors.text },
                newPassword.length >= 8 && styles.met,
              ]}
            >
              • At least 8 characters
            </Text>
            <Text
              style={[
                styles.requirement,
                { color: themeColors.text },
                newPassword !== oldPassword &&
                  newPassword.length > 0 &&
                  styles.met,
              ]}
            >
              • Different from current password
            </Text>
            <Text
              style={[
                styles.requirement,
                { color: themeColors.text },
                newPassword === confirmPassword &&
                  newPassword.length > 0 &&
                  styles.met,
              ]}
            >
              • Passwords match
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: themeColors.primary },
              loading && styles.disabledButton,
            ]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {/* OTP Modal */}
      <OTPModal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOTP}
        loading={otpLoading}
        timer={timer}
        title="Verify Password Change"
        subtitle="Enter the OTP sent to your email to change your password"
      />
      {/* CustomAlert */}
      <CustomAlert
        visible={customAlert.visible}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
        primaryAction={customAlert.primaryAction}
        secondaryAction={customAlert.secondaryAction}
        themeColors={themeColors}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  separator: {
    height: 1,
    width: "100%",
  },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  inputContainer: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  passwordInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    minHeight: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  eyeIcon: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  requirements: {
    marginBottom: 40,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  requirementTitle: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  requirement: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
    lineHeight: 20,
  },
  met: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
