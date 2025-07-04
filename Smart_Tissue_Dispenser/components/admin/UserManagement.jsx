import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import AdminService from "../../services/AdminService";

import UserItem from "./UserItemClean";
import RoleChangeModal from "./RoleChangeModal";
import { CustomAlert } from "../common/CustomAlert";
import StatsCard from "./StatsCard";

const UserManagement = ({
  users,
  setUsers,
  stats,
  refreshing,
  onRefresh,
  style,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const auth = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Custom Alert states
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    primaryAction: null,
    secondaryAction: null,
  });

  const showAlert = (config) => {
    setAlertConfig({
      visible: true,
      ...config,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };
  // Filter out the current logged-in user from the list
  // Admins shouldn't be able to manage their own account
  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        // Filter out current user by ID
        if (auth.user?.id && user.id === auth.user.id) {
          return false;
        }
        // Also filter by username as backup
        if (auth.user?.username && user.username === auth.user.username) {
          return false;
        }
        return true;
      })
    : [];
  const fetchUsers = useCallback(async () => {
    try {
      const data = await AdminService.fetchUsers();
      // Extract users array from paginated response
      const usersArray = data?.results || data || [];
      setUsers(usersArray);
    } catch (error) {
      console.error("Error fetching users:", error);
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to load users",
      });
    }
  }, [setUsers]);

  const deleteUser = async (userId, username) => {
    showAlert({
      type: "warning",
      title: "Delete User",
      message: `Are you sure you want to delete ${username}? This action cannot be undone.`,
      primaryAction: {
        text: "Delete",
        onPress: async () => {
          try {
            await AdminService.deleteUser(userId);
            showAlert({
              type: "success",
              title: "Success",
              message: "User deleted successfully",
            });
            fetchUsers();
          } catch (error) {
            console.error("Error deleting user:", error);
            showAlert({
              type: "error",
              title: "Error",
              message: error.message || "Failed to delete user",
            });
          }
        },
      },
      secondaryAction: {
        text: "Cancel",
        onPress: () => {},
      },
    });
  };
  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleRoleUpdate = async (newRole) => {
    if (selectedUser) {
      try {
        await AdminService.updateUserRole(selectedUser.id, newRole);
        showAlert({
          type: "success",
          title: "Success",
          message: "User role updated successfully",
        });
        fetchUsers(); // Refresh the user list
        setShowRoleModal(false);
        setSelectedUser(null);
      } catch (error) {
        console.error("Error updating user role:", error);
        showAlert({
          type: "error",
          title: "Error",
          message: error.message || "Failed to update user role",
        });
      }
    }
  };
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="people-outline"
        size={48}
        color={themeColors.text + "40"}
      />
      <Text style={[styles.emptyText, { color: themeColors.text }]}>
        {users.length > 0 ? "No other users to manage" : "No users found"}
      </Text>
      {users.length > 0 && (
        <Text style={[styles.emptySubtext, { color: themeColors.text }]}>
          You cannot manage your own account
        </Text>
      )}
    </View>
  );
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.background },
        style,
      ]}
    >
      
      {/* Statistics Overview */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              title="Total Users"
              value={stats.total_users}
              icon="people-outline"
              color={themeColors.primary}
              style={styles.statCard}
            />
            <StatsCard
              title="Admins"
              value={stats.total_admins}
              icon="shield-checkmark-outline"
              color="#FF6B35"
              style={styles.statCard}
            />
          </View>
        </View>
      )}
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          All Users ({filteredUsers.length})
        </Text>
        <TouchableOpacity onPress={fetchUsers}>
          <Ionicons name="refresh" size={20} color={themeColors.primary} />
        </TouchableOpacity>
      </View>
      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={({ item }) => (
          <UserItem
            user={item}
            onRoleChange={() => handleRoleChange(item)}
            onDelete={() => deleteUser(item.id, item.username)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          filteredUsers.length === 0
            ? styles.emptyContainer
            : styles.listContainer,
          { paddingBottom: 20 },
        ]}
        style={styles.usersList}
      />
      {/* Role Change Modal */}
      <RoleChangeModal
        visible={showRoleModal}
        user={selectedUser}
        onRoleUpdate={handleRoleUpdate}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
      />
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        primaryAction={alertConfig.primaryAction}
        secondaryAction={alertConfig.secondaryAction}
        themeColors={themeColors}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  listContainer: {
    paddingHorizontal: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.5,
    textAlign: "center",
    lineHeight: 20,
  },
  usersList: {
    flex: 1,
  },
});

export default UserManagement;
