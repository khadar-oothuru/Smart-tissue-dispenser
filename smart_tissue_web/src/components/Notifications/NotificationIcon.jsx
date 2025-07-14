// NotificationIcon.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import useNotificationStore from "../../store/useNotificationStore";

export default function NotificationIcon({
  color = "#333",
  hoverColor = "#007bff",
  onClick,
  disableNavigate = false,
}) {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [isHovered, setIsHovered] = React.useState(false);
  // If hoverColor is a CSS variable, resolve it at render time
  const resolvedHoverColor = hoverColor?.startsWith("var(")
    ? getComputedStyle(document.documentElement).getPropertyValue(
        hoverColor.replace(/var\(|\)/g, "")
      ) || "#007bff"
    : hoverColor;

  useEffect(() => {
    if (accessToken) {
      fetchUnreadCount(accessToken);
      // Refresh count every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount(accessToken);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [accessToken, fetchUnreadCount]);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (!disableNavigate) {
      navigate("/admin/notifications");
    }
  };

  return (
    <button
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ outline: "none", border: "none", background: "none" }}
    >
      <Bell size={24} color={isHovered ? resolvedHoverColor : color} />
      {unreadCount > 0 && (
        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </button>
  );
}
