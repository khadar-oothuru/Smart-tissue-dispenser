import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../hooks/useThemeContext";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      className="theme-toggle-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        boxShadow: "none",
        padding: 0,
        margin: 0,
        minWidth: 0,
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          minWidth: "80px",
          minHeight: "32px",
          width: "80px",
          height: "32px",
        }}
      >
        {/* Toggle Track */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-8 rounded-full theme-toggle-track"
          style={{
            background: "var(--color-surface)",
            border: "1.5px solid var(--color-border)",
            boxShadow: "none",
            zIndex: 0,
            transition: "background 0.3s, border 0.3s",
          }}
        />
        {/* Toggle Thumb (animated, with single icon and label) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 theme-toggle-thumb flex items-center justify-center`}
          style={{
            width: "36px",
            height: "28px",
            borderRadius: "9999px",
            background:
              theme === "dark"
                ? "linear-gradient(145deg, var(--color-primary), var(--color-background))"
                : "linear-gradient(145deg, var(--color-primary), var(--color-accent))",
            boxShadow: "0 1px 4px 0 rgb(0 0 0 / 0.10)",
            border: `2px solid var(--color-primary)`,
            transition: "left 0.3s, right 0.3s, background 0.3s",
            left: theme === "light" ? "3px" : "calc(50% + 1px)",
            right: "unset",
            zIndex: 2,
            color: "var(--color-surface)",
            justifyContent: "center",
            alignItems: "center",
            padding: 0,
          }}
        >
          {theme === "dark" ? (
            <Moon size={16} color="var(--color-surface)" />
          ) : (
            <Sun size={16} color="var(--color-surface)" />
          )}
        </div>
        {/* Toggle Buttons */}
        {themeOptions.map((option, idx) => {
          const Icon = option.icon;
          const isActive = theme === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`relative z-10 flex items-center justify-center rounded-full theme-toggle-btn ${
                isActive ? "active" : ""
              }`}
              style={{
                background: "none",
                color: isActive ? "var(--color-primary)" : "var(--color-text)",
                fontWeight: isActive ? 700 : 500,
                border: "none",
                minWidth: "32px",
                minHeight: "28px",
                margin: idx === 0 ? "0 0 0 1px" : "0 1px 0 0",
                position: "relative",
                outline: "none",
                boxShadow: "none",
                cursor: isActive ? "default" : "pointer",
                transition: "color 0.2s",
                zIndex: 3,
                padding: 0,
              }}
              title={`Switch to ${option.label.toLowerCase()} theme`}
              aria-label={`Switch to ${option.label.toLowerCase()} theme`}
              aria-pressed={isActive}
              disabled={isActive}
            >
              {/* Only show icon if not active, so thumb shows the active icon */}
              {!isActive && <Icon size={14} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Define CSS for toggle animation and style
const style = document.createElement("style");
style.textContent = `
  .theme-toggle-btn.active {
    color: var(--color-primary);
    font-weight: 700;
  }
  .theme-toggle-thumb {
    box-shadow: 0 1px 4px 0 rgb(0 0 0 / 0.10);
    transition: left 0.3s, right 0.3s, background 0.3s;
  }
  .theme-toggle-track {
    transition: background 0.3s, border 0.3s;
  }
`;
document.head.appendChild(style);

export default ThemeToggle;
