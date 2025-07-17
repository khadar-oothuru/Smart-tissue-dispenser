// themes/theme.js
const COLORS = {
  // Light Theme
  light: {
    background: "#F2F9FF",

    primary: "#7C3AED", // vivid purple
    logo: "#F59E42", // orange
    heading: "#22223B", // deep blue-black
    text: "#4A4E69", // muted indigo
    inputbg: "#F7F7FF", // very light lavender
    danger: "#E63946", // crimson red
    success: "#43AA8B", // teal green
    warning: "#FFB703", // amber yellow
    border: "#E9ECEF", // light gray
    surface: "#FFFFFF", // pure white
    card: "#FBFBFB",
    muted: "#8B8FA3",
    accent: "#9333EA",
    secondary: "#6B7280",
    info: "#3B82F6",
  },

  dark: {
    background: "#0B0E0F",
    surface: "#1A1D1E",
    logo: "#00FF85",
    // primary: "#3B82F6",
    primary: "#0096FF", // vivid purple

    heading: "#F8F9FA",
    text: "#E9ECEF",
    tab: "#2C2F30",
    inputbg: "#1A1D1E",
    border: "#495057",
    danger: "#FF6B6B",
    success: "#4ADE80",
    warning: "#FFD93D",
    card: "#1F2937",
    muted: "#9CA3AF",
    accent: "#A855F7",
    secondary: "#6B7280",
    info: "#60A5FA",
  },
};

// CSS variables for dynamic theming
export const generateCSSVariables = (colors) => {
  const cssVars = {};

  // Color variables
  Object.entries(colors).forEach(([key, value]) => {
    cssVars[`--color-${key}`] = value;
  });

  // Shadow variables
  Object.entries(shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });

  // Spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });

  // Font variables
  Object.entries(fonts).forEach(([key, value]) => {
    cssVars[`--font-${key}`] = value;
  });

  // Breakpoint variables
  Object.entries(breakpoints).forEach(([key, value]) => {
    cssVars[`--breakpoint-${key}`] = value;
  });

  return cssVars;
};

// Common styles that can be reused
export const commonStyles = {
  card: {
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    borderWidth: "1px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  button: {
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  input: {
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    border: "1px solid",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  metric: {
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "8px",
    borderWidth: "1px",
  },
};

// Font configuration
export const fonts = {
  heading:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"Fira Code", "Consolas", "Monaco", monospace',
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Spacing scale
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
  40: "160px",
  48: "192px",
  56: "224px",
  64: "256px",
};

// Shadow definitions
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
};

export default COLORS;
