import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function OTPModal({
  visible,
  onClose,
  onVerify,
  onResend,
  loading,
  timer,
  title = "Enter OTP",
  subtitle = "We've sent a 6-digit code to your email",
}) {
  const { themeColors, isDark } = useThemeContext();
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setOtp(["", "", "", "", "", ""]);
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleValue]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (text, index) => {
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    } else if (text === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join("");
    if (otpString.length === 6) {
      onVerify(otpString);
    }
  };
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: themeColors.surface,
              borderColor: isDark ? themeColors.border : "transparent",
              borderWidth: 1,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* Header indicator */}
          <View style={styles.modalHeader}>
            <View
              style={[
                styles.modalIndicator,
                { backgroundColor: themeColors.border },
              ]}
            />
          </View>
          {/* Icon */}
          <View style={styles.iconContainer}>
            
            <LinearGradient
              colors={[themeColors.primary, themeColors.primary + "80"]}
              style={styles.iconGradient}
            >
              <Ionicons name="mail" size={24} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: themeColors.heading }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text }]}>
            {subtitle}
          </Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  {
                    borderColor: digit
                      ? themeColors.primary
                      : isDark
                      ? themeColors.border
                      : "#E0E0E0",
                    backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
                    color: themeColors.heading,
                    shadowColor: isDark ? "#000" : themeColors.primary,
                  },
                ]}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                editable={!loading}
                selectionColor={themeColors.primary}
              />
            ))}
          </View>
          {timer > 0 ? (
            <View
              style={[
                styles.timerContainer,
                { backgroundColor: isDark ? themeColors.surface : "#F5F5F5" },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={themeColors.text}
              />
              <Text style={[styles.timerText, { color: themeColors.text }]}>
                OTP expires in {formatTime(timer)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.resendContainer,
                {
                  backgroundColor: isDark
                    ? `${themeColors.primary}20`
                    : `${themeColors.primary}10`,
                },
              ]}
              onPress={onResend}
              disabled={loading}
            >
              <Ionicons name="refresh" size={16} color={themeColors.primary} />
              <Text style={[styles.resendText, { color: themeColors.primary }]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: themeColors.border }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text
                style={[styles.cancelButtonText, { color: themeColors.text }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: themeColors.primary },
                (loading || otp.join("").length !== 6) && styles.disabledButton,
              ]}
              onPress={handleVerify}
              disabled={loading || otp.join("").length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modal: {
    width: width * 0.92,
    maxWidth: 420,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
    paddingHorizontal: 10,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    width: "100%",
    gap: 10,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderWidth: 2,
    borderRadius: 14,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  resendText: {
    fontSize: 15,
    fontWeight: "700",
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 48,
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
    fontSize: 16,
    letterSpacing: 0.3,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    backgroundColor: "transparent",
    minHeight: 48,
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
