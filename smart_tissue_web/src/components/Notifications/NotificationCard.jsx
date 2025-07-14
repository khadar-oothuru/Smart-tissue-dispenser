// NotificationCard.jsx
import React from "react";
import {
  Bell,
  Shield,
  Archive,
  Wrench,
  X,
  Smartphone,
  Clock,
  CheckCircle,
  Trash2,
} from "lucide-react";

// Icon component that renders the appropriate icon
const NotificationIcon = ({ name, color, size = 24 }) => {
  const iconProps = { size, color, className: "flex-shrink-0" };

  const iconMap = {
    bell: <Bell {...iconProps} />,
    "shield-alert": <Shield {...iconProps} />,
    archive: <Archive {...iconProps} />,
    wrench: <Wrench {...iconProps} />,
  };

  return iconMap[name] || <Bell {...iconProps} />;
};

// Enhanced notification card component
export const NotificationCard = ({
  notification,
  onPress,
  onDismiss,
  className = "",
}) => {
  const { title, body, data = {}, timestamp } = notification;
  const { iconName = "bell", iconColor = "#3AB0FF", type = "default" } = data;

  // Get notification type styling
  const getTypeStyle = (type) => {
    // Use neutral surface colors for all types, only border color changes
    const styles = {
      tamper: "bg-[var(--surface)] border-l-4 border-purple-600",
      empty: "bg-[var(--surface)] border-l-4 border-red-600",
      low: "bg-[var(--surface)] border-l-4 border-orange-500",
      full: "bg-[var(--surface)] border-l-4 border-green-500",
      maintenance: "bg-[var(--surface)] border-l-4 border-blue-500",
      default: "bg-[var(--surface)] border-l-4 border-gray-200",
    };
    return styles[type] || styles.default;
  };

  const getTitleColor = (type) => {
    const colors = {
      tamper: "text-purple-700",
      empty: "text-red-700",
      low: "text-orange-700",
      full: "text-green-700",
      maintenance: "text-blue-700",
      default: "text-gray-800",
    };
    return colors[type] || colors.default;
  };

  const typeStyle = getTypeStyle(type);
  const titleColor = getTitleColor(type);

  // Use CSS variable for surface color (set in global theme)
  return (
    <div
      className={`rounded-lg shadow-sm hover:shadow transition-shadow duration-200 ease-in-out cursor-pointer overflow-hidden ${typeStyle} ${className}`}
      style={{
        maxWidth: 360,
        background: "var(--surface, #fff)",
        transition: "box-shadow 0.2s cubic-bezier(0.4,0,0.2,1)",
      }}
      onClick={onPress}
    >
      <div className="p-3">
        <div className="flex items-start mb-1.5">
          <div className="mr-2 mt-0.5">
            <div className="w-8 h-8 rounded-md bg-white/70 flex items-center justify-center">
              <NotificationIcon name={iconName} color={iconColor} size={22} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-sm leading-tight ${titleColor}`}>
              {title}
            </h3>
            {timestamp && (
              <span className="text-xs text-gray-400 mt-0.5">
                {new Date(timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          )}
        </div>
        <p className="text-white text-xs leading-relaxed ml-10 line-clamp-3">
          {body}
        </p>
        {data.device_name && (
          <div className="flex items-center mt-2 ml-10 text-xs text-gray-500">
            <Smartphone size={12} className="mr-1" />
            <span>
              {data.device_name}
              {data.room &&
                data.floor &&
                ` • Room ${data.room}, Floor ${data.floor}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Notification list component
export const NotificationList = ({
  notifications,
  onNotificationPress,
  onNotificationDismiss,
}) => {
  return (
    <div className="space-y-3 p-4">
      {notifications.map((notification, index) => (
        <NotificationCard
          key={`${notification.id || index}-${notification.timestamp}`}
          notification={notification}
          onPress={() => onNotificationPress?.(notification)}
          onDismiss={() => onNotificationDismiss?.(notification)}
        />
      ))}
    </div>
  );
};

// Simple notification icon for use in headers, badges, etc.
export const SimpleNotificationIcon = ({ type, size = 20 }) => {
  const iconConfig = {
    tamper: { name: "shield-alert", color: "#8B5CF6" },
    empty: { name: "archive", color: "#DC2626" },
    low: { name: "archive", color: "#FF9800" },
    full: { name: "archive", color: "#4CAF50" },
    maintenance: { name: "wrench", color: "#2196F3" },
    default: { name: "bell", color: "#3AB0FF" },
  }[type] || { name: "bell", color: "#3AB0FF" };

  return <NotificationIcon {...iconConfig} size={size} />;
};

export default NotificationCard;
