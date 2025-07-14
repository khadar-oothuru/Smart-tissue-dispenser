import React from "react";
import { User, Shield, Trash2, UserCog } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const UserItem = ({ user, onRoleChange, onDelete, onViewProfile }) => {
  const { themeColors } = useTheme();
  const [imageError, setImageError] = React.useState(false);

  // Reset image error when user changes
  React.useEffect(() => {
    setImageError(false);
  }, [user?.id]);

  return (
    <div
      className="rounded-3xl border shadow-2xl backdrop-blur-xl p-6 flex flex-col justify-between transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: themeColors.glassCardBg || "rgba(40,40,60,0.45)",
        borderColor: themeColors.glassBorder || "rgba(200,200,255,0.18)",
        boxShadow:
          themeColors.glassShadow || "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
        minHeight: 180,
      }}
    >
      <div className="flex items-center">
        {/* Avatar */}
        <div className="relative mr-4">
          {user.profile_picture && !imageError ? (
            <img
              src={user.profile_picture}
              alt={user.full_name || user.username}
              className="w-14 h-14 rounded-full object-cover border-2"
              style={{ borderColor: themeColors.inputBorder || "#444" }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: themeColors.inputBg || "rgba(255,255,255,0.18)",
              }}
            >
              <User
                className="h-6 w-6"
                style={{ color: themeColors.inputIcon || "#b0b8c1" }}
              />
            </div>
          )}
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
            style={{
              background: user.is_active
                ? themeColors.success || "#22c55e"
                : themeColors.error || "#ef4444",
              borderColor: themeColors.glassCardBg || "#fff",
            }}
          />
        </div>

        {/* User Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3
              className="text-lg font-semibold"
              style={{ color: themeColors.text || "#fff" }}
            >
              {user.full_name || user.username}
            </h3>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background:
                  user.role === "admin"
                    ? themeColors.roleAdminBg || "rgba(120, 80, 220, 0.18)"
                    : themeColors.roleUserBg || "rgba(0, 122, 255, 0.18)",
                color:
                  user.role === "admin"
                    ? themeColors.roleAdminText || "#a78bfa"
                    : themeColors.roleUserText || "#60a5fa",
              }}
            >
              {user.role === "admin" ? (
                <Shield className="h-3 w-3 mr-1" />
              ) : (
                <User className="h-3 w-3 mr-1" />
              )}
              {user.role.toUpperCase()}
            </span>
          </div>
          <p
            className="text-sm mb-1"
            style={{ color: themeColors.textSecondary || "#b0b8c1" }}
          >
            {user.email}
          </p>
          <p
            className="text-xs"
            style={{ color: themeColors.textTertiary || "#8a8a8a" }}
          >
            Joined{" "}
            {user.date_joined_formatted ||
              new Date(user.date_joined).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => onViewProfile(user)}
            className="p-2 rounded-full transition-colors duration-200 shadow-md"
            style={{
              background: themeColors.actionViewBg || "#2563eb",
              color: themeColors.actionViewText || "#fff",
            }}
            title="View Profile"
          >
            <User className="h-4 w-4" />
          </button>
          <button
            onClick={() => onRoleChange(user)}
            className="p-2 rounded-full transition-colors duration-200 shadow-md"
            style={{
              background: themeColors.actionRoleBg || "#f59e42",
              color: themeColors.actionRoleText || "#fff",
            }}
            title="Change Role"
          >
            <UserCog className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-2 rounded-full transition-colors duration-200 shadow-md"
            style={{
              background: themeColors.actionDeleteBg || "#ef4444",
              color: themeColors.actionDeleteText || "#fff",
            }}
            title="Delete User"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserItem;
