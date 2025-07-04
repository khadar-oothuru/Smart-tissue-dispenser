import { MaterialCommunityIcons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../../context/ThemeContext";

const DownloadButtons = ({ onDownload, isLoading, downloading, cancelled }) => {
  const { themeColors, isDark } = useThemeContext();
  const [activeFormat, setActiveFormat] = useState(null);
  const [processingFormat, setProcessingFormat] = useState(null);
  const [scaleValues] = useState({
    csv: new Animated.Value(1),
    json: new Animated.Value(1),
    pdf: new Animated.Value(1),
  });

  // Reset states when downloading is complete or cancelled
  useEffect(() => {
    if (!downloading && !isLoading) {
      setActiveFormat(null);
      setProcessingFormat(null);
    }
  }, [downloading, isLoading]);
  // Reset states immediately when cancelled
  useEffect(() => {
    if (cancelled) {
      console.log("Download cancelled - resetting button states");
      setActiveFormat(null);
      setProcessingFormat(null);
    }
  }, [cancelled]);
  // Additional effect to handle state reset when download stops
  useEffect(() => {
    if (!downloading && (activeFormat || processingFormat)) {
      console.log("Download stopped - resetting button states");
      setTimeout(() => {
        setActiveFormat(null);
        setProcessingFormat(null);
      }, 100);
    }
  }, [downloading, activeFormat, processingFormat]);

  // Force immediate state reset when cancelled prop changes
  useEffect(() => {
    if (cancelled && (activeFormat || processingFormat)) {
      console.log("Forcing immediate reset due to cancellation");
      setActiveFormat(null);
      setProcessingFormat(null);
      // Force a re-render
      setTimeout(() => {
        setActiveFormat(null);
        setProcessingFormat(null);
      }, 0);
    }
  }, [cancelled, activeFormat, processingFormat]);

  // Enhanced alert function with theme support and better styling
  const showStyledAlert = (title, message, buttons = [], type = "info") => {
    // Add appropriate prefix based on alert type for better user experience
    let prefix = "";
    if (type === "error") prefix = "Error: ";
    else if (type === "success") prefix = "Success: ";
    else if (type === "warning") prefix = "Warning: ";
    else if (type === "info") prefix = "Info: ";
    else if (type === "loading") prefix = "Processing: ";

    const formattedTitle = prefix + title;

    Alert.alert(formattedTitle, message, buttons, {
      cancelable: true,
      userInterfaceStyle: isDark ? "dark" : "light",
    });
  }; // Function to reset button states immediately
  const resetButtonStates = () => {
    console.log("Manually resetting button states");
    setActiveFormat(null);
    setProcessingFormat(null);
  };
  const handleDownloadWithAnimation = async (format) => {
    // If download was cancelled, reset states first
    if (cancelled) {
      resetButtonStates();
      return;
    }

    // Prevent multiple clicks
    if (activeFormat || processingFormat || isLoading || downloading) {
      showStyledAlert(
        "Download in Progress",
        "Another download is already in progress. Please wait for it to complete.",
        [{ text: "Got it!", style: "default" }],
        "loading"
      );
      return;
    }

    // Set active format immediately
    setActiveFormat(format);
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleValues[format], {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValues[format], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Set processing state after animation starts
      setTimeout(() => setProcessingFormat(format), 150);

      // Call onDownload and handle the result
      const result = await onDownload(format);

      // If download was cancelled or failed, reset states
      if (result === false || result === null || result === undefined) {
        resetButtonStates();
      }
    } catch (error) {
      console.error("Download error:", error);

      // Reset states immediately on error
      resetButtonStates(); // Only show error alert if it's not a user cancellation
      if (
        !error.message?.includes("cancel") &&
        !error.message?.includes("abort")
      ) {
        showStyledAlert(
          "Download Failed",
          error.message ||
            "An error occurred while downloading. Please try again.",
          [{ text: "OK", style: "default" }],
          "error"
        );
      }
    }
  };
  const renderDownloadButton = (format, icon, label, gradientColors) => {
    const isCurrentActive = activeFormat === format;
    const isCurrentProcessing = processingFormat === format;
    const isAnyActive =
      activeFormat !== null ||
      processingFormat !== null ||
      isLoading ||
      (downloading && !cancelled);
    const isThisButtonBusy =
      (isCurrentActive ||
        isCurrentProcessing ||
        (downloading && processingFormat === format)) &&
      !cancelled;

    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleValues[format] }] },
          styles.glassButtonWrapper,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.glassDownloadButton,
            {
              backgroundColor: isDark
                ? themeColors.surface
                : themeColors.background,
              borderColor: isThisButtonBusy
                ? gradientColors[1]
                : isDark
                ? themeColors.border
                : "rgba(255, 255, 255, 0.3)",
              shadowColor: isDark ? "#000" : gradientColors[0],
              opacity: isAnyActive && !isThisButtonBusy ? 0.3 : 1,
              borderWidth: isThisButtonBusy ? 2 : 1,
            },
          ]}
          onPress={() => handleDownloadWithAnimation(format)}
          disabled={isAnyActive}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isThisButtonBusy
                ? [gradientColors[1], gradientColors[0]]
                : isDark
                ? [themeColors.surface, themeColors.background]
                : [gradientColors[0] + "15", gradientColors[0] + "05"]
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.glassButtonContent}>
            {isThisButtonBusy ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={isThisButtonBusy ? "#fff" : gradientColors[0]}
                  style={styles.loadingSpinner}
                />
                <Text
                  style={[
                    styles.loadingText,
                    { color: isThisButtonBusy ? "#fff" : gradientColors[0] },
                  ]}
                >
                  {isCurrentProcessing || downloading
                    ? "Processing..."
                    : "Preparing..."}
                </Text>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.glassIconContainer,
                    { backgroundColor: gradientColors[0] + "18" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={18}
                    color={gradientColors[0]}
                  />
                </View>
                <Text
                  style={[
                    styles.glassDownloadButtonText,
                    { color: gradientColors[0] },
                  ]}
                >
                  {label}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  const getStatusMessage = () => {
    if (processingFormat === "csv") return "Processing CSV download...";
    if (processingFormat === "json") return "Processing JSON download...";
    if (processingFormat === "pdf") return "Processing PDF download...";
    if (activeFormat === "csv") return "Preparing CSV download...";
    if (activeFormat === "json") return "Preparing JSON download...";
    if (activeFormat === "pdf") return "Preparing PDF download...";
    if (downloading) return "Finalizing download...";
    return "Preparing download...";
  };

  return (
    <View
      style={[
        styles.glassDownloadContainer,
        {
          backgroundColor: isDark
            ? themeColors.surface
            : themeColors.background,
          borderColor: isDark ? themeColors.border : "rgba(255, 255, 255, 0.2)",
        },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? [themeColors.surface, themeColors.background]
            : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.6)"]
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.glassHeaderContainer}>
        <View
          style={[
            styles.glassHeaderIcon,
            {
              backgroundColor: themeColors.primary + "18",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="download-outline"
            size={24}
            color={themeColors.primary}
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text
            style={[styles.glassSectionTitle, { color: themeColors.heading }]}
          >
            Export Data
          </Text>
          <Text
            style={[
              styles.glassSectionSubtitle,
              { color: themeColors.text + "99" },
            ]}
          >
            Download analytics in your preferred format
          </Text>
        </View>
      </View>
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonsRow}>
          {renderDownloadButton("csv", "file-excel", "CSV", [
            "#34C759",
            "#30B351",
          ])}

          {renderDownloadButton("json", "code-json", "JSON", [
            "#007AFF",
            "#0056CC",
          ])}

          {renderDownloadButton("pdf", "file-pdf-box", "PDF", [
            "#FF3B30",
            "#D70015",
          ])}
        </View>
      </View>
      {(activeFormat || processingFormat || downloading || isLoading) && (
        <View
          style={[
            styles.glassLoadingIndicator,
            {
              backgroundColor: isDark
                ? themeColors.surface
                : themeColors.background,
              borderColor: isDark
                ? themeColors.border
                : "rgba(255, 255, 255, 0.3)",
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? [themeColors.surface, themeColors.background]
                : [themeColors.primary + "15", themeColors.primary + "05"]
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <MaterialCommunityIcons
            name="download"
            size={16}
            color={themeColors.primary}
          />
          <Text
            style={[
              styles.glassLoadingIndicatorText,
              { color: themeColors.text },
            ]}
          >
            {getStatusMessage()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Glass-Style Download Container
  glassDownloadContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
  },
  glassHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  glassHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerTextContainer: {
    flex: 1,
  },
  glassSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  glassSectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
    lineHeight: 20,
  },

  // Glass-Style Buttons
  glassButtonWrapper: {
    flex: 1,
  },
  glassDownloadButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 52,
  },
  glassButtonContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  glassIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  glassDownloadButtonText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  },

  // Glass-Style Loading Indicator
  glassLoadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  glassLoadingIndicatorText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    letterSpacing: -0.1,
  },

  // Legacy styles (keeping for compatibility)
  downloadContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonsContainer: {
    gap: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  buttonWrapper: {
    flex: 1,
  },
  downloadButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 44,
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  loadingSpinner: {
    // No margin needed due to gap
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: "center",
  },
  loadingIndicatorText: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 6,
  },
});

DownloadButtons.propTypes = {
  onDownload: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  downloading: PropTypes.bool,
  cancelled: PropTypes.bool,
};

DownloadButtons.defaultProps = {
  isLoading: false,
  downloading: false,
  cancelled: false,
};

export default DownloadButtons;
