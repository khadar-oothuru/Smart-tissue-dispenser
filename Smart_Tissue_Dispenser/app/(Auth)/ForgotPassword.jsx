import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import config from "../../config/config";
import { useThemeContext } from "../../context/ThemeContext";
import { CustomAlert } from "../../components/common/CustomAlert";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Custom Alert states
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    primaryAction: null,
    secondaryAction: null,
  });

  const { themeColors, isDark } = useThemeContext();
  const { background, text, primary, border } = themeColors;
  const navigation = useNavigation();
  // Custom alert function
  const showAlert = useCallback((config) => {
    setAlertConfig({
      visible: true,
      ...config,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig({
      visible: false,
      type: "error",
      title: "",
      message: "",
      primaryAction: null,
      secondaryAction: null,
    });
  }, []);
  const handleSubmit = async () => {
    if (!email) {
      showAlert({
        type: "warning",
        title: "Missing Email",
        message: "Please enter your email address.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert({
        type: "warning",
        title: "Invalid Email",
        message: "Please enter a valid email address.",
      });
      return;
    }
    try {
      const res = await axios.post(`${config.API_URL}/auth/forgot/`, { email });
      setMessage(res.data.message);
      console.log(config.API_URL);
    } catch (err) {
      console.error(err);

      let errorTitle = "Error";
      let errorMessage = "Something went wrong. Please try again.";

      if (err.response?.status === 404) {
        errorTitle = "Email Not Found";
        errorMessage =
          "No account found with this email address. Please check your email or sign up.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.code === "NETWORK_ERROR" || !err.response) {
        errorTitle = "Connection Error";
        errorMessage =
          "Unable to connect to server. Please check your internet connection and try again.";
      }

      showAlert({
        type: "error",
        title: errorTitle,
        message: errorMessage,
      });
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Back icon */}
      <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={primary} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: primary }]}>Forgot Password</Text>
      <TextInput
        style={[styles.input, { borderColor: border, color: text }]}
        placeholder="Enter your registered email"
        placeholderTextColor={text}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {/* Hide send button if message is shown */}
      {!message && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: email ? primary : "#999" }]}
          onPress={handleSubmit}
          disabled={!email}
        >
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>
      )}
      {message && (
        <>
          <Text style={[styles.success, { color: "green" }]}>{message}</Text>
          <TouchableOpacity
            onPress={handleGoBack}
            style={[styles.backAfterSuccess, { backgroundColor: primary }]}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </>
      )}
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryAction={alertConfig.primaryAction}
        secondaryAction={alertConfig.secondaryAction}
        onClose={hideAlert}
        themeColors={themeColors}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  backAfterSuccess: {
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  success: {
    marginTop: 20,
    textAlign: "center",
  },
});
