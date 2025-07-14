import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserCog,
} from "lucide-react";

import RoleChangeModal from "./RoleChangeModal";
import UserProfileModal from "./UserProfileModal";
import UserItem from "./UserItem";
import { CustomAlert } from "../common/CustomAlert";

import adminService from "../../services/AdminService";

const UserManagement = () => {
  const { accessToken, user, isAuthenticated } = useAuth();
  const { themeColors } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Custom Alert state for delete
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState(null);
  // Only show user cards, no view mode

  // Users state from API
  const [users, setUsers] = useState([]);
  // Stats state from API
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    admin_count: 0,
    new_users_this_month: 0,
  });

  // Fetch users and stats from API
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        adminService.setAuthContext({ accessToken, user });
        setLoading(true);
        setError(null);
        const [usersData, statsDataRaw] = await Promise.all([
          adminService.fetchUsers(),
          adminService.fetchAdminStats(),
        ]);
        // If API returns { results: [...] } (pagination), use results, else use array
        if (Array.isArray(usersData)) {
          setUsers(usersData);
        } else if (usersData && Array.isArray(usersData.results)) {
          setUsers(usersData.results);
        } else if (usersData && Array.isArray(usersData.users)) {
          setUsers(usersData.users);
        } else if (usersData && Array.isArray(usersData.data)) {
          setUsers(usersData.data);
        } else {
          setUsers([]);
        }
        // Robustly map statsDataRaw to expected keys
        const statsData = statsDataRaw || {};
        // Fallback: calculate admin_count and new_users_this_month from users if missing or zero
        let usersList = [];
        if (Array.isArray(usersData)) {
          usersList = usersData;
        } else if (usersData && Array.isArray(usersData.results)) {
          usersList = usersData.results;
        } else if (usersData && Array.isArray(usersData.users)) {
          usersList = usersData.users;
        } else if (usersData && Array.isArray(usersData.data)) {
          usersList = usersData.data;
        }

        // Calculate admin count from users if backend value is missing or 0
        let adminCount = statsData.admin_count ?? statsData.adminCount ?? 0;
        if (!adminCount && usersList.length > 0) {
          adminCount = usersList.filter((u) => u.role === "admin").length;
        }

        // Calculate new users this month if backend value is missing or 0
        let newUsersThisMonth =
          statsData.new_users_this_month ?? statsData.newUsersThisMonth ?? 0;
        if (!newUsersThisMonth && usersList.length > 0) {
          const now = new Date();
          const thisMonth = now.getMonth();
          const thisYear = now.getFullYear();
          newUsersThisMonth = usersList.filter((u) => {
            const joined = new Date(
              u.date_joined || u.created_at || u.last_login
            );
            return (
              joined.getMonth() === thisMonth &&
              joined.getFullYear() === thisYear
            );
          }).length;
        }

        setStats({
          total_users:
            statsData.total_users ?? statsData.totalUsers ?? usersList.length,
          active_users:
            statsData.active_users ??
            statsData.activeUsers ??
            usersList.filter((u) => u.is_active).length,
          admin_count: adminCount,
          new_users_this_month: newUsersThisMonth,
        });
      } catch (err) {
        setError(err.message || "Failed to fetch users or stats");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    role: "user",
    is_active: true,
  });

  // Filter users based on search and filters, and exclude the logged-in user
  // If a user was just updated (role change), always show them at the top, even if they don't match the filter
  const [lastUpdatedUserId, setLastUpdatedUserId] = useState(null);
  const filteredUsersRaw = users.filter((u) => {
    // Exclude the logged-in user by email or id
    if (
      user &&
      ((u.email && user.email && u.email === user.email) ||
        (u.id && user.id && u.id === user.id))
    ) {
      return false;
    }

    const matchesSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" ? u.is_active : !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  let filteredUsers = filteredUsersRaw;
  if (lastUpdatedUserId) {
    const updatedUser = users.find((u) => u.id === lastUpdatedUserId);
    if (updatedUser) {
      const alreadyInList = filteredUsersRaw.some(
        (u) => u.id === lastUpdatedUserId
      );
      if (!alreadyInList) {
        filteredUsers = [updatedUser, ...filteredUsersRaw];
      }
    }
  }

  // Handle user selection
  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  // Handle user operations
  const handleAddUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      adminService.setAuthContext({ accessToken, user });
      const newUser = await adminService.createUser(userData);
      setUsers((prev) => [...prev, newUser]);
      setShowAddModal(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "user",
        is_active: true,
      });
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);
      adminService.setAuthContext({ accessToken, user });
      const updatedUser = await adminService.updateUser(userId, userData);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId) => {
    setPendingDeleteUserId(userId);
    setShowDeleteAlert(true);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUserId) return;
    try {
      setLoading(true);
      setError(null);
      adminService.setAuthContext({ accessToken, user });
      await adminService.deleteUser(pendingDeleteUserId);
      setUsers((prev) => prev.filter((u) => u.id !== pendingDeleteUserId));
      setSelectedUsers((prev) =>
        prev.filter((id) => id !== pendingDeleteUserId)
      );
    } catch (err) {
      setError(err.message || "Failed to delete user");
    } finally {
      setLoading(false);
      setShowDeleteAlert(false);
      setPendingDeleteUserId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedUsers.length} users?`
      )
    )
      return;
    try {
      setLoading(true);
      setError(null);
      adminService.setAuthContext({ accessToken, user });
      await Promise.all(selectedUsers.map((id) => adminService.deleteUser(id)));
      setUsers((prev) => prev.filter((u) => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
    } catch (err) {
      setError(err.message || "Failed to delete users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      setLoading(true);
      setError(null);
      adminService.setAuthContext({ accessToken, user });
      const updatedUser = await adminService.updateUserStatus(userId, isActive);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    } catch (err) {
      setError(err.message || "Failed to update user status");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      setLoading(true);
      setError(null);
      adminService.setAuthContext({ accessToken, user });
      const updatedUser = await adminService.updateUserRole(userId, newRole);
      console.log("Updated user after role change:", updatedUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u))
      );
      setLastUpdatedUserId(userId); // Mark this user as last updated
      setShowRoleModal(false);
    } catch (err) {
      setError(err.message || "Failed to update user role");
    } finally {
      setLoading(false);
    }
  };
  // Reset lastUpdatedUserId when filters or search change
  useEffect(() => {
    setLastUpdatedUserId(null);
  }, [searchTerm, filterRole, filterStatus]);

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  // Get role color and icon
  const getRoleConfig = (role) => {
    switch (role) {
      case "admin":
        return { color: "bg-purple-100 text-purple-800", icon: Shield };
      case "manager":
        return { color: "bg-blue-100 text-blue-800", icon: Shield };
      case "user":
        return { color: "bg-green-100 text-green-800", icon: Users };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: Users };
    }
  };

  // Get status color and icon
  const getStatusConfig = (isActive) => {
    return isActive
      ? { color: "bg-green-100 text-green-800", icon: CheckCircle }
      : { color: "bg-red-100 text-red-800", icon: XCircle };
  };

  // Stats cards
  // Modern Stat Card with vibrant color backgrounds and icon containers
  const StatCard = ({ title, value, icon: Icon, color, iconBg, iconColor }) => (
    <div
      className="rounded-3xl shadow-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:scale-[1.03]"
      style={{
        background: color,
        border: "1.5px solid #e0e0e0",
        minHeight: 140,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-sm font-medium opacity-80 mb-1"
            style={{ color: "#555" }}
          >
            {title}
          </p>
          <p
            className="text-3xl font-extrabold leading-tight"
            style={{ color: "#222" }}
          >
            {value}
          </p>
        </div>
        <div
          className="rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: iconBg,
            width: 52,
            height: 52,
            minWidth: 52,
            minHeight: 52,
            boxShadow: "0 4px 16px 0 rgba(0,0,0,0.07)",
          }}
        >
          <Icon size={28} color={iconColor} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Custom Alert for Delete User */}
      <CustomAlert
        visible={showDeleteAlert}
        onClose={() => {
          setShowDeleteAlert(false);
          setPendingDeleteUserId(null);
        }}
        title="Delete User?"
        message="Are you sure you want to delete this user? This action cannot be undone."
        type="error"
        primaryAction={{
          text: loading ? "Deleting..." : "Delete",
          onPress: confirmDeleteUser,
        }}
        secondaryAction={{
          text: "Cancel",
          onPress: () => {
            setShowDeleteAlert(false);
            setPendingDeleteUserId(null);
          },
        }}
        themeColors={themeColors}
        isDark={document.documentElement.classList.contains("dark")}
      />
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">
            User Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage system users, roles, and permissions
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={Users}
          color="#E8F4FD"
          iconBg="#D0E8FF"
          iconColor="#007AFF"
        />
        <StatCard
          title="Active Users"
          value={stats.active_users}
          icon={CheckCircle}
          color="#E8F5E8"
          iconBg="#B6F0C2"
          iconColor="#34C759"
        />
        <StatCard
          title="Admins"
          value={stats.admin_count}
          icon={Shield}
          color="#F3E8FD"
          iconBg="#D1B3FF"
          iconColor="#8E44AD"
        />
        <StatCard
          title="New This Month"
          value={stats.new_users_this_month}
          icon={UserPlus}
          color="#FFF4E6"
          iconBg="#FFD59E"
          iconColor="#FF9500"
        />
      </div>

      {/* Search and Filters */}
      <div className="shadow rounded-3xl p-8 backdrop-blur-xl" style={{}}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Search */}
          <div className="relative">
            <style>{`
              .theme-search-input::placeholder {
                color: ${themeColors.inputIcon || "#b0b8c1"} !important;
                opacity: 1;
                font-weight: 500;
              }
              .theme-search-input::-webkit-input-placeholder {
                color: ${themeColors.inputIcon || "#b0b8c1"} !important;
                opacity: 1;
                font-weight: 500;
              }
              .theme-search-input:-ms-input-placeholder {
                color: ${themeColors.inputIcon || "#b0b8c1"} !important;
                opacity: 1;
                font-weight: 500;
              }
              .theme-search-input::-ms-input-placeholder {
                color: ${themeColors.inputIcon || "#b0b8c1"} !important;
                opacity: 1;
                font-weight: 500;
              }
            `}</style>
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: themeColors.inputIcon || "#b0b8c1" }}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 w-full rounded-xl focus:ring-2 focus:ring-blue-400 text-base theme-search-input"
              style={{
                background: themeColors.inputBg || "rgba(255,255,255,0.18)",
                border: `1.5px solid ${
                  themeColors.inputBorder || "rgba(180,180,255,0.18)"
                }`,
                color: themeColors.text || "#fff",
                boxShadow:
                  themeColors.inputShadow ||
                  "0 2px 8px 0 rgba(31, 38, 135, 0.08)",
                fontWeight: 500,
                outline: "none",
                transition: "all 0.2s",
              }}
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <style>{`
              select.theme-dropdown, select.theme-dropdown option {
                background: ${
                  themeColors.inputBg || "rgba(40,40,60,0.95)"
                } !important;
                color: ${themeColors.text || "#fff"} !important;
              }
              select.theme-dropdown:focus {
                outline: 2px solid ${themeColors.primary || "#4f8cff"};
                box-shadow: 0 0 0 2px ${themeColors.primary || "#4f8cff"}33;
              }
              select.theme-dropdown::-webkit-scrollbar {
                width: 8px;
                background: ${themeColors.inputBg || "rgba(40,40,60,0.95)"};
              }
              select.theme-dropdown::-webkit-scrollbar-thumb {
                background: ${themeColors.inputBorder || "#444"};
                border-radius: 4px;
              }
            `}</style>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 w-full rounded-xl focus:ring-2 focus:ring-blue-400 text-base appearance-none theme-dropdown"
              style={{
                background: themeColors.inputBg || "rgba(255,255,255,0.18)",
                border: `1.5px solid ${
                  themeColors.inputBorder || "rgba(180,180,255,0.18)"
                }`,
                color: themeColors.text || "#fff",
                boxShadow:
                  themeColors.inputShadow ||
                  "0 2px 8px 0 rgba(31, 38, 135, 0.08)",
                fontWeight: 500,
                outline: "none",
                transition: "all 0.2s",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
              }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <span
              className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2 text-lg"
              style={{ color: themeColors.inputIcon || "#b0b8c1" }}
            >
              &#9662;
            </span>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 w-full rounded-xl focus:ring-2 focus:ring-blue-400 text-base appearance-none theme-dropdown"
              style={{
                background: themeColors.inputBg || "rgba(255,255,255,0.18)",
                border: `1.5px solid ${
                  themeColors.inputBorder || "rgba(180,180,255,0.18)"
                }`,
                color: themeColors.text || "#fff",
                boxShadow:
                  themeColors.inputShadow ||
                  "0 2px 8px 0 rgba(31, 38, 135, 0.08)",
                fontWeight: 500,
                outline: "none",
                transition: "all 0.2s",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span
              className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2 text-lg"
              style={{ color: themeColors.inputIcon || "#b0b8c1" }}
            >
              &#9662;
            </span>
          </div>

          {/* Bulk Actions only, no view mode */}
          <div className="flex space-x-2 items-center">
            {selectedUsers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-colors duration-200 shadow-md"
                style={{
                  background: themeColors.dangerBg || "rgba(255, 0, 0, 0.08)",
                  color: themeColors.dangerText || "#d32f2f",
                  border: `1.5px solid ${
                    themeColors.dangerBorder || "rgba(255,0,0,0.18)"
                  }`,
                }}
              >
                <Trash2
                  className="h-5 w-5 mr-2"
                  style={{ color: themeColors.dangerText || "#d32f2f" }}
                />
                Delete ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Display: Only User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUsers.map((user) => {
          let date_joined_formatted = undefined;
          if (user.date_joined) {
            const date = new Date(user.date_joined);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1970) {
              date_joined_formatted = date.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
            }
          }
          return (
            <UserItem
              key={user.id}
              user={{
                ...user,
                username: user.username,
                full_name: user.username,
                date_joined_formatted,
              }}
              onRoleChange={() => handleRoleChange(user)}
              onDelete={() => handleDeleteUser(user.id)}
              onViewProfile={() => handleViewProfile(user)}
            />
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No users found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterRole !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filters."
              : "Get started by creating a new user."}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Add New User
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddUser(formData);
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create User"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Edit User
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditUser(editingUser.id, formData);
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update User"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <RoleChangeModal
          visible={showRoleModal}
          user={selectedUser}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          onRoleUpdate={(newRole) => handleRoleUpdate(selectedUser.id, newRole)}
        />
      )}

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <UserProfileModal
          visible={showProfileModal}
          user={{
            ...selectedUser,
            username: selectedUser.username,
            date_joined: selectedUser.date_joined || selectedUser.last_login,
            profile_picture: selectedUser.profile_picture || null,
          }}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
