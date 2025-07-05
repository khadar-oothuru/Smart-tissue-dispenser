import * as Font from "expo-font";

export const loadFonts = async () => {
  try {
    await Font.loadAsync({
      "Ubuntu-Regular": require("../assets/fonts/Ubuntu-Regular.ttf"),
      "Ubuntu-Bold": require("../assets/fonts/Ubuntu-Bold.ttf"),
      "Ubuntu-Medium": require("../assets/fonts/Ubuntu-Medium.ttf"),
      "Ubuntu-Light": require("../assets/fonts/Ubuntu-Light.ttf"),
      "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
    });
    // Fonts loaded successfully
  } catch (_error) {
    // Error loading fonts
  }
};

// Font family constants for consistent usage throughout the app
export const FONTS = {
  ubuntu: {
    regular: "Ubuntu-Regular",
    bold: "Ubuntu-Bold",
    medium: "Ubuntu-Medium",
    light: "Ubuntu-Light",
  },
  spaceMono: {
    regular: "SpaceMono-Regular",
  },
};

// Helper function to get font family based on weight
export const getUbuntuFont = (weight = "regular") => {
  switch (weight) {
    case "light":
      return FONTS.ubuntu.light;
    case "regular":
    case "normal":
      return FONTS.ubuntu.regular;
    case "medium":
      return FONTS.ubuntu.medium;
    case "bold":
    case "700":
      return FONTS.ubuntu.bold;
    default:
      return FONTS.ubuntu.regular;
  }
};
