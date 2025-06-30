import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LoadingScreen from "../../../components/common/LoadingScreen";
import { useAuth } from "../../../context/AuthContext";
import { useThemeContext } from "../../../context/ThemeContext";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
} from "../../../utils/api";
import { CustomAlert } from "../../../components/common/CustomAlert";

const { width } = Dimensions.get("window");

export default function EditProfile() {
  const router = useRouter();
  const { themeColors, isDark } = useThemeContext();
  const { updateUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Custom Alert states for CustomAlert component
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCustomSuccessModal, setShowCustomSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [userData, setUserData] = useState({
    username: "",
    email: "",
    profile_picture: "",
  });
  const [editedData, setEditedData] = useState({
    username: "",
  });
  // Animation values
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  // Custom alert function for CustomAlert component
  const showCustomAlert = (title, message, type = "error") => {
    setAlertTitle(title);
    setAlertMessage(message);

    if (type === "success") {
      setShowCustomSuccessModal(true);
    } else if (type === "warning") {
      setShowWarningModal(true);
    } else {
      setShowErrorModal(true);
    }
  };
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setAlertTitle("");
    setAlertMessage("");
  };

  const closeCustomSuccessModal = () => {
    setShowCustomSuccessModal(false);
    setAlertTitle("");
    setAlertMessage("");
  };

  const closeWarningModal = () => {
    setShowWarningModal(false);
    setAlertTitle("");
    setAlertMessage("");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("accessToken");
        const response = await getProfile(token);
        setUserData(response);
        setEditedData({
          username: response.username || "",
        });
      } catch (error) {
        showCustomAlert(
          "Error",
          error.message || "Failed to load profile data",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Pulse animation for uploading state
  useEffect(() => {
    if (uploading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [uploading, pulseAnim]);

  const pickImage = () => {
    setShowImagePickerModal(true);
  };
  const openCamera = async () => {
    setShowImagePickerModal(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showCustomAlert(
        "Camera Permission Required",
        "Please allow camera access to take profile photos. You can enable this in your device settings.",
        "warning"
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        presentationStyle:
          ImagePicker.UIImagePickerPresentationStyle.CURRENT_CONTEXT,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setShowImagePreview(true);
      }
    } catch (_error) {
      showCustomAlert(
        "Camera Error",
        "Failed to open camera. Please try again or select from gallery.",
        "error"
      );
    }
  };
  const openGallery = async () => {
    setShowImagePickerModal(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showCustomAlert(
        "Gallery Permission Required",
        "Please allow photo library access to select profile photos. You can enable this in your device settings.",
        "warning"
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        presentationStyle:
          ImagePicker.UIImagePickerPresentationStyle.CURRENT_CONTEXT,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        setShowImagePreview(true);
      }
    } catch (_error) {
      showCustomAlert(
        "Gallery Error",
        "Failed to open photo gallery. Please try again or use the camera.",
        "error"
      );
    }
  };

  const confirmImageUpload = async () => {
    setShowImagePreview(false);
    if (selectedImage) {
      uploadImage(selectedImage);
    }
  };

  const cancelImageUpload = () => {
    setSelectedImage(null);
    setShowImagePreview(false);
  };

  const uploadImage = async (image) => {
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await uploadProfilePicture(token, image);

      setUserData({ ...userData, profile_picture: response.profile_picture });

      if (response.tokens) {
        await AsyncStorage.setItem("accessToken", response.tokens.access);
        await AsyncStorage.setItem("refreshToken", response.tokens.refresh);
        updateUserData({
          ...userData,
          profile_picture: response.profile_picture,
        });
      }
      showCustomAlert(
        "Success",
        "Profile picture updated successfully",
        "success"
      );
    } catch (error) {
      showCustomAlert("Error", error.message || "Failed to upload image");
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  const handleUpdate = async () => {
    if (!editedData.username.trim()) {
      showCustomAlert("Error", "Username cannot be empty");
      return;
    }

    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await updateProfile(token, editedData);

      if (response.tokens) {
        await AsyncStorage.setItem("accessToken", response.tokens.access);
        await AsyncStorage.setItem("refreshToken", response.tokens.refresh);
      }

      const updatedUserData = response.user || { ...userData, ...editedData };
      updateUserData(updatedUserData);
      setShowSuccessModal(true);
    } catch (error) {
      showCustomAlert("Error", error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = () => {
    router.push("/(Auth)/ChangePassword");
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  // Simple Loading Spinner
  const SimpleSpinner = ({ size = 40, color = themeColors.primary }) => (
    <ActivityIndicator size={size} color={color} />
  );

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <LoadingScreen
          message="Loading profile"
          submessage="Getting your information..."
          iconName="notifications"
          variant="fullscreen"
          customIcon={
            <Ionicons
              name="person-outline"
              size={50}
              color={themeColors.primary}
            />
          }
        />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        {/* Simple Header without back arrow and border */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
            Edit Profile
          </Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploading}
              activeOpacity={0.7}
              style={styles.imageContainer}
            >
              <Animated.View
                style={[
                  styles.imageWrapper,
                  uploading && { transform: [{ scale: pulseAnim }] },
                ]}
              >
                {uploading ? (
                  <View
                    style={[styles.profileImage, styles.uploadingContainer]}
                  >
                    <SimpleSpinner size="large" color="#fff" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                ) : userData.profile_picture ? (
                  <Image
                    source={{ uri: userData.profile_picture }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.placeholderImage,
                      { backgroundColor: themeColors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={50}
                      color={themeColors.primary}
                    />
                  </View>
                )}
                <View
                  style={[
                    styles.cameraIcon,
                    { backgroundColor: themeColors.primary },
                  ]}
                >
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </Animated.View>
            </TouchableOpacity>

            <Text style={[styles.profileName, { color: themeColors.heading }]}>
              {editedData.username || userData.username || "User"}
            </Text>
            <Text style={[styles.profileEmail, { color: themeColors.text }]}>
              {userData.email}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                Username
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? themeColors.surface : "#F8F9FA",
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={themeColors.primary}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: themeColors.text, // Use theme text color instead of forcing black
                      backgroundColor: "transparent", // Let container handle background
                      fontSize: 16,
                      fontWeight: "600",
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    },
                  ]}
                  value={editedData.username}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, username: text })
                  }
                  placeholder="Enter username"
                  placeholderTextColor={themeColors.text + "60"} // Use theme-based placeholder
                  selectionColor={themeColors.primary}
                  autoCorrect={false}
                  autoCapitalize="none"
                  editable={true}
                  multiline={false}
                />
              </View>
            </View>

            {/* Email Input (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  styles.readOnlyContainer,
                  {
                    backgroundColor: isDark
                      ? themeColors.surface + "50"
                      : "#F0F0F0",
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={themeColors.text}
                />
                <Text
                  style={[styles.readOnlyText, { color: themeColors.text }]}
                >
                  {userData.email}
                </Text>
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={themeColors.text}
                />
              </View>
            </View>

            {/* Change Password Button */}
            <TouchableOpacity
              style={[
                styles.changePasswordButton,
                {
                  backgroundColor: isDark ? themeColors.surface : "#F8F9FA",
                  borderColor: themeColors.border,
                },
              ]}
              onPress={handleChangePassword}
              activeOpacity={0.7}
            >
              <View style={styles.changePasswordContent}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={themeColors.primary}
                />
                <Text
                  style={[
                    styles.changePasswordText,
                    { color: themeColors.heading },
                  ]}
                >
                  Change Password
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Update Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.updateButton,
                { backgroundColor: themeColors.primary },
                updating && styles.disabledButton,
              ]}
              onPress={handleUpdate}
              disabled={updating}
              activeOpacity={0.8}
            >
              {updating ? (
                <View style={styles.updatingContainer}>
                  <SimpleSpinner size={18} color="#fff" />
                  <Text style={styles.updateButtonText}>Updating...</Text>
                </View>
              ) : (
                <Text style={styles.updateButtonText}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        {/* Image Picker Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showImagePickerModal}
          onRequestClose={() => setShowImagePickerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.pickerModal,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark ? themeColors.border : "transparent",
                  borderWidth: 1,
                },
              ]}
            >
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
                <View
                  style={[
                    styles.iconGradient,
                    { backgroundColor: themeColors.primary },
                  ]}
                >
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </View>
              <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
                Select Photo
              </Text>
              <Text style={[styles.modalSubtitle, { color: themeColors.text }]}>
                After selecting, you&apos;ll crop your photo to fit perfectly
              </Text>
              <View style={styles.pickerOptions}>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
                    },
                  ]}
                  onPress={openCamera}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: themeColors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="camera"
                      size={20}
                      color={themeColors.primary}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        { color: themeColors.heading },
                      ]}
                    >
                      Camera
                    </Text>
                    <Text
                      style={[
                        styles.optionSubtext,
                        { color: themeColors.text },
                      ]}
                    >
                      Take a photo, then crop to fit
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={themeColors.text}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
                    },
                  ]}
                  onPress={openGallery}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: themeColors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="images"
                      size={20}
                      color={themeColors.primary}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        { color: themeColors.heading },
                      ]}
                    >
                      Gallery
                    </Text>
                    <Text
                      style={[
                        styles.optionSubtext,
                        { color: themeColors.text },
                      ]}
                    >
                      Select a photo, then crop to fit
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelModalButton,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: isDark ? themeColors.surface : "#F8F9FA",
                    },
                  ]}
                  onPress={() => setShowImagePickerModal(false)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      styles.cancelButtonText,
                      { color: themeColors.text },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Image Preview Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showImagePreview}
          onRequestClose={cancelImageUpload}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.imagePreviewModal,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark ? themeColors.border : "transparent",
                  borderWidth: 1,
                },
              ]}
            >
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
                <View
                  style={[
                    styles.iconGradient,
                    { backgroundColor: themeColors.primary },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                </View>
              </View>
              <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
                Perfect! Your Photo is Ready
              </Text>
              <Text
                style={[
                  styles.modalSubtitle,
                  {
                    color: themeColors.text,
                    textAlign: "center",
                    marginHorizontal: 20,
                  },
                ]}
              >
                You&apos;ve successfully cropped your photo. This is how it will
                appear as your profile picture.
              </Text>
              {selectedImage && (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.previewImage}
                  />
                  <View
                    style={[
                      styles.tipContainer,
                      {
                        backgroundColor: themeColors.primary + "15",
                        borderColor: themeColors.primary + "30",
                      },
                    ]}
                  >
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={themeColors.primary}
                    />
                    <Text
                      style={[styles.tipText, { color: themeColors.primary }]}
                    >
                      Photo cropped and ready to use
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelModalButton,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: isDark ? themeColors.surface : "#F8F9FA",
                    },
                  ]}
                  onPress={cancelImageUpload}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      styles.cancelButtonText,
                      { color: themeColors.text },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: themeColors.primary },
                  ]}
                  onPress={confirmImageUpload}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                    Set as Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Success Modal */}
        <CustomAlert
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Success!"
          message="Your profile has been updated successfully"
          type="success"
          primaryAction={{
            text: "Got it",
            onPress: () => {},
          }}
          secondaryAction={{
            text: "Go Home",
            onPress: handleSuccessModalClose,
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* Error Modal */}
        <CustomAlert
          visible={showErrorModal}
          onClose={closeErrorModal}
          title={alertTitle}
          message={alertMessage}
          type="error"
          primaryAction={{
            text: "OK",
            onPress: () => {},
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* Custom Success Modal */}
        <CustomAlert
          visible={showCustomSuccessModal}
          onClose={closeCustomSuccessModal}
          title={alertTitle}
          message={alertMessage}
          type="success"
          primaryAction={{
            text: "OK",
            onPress: () => {},
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
        {/* Warning Modal */}
        <CustomAlert
          visible={showWarningModal}
          onClose={closeWarningModal}
          title={alertTitle}
          message={alertMessage}
          type="warning"
          primaryAction={{
            text: "OK",
            onPress: () => {},
          }}
          themeColors={themeColors}
          isDark={isDark}
        />
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadingContainer: {
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 6,
    fontWeight: "500",
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "500", // Make text bolder
    letterSpacing: 0.3,
    minHeight: 20, // Ensure minimum height
    textAlign: "left", // Ensure text alignment
  },

  readOnlyContainer: {
    opacity: 0.7,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  changePasswordButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    height: 50,
  },
  changePasswordContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  changePasswordText: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 10,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  updateButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    height: 50,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  updatingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
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
  pickerModal: {
    width: width * 0.92,
    maxWidth: 420,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  imagePreviewModal: {
    width: width * 0.95,
    maxWidth: 480,
    padding: 28,
    paddingBottom: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 28,
    opacity: 0.8,
    lineHeight: 22,
  },
  pickerOptions: {
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  optionSubtext: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    gap: 6,
  },
  tipText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 18,
    width: "100%",
    paddingHorizontal: 8,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelModalButton: {
    borderWidth: 1.5,
    shadowOpacity: 0.08,
    elevation: 1,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
    textAlign: "center",
    lineHeight: 20,
  },
  cancelButtonText: {
    fontWeight: "600",
    opacity: 0.85,
  },
});
