import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Modal,
  FlatList,
  Vibration,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../context/ThemeContext";
import { CustomAlert } from "../components/common/CustomAlert";
import { submitContactForm } from "../utils/api";

export default function ContactSupport() {
  const router = useRouter();
  const { themeColors, isDark } = useThemeContext();

  // Add fallback for theme colors
  const safeThemeColors = themeColors || {
    background: "#ffffff",
    surface: "#f5f5f5",
    primary: "#3AB0FF",
    heading: "#161e32",
    text: "#7b8493",
    inputbg: "rgb(234, 244, 246)",
    danger: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
    border: "#e0e0e0",
  };

  const styles = createStyles(safeThemeColors, isDark);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [spinValue] = useState(new Animated.Value(0));
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Spinning animation for loading icon
  React.useEffect(() => {
    if (isLoading) {
      const spin = () => {
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          spinValue.setValue(0);
          if (isLoading) {
            spin();
          }
        });
      };
      spin();
    }
  }, [isLoading, spinValue]);

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const updateFormData = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const showAlertMessage = useCallback(
    (type, title, message, onConfirm = null) => {
      setAlertConfig({
        type,
        title,
        message,
        onConfirm,
      });
      setShowAlert(true);
    },
    []
  );
  const validateForm = useCallback(() => {
    const { name, email, subject, message } = formData;

    if (!name.trim()) {
      Vibration.vibrate(100);
      showAlertMessage("error", "Validation Error", "Please enter your name.");
      return false;
    }

    if (name.trim().length < 2) {
      Vibration.vibrate(100);
      showAlertMessage(
        "error",
        "Validation Error",
        "Name must be at least 2 characters long."
      );
      return false;
    }

    if (!email.trim()) {
      Vibration.vibrate(100);
      showAlertMessage(
        "error",
        "Validation Error",
        "Please enter your email address."
      );
      return false;
    }

    // Improved email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Vibration.vibrate(100);
      showAlertMessage(
        "error",
        "Validation Error",
        "Please enter a valid email address."
      );
      return false;
    }

    if (!subject) {
      Vibration.vibrate(100);
      showAlertMessage("error", "Validation Error", "Please select a subject.");
      return false;
    }

    if (!message.trim()) {
      Vibration.vibrate(100);
      showAlertMessage(
        "error",
        "Validation Error",
        "Please enter your message."
      );
      return false;
    }

    if (message.trim().length < 10) {
      Vibration.vibrate(100);
      showAlertMessage(
        "error",
        "Validation Error",
        "Message must be at least 10 characters long."
      );
      return false;
    }

    return true;
  }, [formData, showAlertMessage]);
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // Debug logging
      console.log("Submitting contact form via API...");
      console.log("Form data:", {
        ...formData,
        message: formData.message.substring(0, 50) + "...",
      });

      // Use the API function instead of direct fetch
      const result = await submitContactForm(formData);
      if (result.success || result.status === "success") {
        Vibration.vibrate([100, 50, 100]); // Success vibration pattern
        showAlertMessage(
          "success",
          "Message Sent Successfully!",
          "Thank you for contacting us. We'll get back to you within 24-48 hours.",
          () => {
            setFormData({
              name: "",
              email: "",
              phone: "",
              subject: "",
              message: "",
            });
          }
        );
      } else {
        Vibration.vibrate(200); // Error vibration
        showAlertMessage(
          "error",
          "Send Failed",
          result.error ||
            result.message ||
            "Failed to send your message. Please try again later."
        );
      }
    } catch (error) {
      console.error("Contact form error:", error);
      Vibration.vibrate(200); // Error vibration

      showAlertMessage(
        "error",
        "Unable to Send Message",
        error.message +
          "\n\n📧 Email: support@smartdispenser.com\n📞 Phone: +1 (555) 123-4567"
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, showAlertMessage]);

  const subjectOptions = [
    { label: "Select a subject", value: "" },
    { label: "Technical Support", value: "technical_support" },
    { label: "Device Issue", value: "device_issue" },
    { label: "Account Help", value: "account_help" },
    // { label: "Feature Request", value: "feature_request" },
    // { label: "Billing Question", value: "billing" },
    { label: "Other", value: "other" },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View
        style={[
          styles.container,
          { backgroundColor: safeThemeColors.background },
        ]}
      >
        {/* Modern Header with Gradient */}
        <LinearGradient
          colors={
            isDark
              ? [safeThemeColors.surface, safeThemeColors.background]
              : ["#ffffff", safeThemeColors.background]
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
                    ? `${safeThemeColors.primary}30`
                    : `${safeThemeColors.primary}15`,
                  borderColor: isDark
                    ? `${safeThemeColors.primary}50`
                    : "transparent",
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
            
              <Ionicons
                name="arrow-back"
                size={24}
                color={safeThemeColors.primary}
              />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              
              <Text
                style={[styles.headerTitle, { color: safeThemeColors.heading }]}
              >
                Contact Support
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() =>
                  showAlertMessage(
                    "info",
                    "Contact Info",
                    "📧 support@smartdispenser.com\n📞 +1 (555) 123-4567\n⏰ Mon-Fri 9AM-6PM EST"
                  )
                }
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: isDark
                      ? `${safeThemeColors.primary}20`
                      : `${safeThemeColors.primary}15`,
                    borderColor: isDark
                      ? safeThemeColors.primary
                      : "transparent",
                    borderWidth: isDark ? 1 : 0,
                  },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                
                <MaterialCommunityIcons
                  name="information"
                  size={20}
                  color={safeThemeColors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Separator Line */}
          <View
            style={[
              styles.headerSeparator,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          />
        </LinearGradient>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.contentContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Header Icon and Description */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[
                    safeThemeColors.primary,
                    `${safeThemeColors.primary}CC`,
                  ]}
                  style={styles.iconGradient}
                >
                  <MaterialCommunityIcons
                    name="headset"
                    size={40}
                    color="#ffffff"
                  />
                </LinearGradient>
              </View>
              <Text style={[styles.subtitle, { color: safeThemeColors.text }]}>
                We&apos;re here to help! Send us a message and we&apos;ll
                respond as soon as possible.
              </Text>
              {/* Contact Form */}
              <View style={styles.form}>
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: safeThemeColors.heading },
                    ]}
                  >
                    Full Name *
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "name" && styles.inputContainerFocused,
                      formData.name && styles.inputContainerFilled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account"
                      size={22}
                      color={
                        focusedField === "name" || formData.name
                          ? safeThemeColors.primary
                          : safeThemeColors.text
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: safeThemeColors.heading }]}
                      placeholder="Enter your full name"
                      placeholderTextColor={`${safeThemeColors.text}80`}
                      value={formData.name}
                      onChangeText={(text) => updateFormData("name", text)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: safeThemeColors.heading },
                    ]}
                  >
                    Email Address *
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "email" && styles.inputContainerFocused,
                      formData.email && styles.inputContainerFilled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="email"
                      size={22}
                      color={
                        focusedField === "email" || formData.email
                          ? safeThemeColors.primary
                          : safeThemeColors.text
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: safeThemeColors.heading }]}
                      placeholder="Enter your email address"
                      placeholderTextColor={`${safeThemeColors.text}80`}
                      value={formData.email}
                      onChangeText={(text) => updateFormData("email", text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Phone Input */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: safeThemeColors.heading },
                    ]}
                  >
                    Phone Number
                    <Text
                      style={[
                        styles.optionalLabel,
                        { color: safeThemeColors.text },
                      ]}
                    >
                      
                      (Optional)
                    </Text>
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "phone" && styles.inputContainerFocused,
                      formData.phone && styles.inputContainerFilled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="phone"
                      size={22}
                      color={
                        focusedField === "phone" || formData.phone
                          ? safeThemeColors.primary
                          : safeThemeColors.text
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: safeThemeColors.heading }]}
                      placeholder="Enter your phone number"
                      placeholderTextColor={`${safeThemeColors.text}80`}
                      value={formData.phone}
                      onChangeText={(text) => updateFormData("phone", text)}
                      keyboardType="phone-pad"
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Subject Picker */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: safeThemeColors.heading },
                    ]}
                  >
                    Subject *
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "subject" &&
                        styles.inputContainerFocused,
                      formData.subject && styles.inputContainerFilled,
                    ]}
                  >
                    
                    <MaterialCommunityIcons
                      name="tag"
                      size={22}
                      color={
                        focusedField === "subject" || formData.subject
                          ? safeThemeColors.primary
                          : safeThemeColors.text
                      }
                      style={styles.inputIcon}
                    />
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() => setShowSubjectPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          {
                            color: formData.subject
                              ? safeThemeColors.heading
                              : `${safeThemeColors.text}80`,
                          },
                        ]}
                      >
                        {subjectOptions.find(
                          (opt) => opt.value === formData.subject
                        )?.label || "Select a subject"}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={
                          formData.subject
                            ? safeThemeColors.primary
                            : safeThemeColors.text
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Message Input */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: safeThemeColors.heading },
                    ]}
                  >
                    Message *
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.messageContainer,
                      focusedField === "message" &&
                        styles.inputContainerFocused,
                      formData.message && styles.inputContainerFilled,
                    ]}
                  >
                    
                    <MaterialCommunityIcons
                      name="message-text"
                      size={22}
                      color={
                        focusedField === "message" || formData.message
                          ? safeThemeColors.primary
                          : safeThemeColors.text
                      }
                      style={[styles.inputIcon, styles.messageIcon]}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.messageInput,
                        { color: safeThemeColors.heading },
                      ]}
                      placeholder="Describe your issue or question in detail..."
                      placeholderTextColor={`${safeThemeColors.text}80`}
                      value={formData.message}
                      onChangeText={(text) => updateFormData("message", text)}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      onFocus={() => setFocusedField("message")}
                      onBlur={() => setFocusedField(null)}
                      returnKeyType="default"
                    />
                  </View>
                  <Text
                    style={[
                      styles.characterCount,
                      { color: safeThemeColors.text },
                    ]}
                  >
                    {formData.message.length} characters
                  </Text>
                </View>
                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      opacity: isLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  
                  <LinearGradient
                    colors={[
                      safeThemeColors.primary,
                      `${safeThemeColors.primary}CC`,
                    ]}
                    style={styles.submitButtonGradient}
                  >
                  
                    {isLoading ? (
                      <Animated.View
                        style={{ transform: [{ rotate: spinInterpolate }] }}
                      >
                        <MaterialCommunityIcons
                          name="loading"
                          size={20}
                          color="#ffffff"
                          style={styles.sendIcon}
                        />
                      </Animated.View>
                    ) : (
                      <Ionicons
                        name="send"
                        size={20}
                        color="#ffffff"
                        style={styles.sendIcon}
                      />
                    )}
                    <Text style={styles.submitButtonText}>
                      {isLoading ? "Sending..." : "Send Message"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              {/* Quick Contact Options */}
              <View style={styles.quickContact}>
                
                <Text
                  style={[
                    styles.quickContactTitle,
                    { color: safeThemeColors.text },
                  ]}
                >
                  Or reach us directly:
                </Text>
                <View style={styles.contactOptionsContainer}>
                  
                  <TouchableOpacity
                    style={[
                      styles.contactOption,
                      {
                        backgroundColor: isDark
                          ? safeThemeColors.surface
                          : safeThemeColors.inputbg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail"
                      size={20}
                      color={safeThemeColors.primary}
                    />
                    <Text
                      style={[
                        styles.contactOptionText,
                        { color: safeThemeColors.heading },
                      ]}
                    >
                      support@smartdispenser.com
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.contactOption,
                      {
                        backgroundColor: isDark
                          ? safeThemeColors.surface
                          : safeThemeColors.inputbg,
                      },
                    ]}
                  >
                    <Ionicons
                      name="call"
                      size={20}
                      color={safeThemeColors.primary}
                    />
                    <Text
                      style={[
                        styles.contactOptionText,
                        { color: safeThemeColors.heading },
                      ]}
                    >
                      +1 (555) 123-4567
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        {/* Subject Picker Modal */}
        <Modal
          visible={showSubjectPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSubjectPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: safeThemeColors.surface },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: safeThemeColors.heading },
                  ]}
                >
                  Select Subject
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSubjectPicker(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={safeThemeColors.text}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={subjectOptions.slice(1)} // Remove "Select a subject" option
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      formData.subject === item.value && {
                        backgroundColor: `${safeThemeColors.primary}15`,
                      },
                    ]}
                    onPress={() => {
                      updateFormData("subject", item.value);
                      setShowSubjectPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        {
                          color:
                            formData.subject === item.value
                              ? safeThemeColors.primary
                              : safeThemeColors.heading,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {formData.subject === item.value && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={safeThemeColors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
        {/* Custom Alert */}
        <CustomAlert
          visible={showAlert}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setShowAlert(false)}
          primaryAction={{
            text: "OK",
            onPress: () => {
              if (alertConfig.onConfirm) {
                alertConfig.onConfirm();
              }
            },
          }}
          themeColors={safeThemeColors}
          isDark={isDark}
        />
      </View>
    </>
  );
}

const createStyles = (themeColors, isDark) => {
  // Ensure themeColors is defined with fallbacks
  const colors = themeColors || {
    background: "#ffffff",
    surface: "#f5f5f5",
    primary: "#3AB0FF",
    heading: "#161e32",
    text: "#7b8493",
    inputbg: "rgb(234, 244, 246)",
    border: "#e0e0e0",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    headerGradient: {
      paddingTop: Platform.OS === "ios" ? 50 : 30,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: "center",
      marginHorizontal: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    headerSeparator: {
      height: 1,
      marginHorizontal: 20,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    iconContainer: {
      alignSelf: "center",
      marginBottom: 20,
    },
    iconGradient: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    subtitle: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 30,
      paddingHorizontal: 10,
      lineHeight: 22,
    },
    form: {
      marginBottom: 30,
    },
    inputGroup: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      marginLeft: 2,
    },
    optionalLabel: {
      fontSize: 14,
      fontWeight: "400",
      opacity: 0.7,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? colors.surface : colors.inputbg,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: isDark ? colors.border : `${colors.primary}30`,
      minHeight: 56,
    },
    inputContainerFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: isDark ? colors.surface : `${colors.primary}08`,
    },
    inputContainerFilled: {
      borderColor: `${colors.primary}50`,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: colors.heading,
      paddingVertical: 0,
    },
    picker: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pickerText: {
      fontSize: 16,
      fontWeight: "500",
      flex: 1,
    },
    messageContainer: {
      alignItems: "flex-start",
      paddingVertical: 16,
      minHeight: 120,
    },
    messageIcon: {
      marginTop: 2,
    },
    messageInput: {
      minHeight: 80,
      textAlignVertical: "top",
      fontSize: 16,
      fontWeight: "500",
    },
    characterCount: {
      fontSize: 12,
      textAlign: "right",
      marginTop: 4,
      opacity: 0.6,
    },
    submitButton: {
      borderRadius: 20,
      marginTop: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    submitButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      borderRadius: 20,
    },
    submitButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "600",
      marginLeft: 8,
    },
    sendIcon: {
      marginRight: 4,
    },
    quickContact: {
      alignItems: "center",
      marginTop: 20,
    },
    quickContactTitle: {
      fontSize: 16,
      marginBottom: 20,
      fontWeight: "500",
    },
    contactOptionsContainer: {
      width: "100%",
    },
    contactOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    contactOptionText: {
      fontSize: 16,
      marginLeft: 12,
      fontWeight: "500",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 20,
      maxHeight: "70%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.heading,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.05)",
    },
    modalItemText: {
      fontSize: 16,
      fontWeight: "500",
      flex: 1,
    },
  });
};
