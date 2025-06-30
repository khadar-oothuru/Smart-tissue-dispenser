import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const { width, height } = Dimensions.get("window");

const UserProfileModal = ({ visible, user, onClose }) => {
  const { themeColors } = useThemeContext();
  const [imageError, setImageError] = React.useState(false);
  const [showFullImage, setShowFullImage] = React.useState(false);

  // Reset image error when user changes
  React.useEffect(() => {
    setImageError(false);
    if (user) {
      console.log("UserProfileModal - User data:", {
        id: user.id,
        username: user.username,
        profile_picture: user.profile_picture,
        has_profile_picture: !!user.profile_picture,
      });
    }
  }, [user]);

  if (!user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const InfoItem = ({ icon, label, value, color = themeColors.text }) => (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={themeColors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: themeColors.text }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            
            <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
              User Profile {user?.username ? `- ${user.username}` : ""}
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: themeColors.text + "10" },
              ]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Picture and Basic Info */}
            <View style={styles.profileSection}>
              
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() =>
                  user.profile_picture && !imageError && setShowFullImage(true)
                }
                activeOpacity={user.profile_picture && !imageError ? 0.7 : 1}
              >
                {user.profile_picture && !imageError ? (
                  <Image
                    source={{
                      uri: user.profile_picture,
                    }}
                    style={styles.profileAvatar}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log(
                        "Profile image failed to load:",
                        user.profile_picture,
                        error.nativeEvent?.error
                      );
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log(
                        "Profile image loaded successfully:",
                        user.profile_picture
                      );
                      setImageError(false);
                    }}
                  />
                ) : (
                  <View
                    style={[styles.profileAvatar, styles.placeholderAvatar]}
                  >
                  
                    <Ionicons
                      name="person"
                      size={60}
                      color={themeColors.text + "60"}
                    />
                  </View>
                )}
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor: user.is_active ? "#10B981" : "#EF4444",
                    },
                  ]}
                />
                {user.profile_picture && !imageError && (
                  <View style={styles.expandIndicator}>
                    <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
              <Text
                style={[styles.profileName, { color: themeColors.heading }]}
              >
                {user.full_name || user.username}
              </Text>
              <Text
                style={[styles.profileUsername, { color: themeColors.text }]}
              >
                @{user.username}
              </Text>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      user.role === "admin"
                        ? themeColors.primary + "20"
                        : themeColors.text + "20",
                  },
                ]}
              >
                <Ionicons
                  name={user.role === "admin" ? "shield" : "person"}
                  size={14}
                  color={
                    user.role === "admin"
                      ? themeColors.primary
                      : themeColors.text
                  }
                />
                <Text
                  style={[
                    styles.roleText,
                    {
                      color:
                        user.role === "admin"
                          ? themeColors.primary
                          : themeColors.text,
                    },
                  ]}
                >
                  {user.role.toUpperCase()}
                </Text>
              </View>
            </View>
            {/* User Information */}
            <View style={styles.infoSection}>
              <Text
                style={[styles.sectionTitle, { color: themeColors.heading }]}
              >
                User Information
              </Text>

              <InfoItem
                icon="mail-outline"
                label="Email"
                value={user.email || "Not provided"}
              />

              <InfoItem
                icon="person-outline"
                label="First Name"
                value={user.first_name || "Not provided"}
              />

              <InfoItem
                icon="person-outline"
                label="Last Name"
                value={user.last_name || "Not provided"}
              />

              <InfoItem
                icon="calendar-outline"
                label="Date Joined"
                value={formatDate(user.date_joined)}
              />

              <InfoItem
                icon="time-outline"
                label="Last Login"
                value={formatDate(user.last_login) || "Never"}
              />

              <InfoItem
                icon="checkmark-circle-outline"
                label="Account Status"
                value={user.is_active ? "Active" : "Inactive"}
                color={user.is_active ? "#10B981" : "#EF4444"}
              />

              <InfoItem
                icon="shield-outline"
                label="Staff Status"
                value={user.is_staff ? "Yes" : "No"}
                color={user.is_staff ? themeColors.primary : themeColors.text}
              />

              <InfoItem
                icon="settings-outline"
                label="Superuser"
                value={user.is_superuser ? "Yes" : "No"}
                color={user.is_superuser ? "#EF4444" : themeColors.text}
              />
            </View>
            {/* Additional Stats if available */}
            {(user.device_count || user.last_activity) && (
              <View style={styles.infoSection}>
                <Text
                  style={[styles.sectionTitle, { color: themeColors.heading }]}
                >
                  Activity
                </Text>

                {user.device_count && (
                  <InfoItem
                    icon="hardware-chip-outline"
                    label="Devices"
                    value={`${user.device_count} connected`}
                  />
                )}

                {user.last_activity && (
                  <InfoItem
                    icon="pulse-outline"
                    label="Last Activity"
                    value={formatDate(user.last_activity)}
                  />
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.fullImageOverlay}>
          <TouchableOpacity
            style={styles.fullImageContainer}
            activeOpacity={1}
            onPress={() => setShowFullImage(false)}
          >
            <TouchableOpacity
              style={styles.fullImageCloseButton}
              onPress={() => setShowFullImage(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: user.profile_picture }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    padding: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  placeholderAvatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  expandIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.7,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 123, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  // Full Screen Image Modal Styles
  fullImageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fullImageCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 8,
  },
});

export default UserProfileModal;
