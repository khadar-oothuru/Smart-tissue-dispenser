import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

// Icon component that renders the appropriate icon based on family
const NotificationIcon = ({ name, family, color, size = 24 }) => {
  const IconComponent =
    {
      Feather: Feather,
      FontAwesome5: FontAwesome5,
      MaterialCommunityIcons: MaterialCommunityIcons,
    }[family] || Feather;

  return <IconComponent name={name} size={size} color={color} />;
};

// Enhanced notification card component with real icons
export const NotificationCard = ({
  notification,
  onPress,
  onDismiss,
  style,
}) => {
  const { title, body, data = {}, timestamp } = notification;

  const {
    iconName = "bell",
    iconFamily = "Feather",
    iconColor = "#3AB0FF",
    type = "default",
  } = data;
  // Get notification type styling
  const getTypeStyle = (type) => {
    switch (type) {
      case "tamper":
        return {
          backgroundColor: "#F3E8FF",
          borderColor: "#8B5CF6",
          titleColor: "#7C3AED",
        };
      case "empty":
        return {
          backgroundColor: "#FEF2F2",
          borderColor: "#DC2626",
          titleColor: "#B91C1C",
        };
      case "low":
        return {
          backgroundColor: "#FFF3E0",
          borderColor: "#FF9800",
          titleColor: "#E65100",
        };
      case "full":
        return {
          backgroundColor: "#E8F5E9",
          borderColor: "#4CAF50",
          titleColor: "#2E7D32",
        };
      case "maintenance":
        return {
          backgroundColor: "#E3F2FD",
          borderColor: "#2196F3",
          titleColor: "#1565C0",
        };
      default:
        return {
          backgroundColor: "#F5F5F5",
          borderColor: "#3AB0FF",
          titleColor: "#1976D2",
        };
    }
  };

  const typeStyle = getTypeStyle(type);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: typeStyle.backgroundColor,
          borderLeftColor: typeStyle.borderColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <NotificationIcon
              name={iconName}
              family={iconFamily}
              color={iconColor}
              size={28}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, { color: typeStyle.titleColor }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {timestamp && (
              <Text style={styles.timestamp}>
                {new Date(timestamp).toLocaleTimeString()}
              </Text>
            )}
          </View>
          {onDismiss && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.body} numberOfLines={3}>
          {body}
        </Text>

        {data.device_name && (
          <View style={styles.deviceInfo}>
            <Feather name="smartphone" size={14} color="#666" />
            <Text style={styles.deviceText}>
              {data.device_name}
              {data.room &&
                data.floor &&
                ` • Room ${data.room}, Floor ${data.floor}`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Notification list component
export const NotificationList = ({
  notifications,
  onNotificationPress,
  onNotificationDismiss,
}) => {
  return (
    <View style={styles.listContainer}>
      {notifications.map((notification, index) => (
        <NotificationCard
          key={`${notification.id || index}-${notification.timestamp}`}
          notification={notification}
          onPress={() => onNotificationPress?.(notification)}
          onDismiss={() => onNotificationDismiss?.(notification)}
          style={index > 0 && styles.notificationSpacing}
        />
      ))}
    </View>
  );
};

// Simple notification icon for use in headers, badges, etc.
export const SimpleNotificationIcon = ({ type, size = 20 }) => {
  const iconConfig = {
    tamper: {
      name: "shield-alert-outline",
      family: "MaterialCommunityIcons",
      color: "#8B5CF6",
    },
    empty: {
      name: "archive-cancel-outline",
      family: "MaterialCommunityIcons",
      color: "#DC2626",
    },
    low: {
      name: "archive-outline",
      family: "MaterialCommunityIcons",
      color: "#FF9800",
    },
    full: {
      name: "archive",
      family: "MaterialCommunityIcons",
      color: "#4CAF50",
    },
    maintenance: { name: "wrench", family: "Feather", color: "#2196F3" },
    default: { name: "bell", family: "Feather", color: "#3AB0FF" },
  }[type] || { name: "bell", family: "Feather", color: "#3AB0FF" };

  return (
    <NotificationIcon
      name={iconConfig.name}
      family={iconConfig.family}
      color={iconConfig.color}
      size={size}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  body: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginLeft: 40, // Align with title (icon width + margin)
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 40, // Align with title
  },
  deviceText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationSpacing: {
    marginTop: 8,
  },
});

export default NotificationCard;
