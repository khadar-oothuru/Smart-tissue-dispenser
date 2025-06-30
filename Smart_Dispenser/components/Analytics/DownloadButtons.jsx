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
          styles.buttonWrapper,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.downloadButton,
            {
              backgroundColor: isThisButtonBusy
                ? gradientColors[1]
                : gradientColors[0],
              borderColor: isDark ? gradientColors[1] : gradientColors[0],
              shadowColor: isDark ? "#000" : gradientColors[0],
              opacity: isAnyActive && !isThisButtonBusy ? 0.3 : 1,
              borderWidth: isThisButtonBusy ? 2 : 1,
            },
          ]}
          onPress={() => handleDownloadWithAnimation(format)}
          disabled={isAnyActive}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            {isThisButtonBusy ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.loadingSpinner}
                />
                <Text style={[styles.loadingText, { color: "#fff" }]}>
                  {isCurrentProcessing || downloading
                    ? "Processing..."
                    : "Preparing..."}
                </Text>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  <MaterialCommunityIcons name={icon} size={16} color="#fff" />
                </View>
                <Text style={styles.downloadButtonText}>{label}</Text>
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
        styles.downloadContainer,
        { backgroundColor: themeColors.background },
      ]}
    >
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons
          name="download-outline"
          size={20}
          color={themeColors.primary}
          style={styles.headerIcon}
        />
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Export Data
        </Text>
      </View>
      <Text style={[styles.sectionSubtitle, { color: themeColors.text }]}>
        Download your analytics data in your preferred format
      </Text>
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
            styles.loadingIndicator,
            { backgroundColor: themeColors.surface },
          ]}
        >
          <MaterialCommunityIcons
            name="download"
            size={14}
            color={themeColors.primary}
          />
          <Text
            style={[styles.loadingIndicatorText, { color: themeColors.text }]}
          >
            {getStatusMessage()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
