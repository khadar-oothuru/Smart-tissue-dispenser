import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Shield,
  Camera,
  Mail,
  User,
  Lock,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Upload,
  Images,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useThemeContext";
import { useAuth } from "../../hooks/useAuth";
import AdminService from "../../services/AdminService";
import {
  updateProfile,
  uploadProfilePicture,
  getProfile,
} from "../../services/api";

// Import custom alert components
import { CustomAlert, InfoAlert } from "../common/CustomAlert";

// Loading Screen Component
const LoadingScreen = ({ message, submessage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <Shield className="w-12 h-12 text-blue-600 mb-4 animate-pulse" />
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        {message}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{submessage}</p>
    </div>
  );
};

const AdminProfile = () => {
  const { themeColors, isDark } = useTheme();
  const auth = useAuth();
  const { updateUserData, user } = auth;
  const navigate = useNavigate();

  // Fetch profile from API and keep in state
  const [profile, setProfile] = useState(null);

  // Prefer user from auth context, fallback to fetched profile, then localStorage
  const localUser = (() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) return JSON.parse(userStr);
      return null;
    } catch {
      return null;
    }
  })();

  const displayUser = user || profile || localUser || {};

  const [loading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Alert states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showCustomSuccessModal, setShowCustomSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [editedData, setEditedData] = useState({
    username: "",
    email: "",
    role: "",
    id: "",
    profile_picture: "",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialized = useRef(false);
  const isUserEditing = useRef(false);

  // File input ref
  const fileInputRef = useRef(null);

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

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = auth?.accessToken || localStorage.getItem("accessToken");
        if (token) {
          const data = await getProfile(token);
          setProfile(data);
          setEditedData({
            username: data.username || "",
            email: data.email || "",
            role: data.role || "",
            id: data.id || "",
            profile_picture: data.profile_picture || "",
          });
          setHasUnsavedChanges(false);
          isInitialized.current = true;
        }
      } catch (e) {
        // fallback to localUser if API fails
        if (localUser) {
          setEditedData({
            username: localUser.username || "",
            email: localUser.email || "",
            role: localUser.role || "",
            id: localUser.id || "",
            profile_picture: localUser.profile_picture || "",
          });
        }
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [auth?.accessToken]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage({
            uri: e.target.result,
            file: file,
          });
          setShowImagePreview(true);
          setShowImagePickerModal(false);
        };
        reader.readAsDataURL(file);
      } else {
        showCustomAlert("Invalid File", "Please select an image file", "error");
      }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (image) => {
    setUploading(true);
    try {
      const token = auth?.accessToken || localStorage.getItem("accessToken");
      // Prepare FormData as expected by backend
      const formData = new FormData();
      formData.append("image", image.file);
      // Use uploadProfilePicture from api.js, pass FormData
      const response = await uploadProfilePicture(token, formData);

      if (response && !response.error && !response.image) {
        if (response.tokens) {
          localStorage.setItem("accessToken", response.tokens.access);
          localStorage.setItem("refreshToken", response.tokens.refresh);
          updateUserData(
            {
              ...displayUser,
              profile_picture: response.profile_picture,
            },
            response.tokens
          );
        } else {
          updateUserData({
            ...displayUser,
            profile_picture: response.profile_picture,
          });
        }

        showCustomAlert(
          "Success",
          "Profile picture updated successfully",
          "success"
        );
        // Refetch profile after upload
        const data = await getProfile(token);
        setProfile(data);
        setEditedData({
          username: data.username || "",
          email: data.email || "",
          role: data.role || "",
          id: data.id || "",
          profile_picture: data.profile_picture || "",
        });
      } else if (response && response.image) {
        // DRF serializer error for image field
        const errorMsg = Array.isArray(response.image)
          ? response.image.join(" ")
          : String(response.image);
        showCustomAlert("Image Upload Error", errorMsg, "error");
        console.error("Image upload error:", response);
      } else if (response && response.error) {
        showCustomAlert("Image Upload Error", response.error, "error");
        console.error("Image upload error:", response);
      } else {
        showCustomAlert(
          "Image Upload Error",
          "Unknown error occurred during upload.",
          "error"
        );
        console.error("Image upload unknown error:", response);
      }
    } catch (error) {
      showCustomAlert("Error", error.message || "Failed to upload image");
      console.error("Image upload exception:", error);
    } finally {
      setUploading(false);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpdate = async () => {
    if (!hasUnsavedChanges || updating) return;

    if (!editedData.username.trim()) {
      showCustomAlert("Error", "Username cannot be empty");
      return;
    }

    const currentUsername = displayUser?.username || "";
    const newUsername = editedData.username.trim();
    const hasUsernameChanged = newUsername !== currentUsername;

    if (!hasUsernameChanged) {
      showCustomAlert("No Changes", "No changes detected to save", "info");
      return;
    }

    // Only send username for update
    const changedData = { username: newUsername };

    setUpdating(true);
    try {
      const token = auth?.accessToken || localStorage.getItem("accessToken");
      const response = await updateProfile(token, changedData);

      if (response) {
        if (response.tokens) {
          localStorage.setItem("accessToken", response.tokens.access);
          localStorage.setItem("refreshToken", response.tokens.refresh);
          const updatedUserData = response.user || {
            ...displayUser,
            ...changedData,
          };
          updateUserData(updatedUserData, response.tokens);
        } else {
          const updatedUserData = response.user || {
            ...displayUser,
            ...changedData,
          };
          updateUserData(updatedUserData);
        }

        setShowSuccessModal(true);
        setHasUnsavedChanges(false);
        isUserEditing.current = false;
        // Refetch profile after update
        const data = await getProfile(token);
        setProfile(data);
        setEditedData({
          username: data.username || "",
          email: data.email || "",
          role: data.role || "",
          id: data.id || "",
          profile_picture: data.profile_picture || "",
        });
      }
    } catch (error) {
      showCustomAlert("Error", error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  // Navigate to the ChangePassword page when button is clicked
  const handleChangePassword = () => {
    navigate("/change-password");
  };

  useEffect(() => {
    AdminService.setAuthContext(auth);
  }, [auth]);

  if (loading) {
    return (
      <div className={`min-h-screen`} style={{ background: themeColors.bg }}>
        <LoadingScreen
          message="Loading admin profile"
          submessage="Getting your information..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: themeColors.bg }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unified Card Section */}
        <div
          className="rounded-2xl shadow-lg p-8 backdrop-blur-md"
          style={{
            background:
              themeColors.cardGlassBg ||
              "linear-gradient(135deg, rgba(24,28,31,0.65) 60%, rgba(35,39,43,0.55) 100%)",
            border: `1.5px solid ${
              themeColors.cardBorder || "rgba(255,255,255,0.18)"
            }`,
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
            WebkitBackdropFilter: "blur(18px)",
            backdropFilter: "blur(18px)",
            // Optional: add a subtle border radius and border for glass effect
            // borderRadius: '1.5rem',
          }}
        >
          {/* Profile Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profile Image */}
              <div className="relative">
                <button
                  onClick={() => setShowImagePickerModal(true)}
                  disabled={uploading}
                  className="relative group"
                >
                  <div
                    className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg ${
                      uploading ? "animate-pulse" : ""
                    }`}
                    style={{ border: `4px solid ${themeColors.cardBg}` }}
                  >
                    {uploading ? (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center"
                        style={{ background: themeColors.cardBg }}
                      >
                        <div
                          className="animate-spin rounded-full h-8 w-8 border-b-2"
                          style={{ borderColor: themeColors.cardBorder }}
                        ></div>
                        <span
                          className="text-xs mt-2"
                          style={{ color: themeColors.text }}
                        >
                          Uploading...
                        </span>
                      </div>
                    ) : editedData.profile_picture ||
                      displayUser.profile_picture ? (
                      <img
                        src={
                          editedData.profile_picture ||
                          displayUser.profile_picture
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: themeColors.primaryBg }}
                      >
                        <Shield
                          className="w-12 h-12"
                          style={{ color: themeColors.primary }}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-lg"
                    style={{
                      background: themeColors.primary,
                      borderColor: themeColors.cardBg,
                    }}
                  >
                    <Camera
                      className="w-3.5 h-3.5"
                      style={{ color: themeColors.onPrimary }}
                    />
                  </div>
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: themeColors.text }}
                >
                  {editedData.username || displayUser.username || "Admin User"}
                </h2>

                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium shadow-md mb-3"
                  style={{
                    background: themeColors.primary,
                    color: themeColors.onPrimary,
                  }}
                >
                  <Shield
                    className="w-3.5 h-3.5"
                    style={{ color: themeColors.onPrimary }}
                  />
                  <span>
                    {editedData.role || displayUser.role || "Administrator"}
                  </span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                  <Mail
                    className="w-4 h-4"
                    style={{ color: themeColors.textSecondary }}
                  />
                  <span style={{ color: themeColors.textSecondary }}>
                    {editedData.email ||
                      displayUser.email ||
                      "admin@example.com"}
                  </span>
                </div>

                {/* Show ID and Role if available */}
                <div className="flex flex-wrap gap-4 mt-2">
                  {(editedData.id || displayUser.id) && (
                    <div
                      className="text-xs"
                      style={{ color: themeColors.textSecondary }}
                    >
                      <span>ID: {editedData.id || displayUser.id}</span>
                    </div>
                  )}
                  {(editedData.role || displayUser.role) && (
                    <div
                      className="text-xs"
                      style={{ color: themeColors.textSecondary }}
                    >
                      <span>Role: {editedData.role || displayUser.role}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-5 mb-8">
            {/* Username Input */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: themeColors.text }}
              >
                Username
              </label>
              <div
                className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200"
                style={{
                  borderColor: hasUnsavedChanges
                    ? themeColors.primary
                    : themeColors.cardBorder,
                  background: themeColors.inputBg,
                }}
              >
                <User
                  className="w-5 h-5 mr-3"
                  style={{ color: themeColors.primary }}
                />
                <input
                  type="text"
                  value={editedData.username}
                  onChange={(e) => {
                    isUserEditing.current = true;
                    setEditedData({ ...editedData, username: e.target.value });
                    const currentUsername = displayUser?.username || "";
                    setHasUnsavedChanges(
                      e.target.value.trim() !== currentUsername
                    );
                  }}
                  placeholder="Enter username"
                  className="flex-1 bg-transparent outline-none text-base font-medium"
                  style={{
                    color: themeColors.text,
                    "::placeholder": { color: themeColors.textSecondary },
                  }}
                />
              </div>
            </div>

            {/* Email Input (Read-only) */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: themeColors.text }}
              >
                Email
              </label>
              <div
                className="flex items-center px-4 py-3 rounded-xl border transition-all duration-200 opacity-70"
                style={{
                  borderColor: themeColors.cardBorder,
                  background: themeColors.inputBg,
                }}
              >
                <Mail
                  className="w-5 h-5 mr-3"
                  style={{ color: themeColors.textSecondary }}
                />
                <span
                  className="flex-1 text-base"
                  style={{ color: themeColors.textSecondary }}
                >
                  {editedData.email || displayUser.email || "Not specified"}
                </span>
                <Lock
                  className="w-4 h-4"
                  style={{ color: themeColors.textSecondary }}
                />
              </div>
            </div>

            {/* Change Password Button */}
            <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200"
              style={{
                borderColor: themeColors.cardBorder,
                background: themeColors.inputBg,
              }}
            >
              <div className="flex items-center">
                <Lock
                  className="w-5 h-5 mr-3"
                  style={{ color: themeColors.primary }}
                />
                <span
                  className="text-base font-medium"
                  style={{ color: themeColors.text }}
                >
                  Change Password
                </span>
              </div>
              <ChevronRight
                className="w-5 h-5"
                style={{ color: themeColors.textSecondary }}
              />
            </button>
          </div>

          {/* Update Button */}
          <div>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200"
              style={{
                background: themeColors.primary,
                color: themeColors.onPrimary,
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
                opacity: updating ? 0.7 : 1,
                cursor: updating ? "wait" : "pointer",
              }}
            >
              {updating ? (
                <div className="flex items-center justify-center">
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2"
                    style={{ borderColor: themeColors.onPrimary }}
                  ></div>
                  <span>Updating...</span>
                </div>
              ) : (
                <span>{hasUnsavedChanges ? "Save Changes" : "No Changes"}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Image Picker Modal */}
      {showImagePickerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{
            background:
              themeColors.modalOverlay &&
              themeColors.modalOverlay !== "transparent"
                ? themeColors.modalOverlay
                : "rgba(0,0,0,0.7)",
          }}
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl"
            style={{
              background: "#181c1f",
              border: "1px solid #23272b",
            }}
          >
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: themeColors.primary }}
              >
                <Camera
                  className="w-8 h-8"
                  style={{ color: themeColors.onPrimary }}
                />
              </div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: themeColors.text }}
              >
                Select Photo
              </h3>
              <p
                className="text-sm"
                style={{ color: themeColors.textSecondary }}
              >
                After selecting, you'll crop your photo to fit perfectly
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center p-4 rounded-xl border-2 transition-all duration-200"
                style={{
                  borderColor: themeColors.cardBorder,
                  background: themeColors.inputBg,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mr-4"
                  style={{ background: themeColors.primaryBg }}
                >
                  <Images
                    className="w-5 h-5"
                    style={{ color: themeColors.primary }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className="font-semibold"
                    style={{ color: themeColors.text }}
                  >
                    Choose from Device
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: themeColors.textSecondary }}
                  >
                    Select a photo, then crop to fit
                  </p>
                </div>
                <ChevronRight
                  className="w-5 h-5"
                  style={{ color: themeColors.textSecondary }}
                />
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowImagePickerModal(false)}
              className="w-full py-3 px-4 rounded-xl font-medium transition-all duration-200"
              style={{
                background: themeColors.inputBg,
                color: themeColors.textSecondary,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{
            background:
              themeColors.modalOverlay &&
              themeColors.modalOverlay !== "transparent"
                ? themeColors.modalOverlay
                : "rgba(0,0,0,0.7)",
          }}
        >
          <div
            className="w-full max-w-lg mx-4 rounded-2xl p-6 shadow-2xl"
            style={{
              background: "#181c1f",
              border: "1px solid #23272b",
            }}
          >
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: themeColors.success }}
              >
                <CheckCircle
                  className="w-8 h-8"
                  style={{ color: themeColors.onSuccess }}
                />
              </div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: themeColors.text }}
              >
                Perfect! Your Photo is Ready
              </h3>
              <p
                className="text-sm px-4"
                style={{ color: themeColors.textSecondary }}
              >
                You've successfully selected your photo. This is how it will
                appear as your admin profile picture.
              </p>
            </div>

            {/* Preview Image */}
            <div className="text-center mb-6">
              <img
                src={selectedImage.uri}
                alt="Preview"
                className="w-36 h-36 mx-auto rounded-full object-cover shadow-lg border-4"
                style={{ borderColor: themeColors.cardBg }}
              />
              <div
                className="flex items-center justify-center mt-4 px-3 py-2 rounded-full"
                style={{ background: themeColors.primaryBg }}
              >
                <Info
                  className="w-4 h-4 mr-2"
                  style={{ color: themeColors.primary }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: themeColors.primary }}
                >
                  Photo ready to use
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelImageUpload}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200"
                style={{
                  background: themeColors.inputBg,
                  color: themeColors.textSecondary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmImageUpload}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200"
                style={{
                  background: themeColors.primary,
                  color: themeColors.onPrimary,
                }}
              >
                Set as Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <CustomAlert
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message="Your admin profile has been updated successfully"
        type="success"
        primaryAction={{
          text: "Continue",
          onPress: () => setShowSuccessModal(false),
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
    </div>
  );
};

export default AdminProfile;
