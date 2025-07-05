import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
import { CustomAlert } from "../../components/common/CustomAlert";
import config from "../../config/config";

const API_URL = config.API_URL;

// Custom Input Component with Icon
const CustomInputWithIcon = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  showPassword,
  onTogglePassword,
  keyboardType,
  isFocused,
  onFocus,
  onBlur,
  themeColors,
  autoCapitalize,
}) => {
  const { text, primary, border, inputbg } = themeColors;

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: inputbg,
          borderColor: isFocused ? primary : border || text + "30",
          borderWidth: 1.5,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isFocused ? primary : text}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.textInput, { color: text }]}
        placeholder={placeholder}
        placeholderTextColor={text + "60"}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCorrect={false}
        autoCapitalize={autoCapitalize || (secureTextEntry ? "none" : "words")}
      />
      {secureTextEntry && (
        <TouchableOpacity
          onPress={onTogglePassword}
          style={styles.eyeIcon}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? "eye" : "eye-off"}
            size={20}
            color={isFocused ? primary : text}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function SignUp() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isUsernameFocused, setUsernameFocused] = useState(false);
  const [isEmailFocused, setEmailFocused] = useState(false);
  const [isPasswordFocused, setPasswordFocused] = useState(false);

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
  const { background, text, primary } = themeColors;
  // Custom alert functions
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

  const handleSuccessClose = useCallback(() => {
    hideAlert();
    router.push("Login");
  }, [hideAlert, router]);
  const handleRegister = async () => {
    if (!username || !email || !password) {
      showAlert({
        type: "warning",
        title: "Missing Fields",
        message: "Please fill all the fields.",
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

    // Basic password validation
    if (password.length < 6) {
      showAlert({
        type: "warning",
        title: "Weak Password",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    const userData = { username, email, password, role: "user" };
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        showAlert({
          type: "success",
          title: "Success",
          message: "Account created successfully! You can now log in.",
          primaryAction: {
            text: "Continue",
            onPress: handleSuccessClose,
          },
        });
      } else {
        const errorData = await response.json();
        let errorMessage = "Something went wrong!";

        if (errorData.email) {
          errorMessage =
            errorData.email[0] || "This email is already registered.";
        } else if (errorData.username) {
          errorMessage =
            errorData.username[0] || "This username is already taken.";
        } else if (errorData.password) {
          errorMessage =
            errorData.password[0] || "Password doesn't meet requirements.";
        } else {
          const firstError = Object.values(errorData)[0];
          errorMessage = firstError[0] || "Registration failed.";
        }

        showAlert({
          type: "error",
          title: "Registration Failed",
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      showAlert({
        type: "error",
        title: "Connection Error",
        message:
          "Unable to connect to server. Please check your internet connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Text style={[styles.signUpTitle, { color: primary }]}>Sign Up</Text>
      <Text style={[styles.subtitle, { color: text }]}>
        Create your new account
      </Text>
      <CustomInputWithIcon
        icon="person"
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        isFocused={isUsernameFocused}
        onFocus={() => setUsernameFocused(true)}
        onBlur={() => setUsernameFocused(false)}
        themeColors={themeColors}
      />
      <CustomInputWithIcon
        icon="mail"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        isFocused={isEmailFocused}
        onFocus={() => setEmailFocused(true)}
        onBlur={() => setEmailFocused(false)}
        themeColors={themeColors}
      />
      <CustomInputWithIcon
        icon="lock-closed"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
        isFocused={isPasswordFocused}
        onFocus={() => setPasswordFocused(true)}
        onBlur={() => setPasswordFocused(false)}
        themeColors={themeColors}
      />
      <TouchableOpacity
        style={[
          styles.registerButton,
          {
            backgroundColor: primary,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.registerButtonText}>Register</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 10 }} />
      <Text style={[styles.loginText, { color: text }]}>
        Already have an account?{"  "}
        <Text
          style={[styles.loginLink, { color: primary }]}
          onPress={() => router.replace("Login")}
        >
          Login
        </Text>
      </Text>
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <View
          style={{
            backgroundColor:
              themeColors.surface || (isDark ? "#22223b" : "#e0e7ff"),
            borderRadius: 18,
            paddingVertical: 8,
            paddingHorizontal: 22,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Ionicons
            name="ribbon"
            size={18}
            color={primary}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: primary,
              fontWeight: "bold",
              fontSize: 15,
              letterSpacing: 0.5,
            }}
          >
            Brought by
            <Text
              style={{ color: isDark ? "#fff" : "#22223b", fontWeight: "bold" }}
            >
              
              Jivass Technologies
            </Text>
          </Text>
        </View>
      </View>
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
    padding: 24,
    justifyContent: "center",
  },
  signUpTitle: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    height: 60,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  eyeIcon: {
    padding: 5,
  },
  registerButton: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  registerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginText: {
    textAlign: "center",
  },
  loginLink: {
    fontWeight: "600",
  },
});
