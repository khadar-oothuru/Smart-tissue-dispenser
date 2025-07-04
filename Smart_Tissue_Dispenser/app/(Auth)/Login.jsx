import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Redirect, useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import config from "../../config/config";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { CustomAlert } from "../../components/common/CustomAlert";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";
import { makeRedirectUri } from "expo-auth-session";

// Initialize WebBrowser for authentication
WebBrowser.maybeCompleteAuthSession();

const API_URL = config.API_URL;

// Move CustomInputWithIcon outside the main component to prevent re-creation
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

export default function Login() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { themeColors, isDark } = useThemeContext();
  const { background, text, primary, border } = themeColors;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailFocused, setEmailFocused] = useState(false);
  const [isPasswordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Custom Alert states
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    primaryAction: null,
    secondaryAction: null,
  });

  // Google Sign-In configuration
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "70657860851-4gh622q01j5uirrc2erd9mha36vnaija.apps.googleusercontent.com",
    androidClientId:
      "70657860851-29k72btt9hv9usvnqt9kbnfp8sm5vnmh.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      useProxy: true,
    }),
  });
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
  const handleGoogleToken = useCallback(
    async (idToken) => {
      setIsLoading(true);
      try {
        const response = await axios.post(`${API_URL}/auth/google-login/`, {
          id_token: idToken,
        });

        const { access, refresh, user } = response.data;

        await AsyncStorage.multiSet([
          ["accessToken", access],
          ["refreshToken", refresh],
          ["user", JSON.stringify(user)],
        ]);

        login(access, refresh, user);
        router.replace(user.role === "admin" ? "admindash" : "Home");
      } catch (err) {
        console.error("Google token validation error:", err);
        showAlert({
          type: "error",
          title: "Authentication Failed",
          message: "Failed to authenticate with Google. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [login, router, showAlert]
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    }
  }, [response, handleGoogleToken]);

  if (user) {
    return (
      <Redirect href={user.role === "admin" ? "/(Admintab)" : "/(drawer)"} />
    );
  }
  const handleLogin = async () => {
    if (!email || !password) {
      showAlert({
        type: "warning",
        title: "Missing Fields",
        message: "Please enter both email and password.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login/`, {
        email,
        password,
      });

      const { access, refresh } = response.data;

      const userResponse = await axios.get(`${API_URL}/auth/user/`, {
        headers: { Authorization: `Bearer ${access}` },
      });

      const user = userResponse.data;
      console.log("Login Debug - User data received:", user);
      console.log("Login Debug - User role:", user.role);

      await AsyncStorage.multiSet([
        ["accessToken", access],
        ["refreshToken", refresh],
        ["user", JSON.stringify(user)],
      ]);

      login(
        access,
        refresh,
        user,
        user.role === "admin" ? "admindash" : "Home"
      );
    } catch (err) {
      console.error(err);

      let errorTitle = "Login Failed";
      let errorMessage = "Something went wrong. Please try again.";

      if (err.response?.status === 401) {
        errorTitle = "Invalid Credentials";
        errorMessage =
          "The email or password you entered is incorrect. Please try again.";
      } else if (err.response?.status === 404) {
        errorTitle = "Account Not Found";
        errorMessage =
          "No account found with this email address. Please check your email or sign up.";
      } else if (err.response?.status === 403) {
        errorTitle = "Account Disabled";
        errorMessage =
          "Your account has been disabled. Please contact support.";
      } else if (err.response?.data?.message || err.response?.data?.error) {
        errorMessage = err.response.data.message || err.response.data.error;
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
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google Sign In Error:", error);
      showAlert({
        type: "error",
        title: "Google Sign In Failed",
        message: "Google sign in failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Text style={[styles.title, { color: primary }]}>Sign In</Text>
      <Text style={[styles.subtitle, { color: text }]}>
        Welcome back! Login to your account
      </Text>
      <View style={styles.socialContainer}>
        <GoogleSignInButton onPress={handleGoogleSignIn} />
      </View>
      <View style={styles.hrContainer}>
        <View style={[styles.hr, { borderColor: border }]} />
        <Text style={[styles.orText, { color: text }]}>Or</Text>
        <View style={[styles.hr, { borderColor: border }]} />
      </View>
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
      <TouchableOpacity onPress={() => router.push("ForgotPassword")}>
        <Text style={[styles.forgotText, { color: text }]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.loginButton,
          {
            backgroundColor: primary,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Log In</Text>
        )}
      </TouchableOpacity>
      <Text style={[styles.signupText, { color: text }]}>
        Don&apos;t have an account?{"  "}
        <Text
          style={[styles.signupLink, { color: primary }]}
          onPress={() => router.push("SignUp")}
        >
          Sign Up
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
              {" "}
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
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  hrContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  hr: {
    borderTopWidth: 1,
    flex: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontWeight: "500",
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
  forgotText: {
    textAlign: "right",
    marginBottom: 20,
  },
  loginButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signupText: {
    textAlign: "center",
  },
  signupLink: {
    fontWeight: "600",
  },
});
