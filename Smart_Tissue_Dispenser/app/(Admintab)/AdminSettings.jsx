import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "@/components/common/ScreenWrapper";
import { useThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import AdminService from "../../services/AdminService";

// Import new components
import UserManagement from "../../components/admin/UserManagement";
import AdminProfile from "../../components/admin/AdminProfile";
import AppLogs from "../../components/admin/AppLogs";

const AdminSettings = () => {
  const { themeColors } = useThemeContext();
  const auth = useAuth();
  // Set auth context in AdminService
  useEffect(() => {
    console.log("AdminSettings: Setting auth context, user:", auth.user?.email);
    console.log(
      "AdminSettings: Setting auth context, accessToken available:",
      !!auth.accessToken
    );
    AdminService.setAuthContext(auth);
  }, [auth]);

  // State management
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  // API Functions
  const fetchUsers = useCallback(async () => {
    try {
      const data = await AdminService.fetchUsers();
      // Extract users array from paginated response
      const usersArray = data?.results || data || [];
      setUsers(usersArray);
    } catch (error) {
      console.error("AdminSettings: Error fetching users:", error);
    }
  }, []);
  const fetchStats = useCallback(async () => {
    try {
      const data = await AdminService.fetchAdminStats();
      setStats(data);
    } catch (error) {
      console.error("AdminSettings: Error fetching stats:", error);
    }
  }, []);
  const fetchAdminProfile = useCallback(async () => {
    try {
      console.log("AdminSettings: Fetching admin profile...");
      const data = await AdminService.fetchAdminProfile();
      console.log("AdminSettings: Admin profile fetched successfully:", !!data);
      setAdminProfile(data);
    } catch (error) {
      console.error("AdminSettings: Error fetching admin profile:", error);
      console.error("AdminSettings: Error message:", error.message);
    }
  }, []);
  const loadData = useCallback(async () => {
    try {
      await Promise.all([fetchUsers(), fetchStats(), fetchAdminProfile()]);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [fetchUsers, fetchStats, fetchAdminProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]); // Tab Navigation
  const renderTabButton = (tabKey, title, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          backgroundColor:
            activeTab === tabKey ? themeColors.primary : "transparent",
          borderColor: themeColors.primary,
        },
      ]}
      onPress={() => setActiveTab(tabKey)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={activeTab === tabKey ? "#FFFFFF" : themeColors.primary}
      />
      <Text
        style={[
          styles.tabButtonText,
          {
            color: activeTab === tabKey ? "#FFFFFF" : themeColors.primary,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
  const renderTabContent = () => {
    const commonProps = {
      style: styles.tabContent,
    };

    switch (activeTab) {
      case "users":
        return (
          <UserManagement
            users={users}
            setUsers={setUsers}
            stats={stats}
            refreshing={refreshing}
            onRefresh={onRefresh}
            {...commonProps}
          />
        );
      case "profile":
        return (
          <AdminProfile
            adminProfile={adminProfile}
            fetchAdminProfile={fetchAdminProfile}
            {...commonProps}
          />
        );
      case "logs":
        return <AppLogs {...commonProps} />;
      default:
        return (
          <UserManagement
            users={users}
            setUsers={setUsers}
            stats={stats}
            refreshing={refreshing}
            onRefresh={onRefresh}
            {...commonProps}
          />
        );
    }
  };

  return (
    <ScreenWrapper>
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
            Admin Panel
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.text }]}>
            Manage users, profile, and monitor logs
          </Text>
        </View>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton("users", "Users", "people-outline")}
          {renderTabButton("profile", "Profile", "person-outline")}
          {renderTabButton("logs", "Logs", "document-text-outline")}
        </View>
        {/* Tab Content */}
        {renderTabContent()}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    fontWeight: "400",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default AdminSettings;
