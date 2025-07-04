import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const UserItem = ({ user, onRoleChange, onDelete }) => {
  const { themeColors, isDark } = useThemeContext();

  return (
    <View
      style={[
        styles.userItem,
        {
          backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
          borderColor: themeColors.border,
        },
      ]}
    >
      <View style={styles.userInfo}>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: themeColors.heading }]}>
            {user?.username || "No username"}
          </Text>
          <Text style={[styles.userEmail, { color: themeColors.text }]}>
            {user?.email || "No email"}
          </Text>
          <Text style={[styles.userRole, { color: themeColors.primary }]}>
            Role: {user?.role || "No role"}
          </Text>
        </View>
      </View>

      <View style={styles.userActions}>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onRoleChange}
          activeOpacity={0.8}
        >
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flex: 1,
    paddingRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  userRole: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userActions: {
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  editButton: {
    backgroundColor: "#3B82F6",
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#DC2626",
  },
});

export default UserItem;
