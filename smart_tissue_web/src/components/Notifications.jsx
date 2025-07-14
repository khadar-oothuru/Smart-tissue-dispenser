import { useState } from "react";
import {
  Bell,
  BellOff,
  Filter,
  Search,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "alert",
      title: "Low Tissue Level",
      message:
        "Dispenser-C3 in Room 201 is running low on tissues (8% remaining)",
      device: "Dispenser-C3",
      room: "Room 201",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      priority: "high",
      category: "maintenance",
    },
    {
      id: 2,
      type: "warning",
      title: "Battery Low",
      message: "Dispenser-E5 battery level is critically low (15%)",
      device: "Dispenser-E5",
      room: "Room 301",
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: false,
      priority: "critical",
      category: "hardware",
    },
    {
      id: 3,
      type: "success",
      title: "Maintenance Completed",
      message:
        "Dispenser-B2 has been successfully refilled and is now operational",
      device: "Dispenser-B2",
      room: "Room 102",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: true,
      priority: "info",
      category: "maintenance",
    },
    {
      id: 4,
      type: "error",
      title: "Device Offline",
      message: "Dispenser-E5 has been offline for 3 hours",
      device: "Dispenser-E5",
      room: "Room 301",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      read: false,
      priority: "critical",
      category: "connectivity",
    },
    {
      id: 5,
      type: "info",
      title: "Firmware Update Available",
      message: "New firmware version 1.2.4 is available for 8 devices",
      device: "Multiple Devices",
      room: "Various",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      priority: "low",
      category: "system",
    },
    {
      id: 6,
      type: "alert",
      title: "Unusual Usage Pattern",
      message: "Dispenser-A1 showing 300% higher usage than normal",
      device: "Dispenser-A1",
      room: "Room 101",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: false,
      priority: "medium",
      category: "analytics",
    },
    {
      id: 7,
      type: "success",
      title: "System Health Check",
      message:
        "All systems are operating normally. Daily health check completed",
      device: "System",
      room: "All",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      read: true,
      priority: "info",
      category: "system",
    },
    {
      id: 8,
      type: "warning",
      title: "Sensor Calibration Required",
      message:
        "Dispenser-D4 sensors may need calibration due to inconsistent readings",
      device: "Dispenser-D4",
      room: "Room 202",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true,
      priority: "medium",
      category: "maintenance",
    },
  ]);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "info":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notification.read) ||
      (filter === "read" && notification.read) ||
      notification.category === filter ||
      notification.priority === filter;

    const matchesSearch =
      searchTerm === "" ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.device.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAsUnread = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: false } : notification
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((notId) => notId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(
        filteredNotifications.map((notification) => notification.id)
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with your Smart Tissue Dispenser alerts and system
            status
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BellOff className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter((n) => n.priority === "critical").length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  notifications.filter(
                    (n) =>
                      new Date(n.timestamp).toDateString() ===
                      new Date().toDateString()
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="critical">Critical</option>
              <option value="high">High Priority</option>
              <option value="maintenance">Maintenance</option>
              <option value="hardware">Hardware</option>
              <option value="connectivity">Connectivity</option>
              <option value="system">System</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredNotifications.length} of {notifications.length}{" "}
              notifications
            </span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        <div className="space-y-4">
          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
              <span className="text-sm font-medium text-blue-900">
                {selectedNotifications.length} notification
                {selectedNotifications.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Mark as Read
                </button>
                <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Select All */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={
                  selectedNotifications.length === filteredNotifications.length
                }
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Select All
              </label>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredNotifications.length} notifications
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No notifications
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No notifications match your current filter.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 rounded-md border transition-colors ${
                    notification.read
                      ? "bg-white border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />

                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-medium ${
                          notification.read
                            ? "text-gray-900"
                            : "text-gray-900 font-semibold"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          notification.priority
                        )}`}
                      >
                        {notification.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                      <span>{notification.device}</span>
                      <span>{notification.room}</span>
                      <span>{formatTimestamp(notification.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {notification.read ? (
                      <button
                        onClick={() => markAsUnread(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Mark as unread"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-400 hover:text-blue-600"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
