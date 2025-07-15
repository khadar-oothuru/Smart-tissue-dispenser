import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

import useTheme from "../../hooks/useThemeContext";
import COLORS from "../../themes/theme";

const AccessDenied = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  let themeColors;
  let isDark = false;
  try {
    const theme = useTheme();
    if (theme && theme.colors) {
      themeColors = theme.colors;
    }
    if (typeof theme.isDark === "boolean") {
      isDark = theme.isDark;
    }
  } catch {
    // fallback to palette from theme.js
    themeColors = COLORS[isDark ? "dark" : "light"];
  }
  if (!themeColors) {
    themeColors = COLORS[isDark ? "dark" : "light"];
  }

  const safeThemeColors = themeColors;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? `linear-gradient(135deg, #18181b 0%, #27272a 100%)`
          : undefined,
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        color: safeThemeColors.heading,
        padding: 0,
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          background: safeThemeColors.surface,
          borderRadius: 20,
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.25)"
            : "0 8px 32px rgba(30,41,59,0.10)",
          padding: "44px 32px 32px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 320,
          maxWidth: 400,
          width: "100%",
          border: isDark ? `1.5px solid #333` : undefined,
          transition: "background 0.3s, box-shadow 0.3s",
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          style={{ marginBottom: 20 }}
        >
          <circle
            cx="12"
            cy="12"
            r="12"
            fill={safeThemeColors.primary}
            fillOpacity={isDark ? "0.18" : "0.12"}
          />
          <path
            d="M9.17 9.17a3 3 0 0 1 5.66 0m-7.07 7.07a8 8 0 1 1 11.32 0m-11.32 0A8 8 0 0 1 12 4a8 8 0 0 1 5.66 12.24m-11.32 0L12 20l5.66-3.76"
            stroke={safeThemeColors.primary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            marginBottom: 12,
            color: safeThemeColors.primary,
            letterSpacing: 0.5,
            textShadow: isDark
              ? "0 2px 8px rgba(239,68,68,0.18)"
              : "0 2px 8px rgba(239,68,68,0.08)",
            transition: "color 0.3s",
          }}
        >
          Access Denied
        </h1>
        <p
          style={{
            fontSize: 17,
            color: safeThemeColors.text,
            marginBottom: 28,
            textAlign: "center",
            lineHeight: 1.6,
            fontWeight: 500,
            opacity: isDark ? 0.85 : 1,
            transition: "color 0.3s, opacity 0.3s",
          }}
        >
          You do not have permission to access this web app.
          <br />
          <span style={{ color: safeThemeColors.primary, fontWeight: 600 }}>
            Please contact your administrator if you believe this is a mistake.
          </span>
        </p>
        <button
          onClick={handleLogout}
          style={{
            background: isDark
              ? safeThemeColors.primary
              : `linear-gradient(90deg, ${safeThemeColors.primary} 60%, ${safeThemeColors.secondary} 100%)`,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "13px 36px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: isDark
              ? "0 2px 8px rgba(239,68,68,0.18)"
              : "0 2px 8px rgba(239,68,68,0.10)",
            transition: "background 0.2s, transform 0.1s",
            outline: "none",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = safeThemeColors.primary)
          }
          onFocus={(e) =>
            (e.currentTarget.style.background = safeThemeColors.primary)
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = isDark
              ? safeThemeColors.primary
              : `linear-gradient(90deg, ${safeThemeColors.primary} 60%, ${safeThemeColors.secondary} 100%)`)
          }
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
