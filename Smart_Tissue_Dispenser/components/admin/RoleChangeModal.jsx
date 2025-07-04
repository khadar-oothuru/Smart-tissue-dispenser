import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const RoleChangeModal = ({ visible, user, onRoleUpdate, onClose }) => {
  const { themeColors, isDark } = useThemeContext();

  if (!user) return null;
  const handleRoleChange = (newRole) => {
    if (user.role !== newRole) {
      onRoleUpdate(newRole);
      // Don't close here - let parent handle closing after successful API call
    } else {
      onClose(); // Close if same role selected
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
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
          <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
            Change User Role
          </Text>
          <Text style={[styles.modalSubtitle, { color: themeColors.text }]}>
            Change role for {user.username}
          </Text>
          <Text style={[styles.currentRole, { color: themeColors.text }]}>
            Current role:
            <Text style={{ fontWeight: "600" }}>{user.role.toUpperCase()}</Text>
          </Text>

          <View style={styles.roleOptions}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                {
                  backgroundColor:
                    user.role === "user"
                      ? themeColors.primary + "20"
                      : "transparent",
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => handleRoleChange("user")}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={themeColors.primary}
              />
              <View style={styles.roleInfo}>
                <Text
                  style={[
                    styles.roleOptionText,
                    { color: themeColors.heading },
                  ]}
                >
                  User
                </Text>
                <Text
                  style={[styles.roleDescription, { color: themeColors.text }]}
                >
                  Standard user with basic permissions
                </Text>
              </View>
              {user.role === "user" && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={themeColors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                {
                  backgroundColor:
                    user.role === "admin"
                      ? themeColors.primary + "20"
                      : "transparent",
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => handleRoleChange("admin")}
            >
              <Ionicons
                name="shield-outline"
                size={20}
                color={themeColors.primary}
              />
              <View style={styles.roleInfo}>
                <Text
                  style={[
                    styles.roleOptionText,
                    { color: themeColors.heading },
                  ]}
                >
                  Admin
                </Text>
                <Text
                  style={[styles.roleDescription, { color: themeColors.text }]}
                >
                  Full access to system management
                </Text>
              </View>
              {user.role === "admin" && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={themeColors.primary}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                {
                  backgroundColor: isDark ? themeColors.surface : "#F8F9FA",
                  borderColor: themeColors.border,
                },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.modalButtonText, { color: themeColors.text }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    width: "85%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 8,
  },
  currentRole: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
  },
  roleOptions: {
    gap: 12,
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RoleChangeModal;
