import { StyleSheet } from "react-native";
import { getUbuntuFont } from "../utils/fonts";

// themes/theme.js
const COLORS = {
  // Light Theme
  light: {
    background: "#F4F6FB", // soft cool white
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
  },

  dark: {
    background: "#0B0E0F",
    surface: "#1A1D1E",
    logo: "#00FF85",

    primary: "#F4631E",
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

export default COLORS;
export const metricStyles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: getUbuntuFont("medium"),
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontFamily: getUbuntuFont("bold"),
    letterSpacing: -0.8,
  },
  unit: {
    fontSize: 16,
    marginLeft: 4,
    fontFamily: getUbuntuFont("medium"),
    opacity: 0.7,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  trendIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  trendArrow: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: getUbuntuFont("bold"),
    includeFontPadding: false,
  },
  trendValue: {
    fontSize: 13,
    fontFamily: getUbuntuFont("bold"),
  },
});
