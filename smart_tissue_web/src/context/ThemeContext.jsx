import React, { createContext, useContext, useEffect, useState } from "react";
import COLORS, {
  generateCSSVariables,
  commonStyles,
  fonts,
  breakpoints,
  spacing,
  shadows,
} from "../themes/theme";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("dark");
  const [colorScheme, setColorScheme] = useState("dark");

  useEffect(() => {
    const loadTheme = () => {
      try {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme) {
          setThemeState(storedTheme);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    // Set initial color scheme based on system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      setColorScheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    setColorScheme(mediaQuery.matches ? "dark" : "light");

    loadTheme();

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = async (newTheme) => {
    try {
      localStorage.setItem("theme", newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error("Error setting theme:", error);
    }
  };

  const isDark =
    theme === "dark" || (theme === "system" && colorScheme === "dark");

  // Get theme colors based on current theme
  const themeColors = isDark ? COLORS.dark : COLORS.light;

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    const cssVariables = generateCSSVariables(themeColors);

    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Add theme class to body for additional styling
    document.body.className = isDark ? "dark-theme" : "light-theme";
  }, [themeColors, isDark]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        themeColors,
        colorScheme,
        commonStyles,
        fonts,
        breakpoints,
        spacing,
        shadows,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
export default ThemeProvider;
