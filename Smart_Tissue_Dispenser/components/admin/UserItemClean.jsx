import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const UserItem = ({ user, onRoleChange, onDelete }) => {
  const { themeColors, isDark } = useThemeContext();
  const [imageError, setImageError] = React.useState(false);

  // Reset image error when user changes
  React.useEffect(() => {
    setImageError(false);
  }, [user?.id]);

  return (
    <View
      style={[
        styles.userItem,
        {
          backgroundColor: isDark ? themeColors.surface : "#FFFFFF",
          borderColor: themeColors.border,
          shadowColor: isDark ? "#000" : "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {user.profile_picture && !imageError ? (
            <Image
              source={{
                uri: user.profile_picture,
              }}
              style={styles.userAvatar}
              resizeMode="cover"
              onError={(error) => {
                console.log(
                  "User avatar failed to load:",
                  user.profile_picture,
                  error.nativeEvent?.error
                );
                setImageError(true);
              }}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <View style={[styles.userAvatar, styles.placeholderAvatar]}>
              <Ionicons
                name="person"
                size={28}
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
        </View>
        <View style={styles.userDetails}>
          <View style={styles.userHeader}>
            <Text style={[styles.userName, { color: themeColors.heading }]}>
              {user.full_name || user.username}
            </Text>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor:
                    user.role === "admin"
                      ? themeColors.primary + "20"
                      : themeColors.text + "15",
                },
              ]}
            >
              <Ionicons
                name={user.role === "admin" ? "shield" : "person"}
                size={12}
                color={
                  user.role === "admin" ? themeColors.primary : themeColors.text
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
          <Text style={[styles.userEmail, { color: themeColors.text }]}>
            {user.email}
          </Text>
          <View style={styles.userMeta}>
            <Text style={[styles.joinDate, { color: themeColors.text }]}>
              Joined {user.date_joined_formatted}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.editButton,
            { backgroundColor: "#FFB84D" },
          ]}
          onPress={onRoleChange}
        >
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deleteButton,
            { backgroundColor: "#FF6B6B" },
          ]}
          onPress={onDelete}
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
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  placeholderAvatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
    paddingRight: 12,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 8,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    justifyContent: "flex-start",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  joinDate: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: "500",
    marginLeft: 0,
    textAlign: "left",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  userActions: {
    flexDirection: "column",
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editButton: {
    borderWidth: 1,
    borderColor: "#FF9500",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#DC2626",
  },
});

export default UserItem;
