import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../themes/theme"; // Import your color definitions

// Web-compatible storage
const Storage = Platform.OS === 'web'
  ? {
      getItem: async (key) => localStorage.getItem(key),
      setItem: async (key, value) => localStorage.setItem(key, value),
      removeItem: async (key) => localStorage.removeItem(key),
    }
  : {
      getItem: AsyncStorage.getItem,
      setItem: AsyncStorage.setItem,
      removeItem: AsyncStorage.removeItem,
    };

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("dark");
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await Storage.getItem("theme");
        if (storedTheme) setThemeState(storedTheme);
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    // Web compatibility for appearance changes
    if (Platform.OS === 'web') {
      // For web, we can listen to the system theme change
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
          setColorScheme(e.matches ? 'dark' : 'light');
        };
        
        mediaQuery.addEventListener('change', handleChange);
        setColorScheme(mediaQuery.matches ? 'dark' : 'light');
        
        loadTheme();
        
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        loadTheme();
      }
    } else {
      // Native platform
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setColorScheme(colorScheme);
      });

      loadTheme();

      return () => subscription.remove();
    }
  }, []);

  const setTheme = async (newTheme) => {
    try {
      await Storage.setItem("theme", newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error("Error setting theme:", error);
    }
  };

  const isDark =
    theme === "dark" || (theme === "system" && colorScheme === "dark");

  // Add fallback colors in case COLORS import fails
  const fallbackColors = {
    light: {
      background: "#ffffff",
      surface: "#f5f5f5",
      primary: "#3AB0FF",
      heading: "#161e32",
      text: "#7b8493",
      inputbg: "rgb(234, 244, 246)",
      danger: "#FF3B30",
      success: "#34C759",
      warning: "#FF9500",
      border: "#e0e0e0",
    },
    dark: {
      background: "#0B0E0F",
      surface: "#1A1D1E",
      primary: "#FF6B35",
      heading: "#F8F9FA",
      text: "#E9ECEF",
      tab: "#2C2F30",
      inputbg: "#1A1D1E",
      border: "#495057",
      danger: "#FF6B6B",
      success: "#4ADE80",
      warning: "#FFD93D",
    },
  };
  const themeColors = isDark
    ? COLORS?.dark || fallbackColors.dark
    : COLORS?.light || fallbackColors.light;

  // Additional safety check to ensure all required properties exist
  const safeThemeColors = {
    background:
      themeColors.background ||
      fallbackColors[isDark ? "dark" : "light"].background,
    surface:
      themeColors.surface || fallbackColors[isDark ? "dark" : "light"].surface,
    primary:
      themeColors.primary || fallbackColors[isDark ? "dark" : "light"].primary,
    heading:
      themeColors.heading || fallbackColors[isDark ? "dark" : "light"].heading,
    text: themeColors.text || fallbackColors[isDark ? "dark" : "light"].text,
    inputbg:
      themeColors.inputbg || fallbackColors[isDark ? "dark" : "light"].inputbg,
    border:
      themeColors.border || fallbackColors[isDark ? "dark" : "light"].border,
    danger:
      themeColors.danger || fallbackColors[isDark ? "dark" : "light"].danger,
    success:
      themeColors.success || fallbackColors[isDark ? "dark" : "light"].success,
    warning:
      themeColors.warning || fallbackColors[isDark ? "dark" : "light"].warning,
    ...(themeColors.tab && { tab: themeColors.tab }), // Include tab if it exists
  };
  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, isDark, themeColors: safeThemeColors }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    console.warn("useThemeContext must be used within a ThemeProvider");
    // Return fallback values if context is not available
    return {
      theme: "light",
      setTheme: () => {},
      isDark: false,
      themeColors: {
        background: "#ffffff",
        surface: "#f5f5f5",
        primary: "#3AB0FF",
        heading: "#161e32",
        text: "#7b8493",
        inputbg: "rgb(234, 244, 246)",
        danger: "#FF3B30",
        success: "#34C759",
        warning: "#FF9500",
        border: "#e0e0e0",
      },
    };
  }

  return context;
};
