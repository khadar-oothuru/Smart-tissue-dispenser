import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Default theme colors fallback
const defaultThemeColors = {
  surface: "#ffffff",
  heading: "#000000",
  text: "#333333",
  border: "#e0e0e0",
  primary: "#007AFF",
};

// Custom Alert Modal Component
const CustomAlert = ({
  visible,
  onClose,
  title,
  message,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  type = "warning",
  themeColors = defaultThemeColors,
  isDark = false,
  children,
}) => {
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  // Ensure themeColors has all required properties
  const safeThemeColors = {
    ...defaultThemeColors,
    ...themeColors,
  };

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleValue]);

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle",
          color: "#34C759",
          backgroundColor: "#E8F5E8",
        };
      case "error":
        return {
          icon: "close-circle",
          color: "#FF3B30",
          backgroundColor: "#FDF2F2",
        };
      case "info":
        return {
          icon: "information-circle",
          color: "#007AFF",
          backgroundColor: "#E8F4FD",
        };
      case "download":
        return {
          icon: "download-circle",
          color: "#FF9500",
          backgroundColor: "#FFF4E6",
        };
      default: // warning
        return {
          icon: "warning",
          color: "#FF9500",
          backgroundColor: "#FFF4E6",
        };
    }
  };
  const typeConfig = getTypeConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: safeThemeColors.surface,
              borderColor: isDark ? safeThemeColors.border : "transparent",
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Icon Section */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? `${typeConfig.color}20`
                    : typeConfig.backgroundColor,
                },
              ]}
            >
              <Ionicons
                name={typeConfig.icon}
                size={32}
                color={typeConfig.color}
              />
            </View>
            {/* Content Section */}
            <View style={styles.contentContainer}>
              <Text
                style={[styles.alertTitle, { color: safeThemeColors.heading }]}
              >
                {title}
              </Text>
              <Text
                style={[styles.alertMessage, { color: safeThemeColors.text }]}
              >
                {message}
              </Text>
            </View>
            {/* Actions Section or Custom Content */}
            {typeof children !== "undefined" && children ? (
              children
            ) : (
              <View style={styles.actionsContainer}>
                {secondaryAction && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.secondaryButton,
                      { borderColor: safeThemeColors.border },
                      (secondaryAction && primaryAction) ||
                      (secondaryAction && tertiaryAction)
                        ? styles.smallerButton
                        : null,
                    ]}
                    onPress={() => {
                      secondaryAction.onPress();
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.secondaryButtonText,
                        { color: safeThemeColors.text },
                      ]}
                    >
                      {secondaryAction.text}
                    </Text>
                  </TouchableOpacity>
                )}
                {primaryAction && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.primaryButton,
                      { backgroundColor: typeConfig.color },
                      (secondaryAction && primaryAction) ||
                      (primaryAction && tertiaryAction)
                        ? styles.smallerButton
                        : null,
                    ]}
                    onPress={() => {
                      primaryAction.onPress();
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.primaryButtonText,
                      ]}
                    >
                      {primaryAction.text}
                    </Text>
                  </TouchableOpacity>
                )}
                {tertiaryAction && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.primaryButton,
                      { backgroundColor: safeThemeColors.primary },
                      primaryAction || secondaryAction
                        ? styles.smallerButton
                        : null,
                    ]}
                    onPress={() => {
                      tertiaryAction.onPress();
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.primaryButtonText,
                      ]}
                    >
                      {tertiaryAction.text}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Info Alert Modal Component (simpler version)
const InfoAlert = ({
  visible,
  onClose,
  title,
  message,
  themeColors = defaultThemeColors,
  isDark = false,
}) => {
  return (
    <CustomAlert
      visible={visible}
      onClose={onClose}
      title={title}
      message={message}
      type="info"
      themeColors={themeColors}
      isDark={isDark}
    />
  );
};

// Download Options Alert Component
const DownloadOptionsAlert = ({
  visible,
  onClose,
  format,
  onShare,
  onDownload,
  themeColors = defaultThemeColors,
  isDark = false,
}) => {
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  // Ensure themeColors has all required properties
  const safeThemeColors = {
    ...defaultThemeColors,
    ...themeColors,
  };

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleValue]);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: safeThemeColors.surface,
              borderColor: isDark ? safeThemeColors.border : "transparent",
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* Close button in top-right corner */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: isDark ? "#FF3B3020" : "#FF3B3015",
              },
            ]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1}>
            {/* Icon Section */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? `${safeThemeColors.primary}20`
                    : `${safeThemeColors.primary}15`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="download"
                size={32}
                color={safeThemeColors.primary}
              />
            </View>
            {/* Content Section */}
            <View style={styles.contentContainer}>
              <Text
                style={[styles.alertTitle, { color: safeThemeColors.heading }]}
              >
                Export {format.toUpperCase()} Data
              </Text>
              <Text
                style={[styles.alertMessage, { color: safeThemeColors.text }]}
              >
                Choose how to save your analytics file:
              </Text>
            </View>
            {/* Actions Section */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  { backgroundColor: "#007AFF" },
                ]}
                onPress={() => {
                  onShare();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="share"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.actionButtonText, styles.primaryButtonText]}
                >
                  Share
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  { backgroundColor: safeThemeColors.primary },
                ]}
                onPress={() => {
                  onDownload();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="download"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.actionButtonText, styles.primaryButtonText]}
                >
                  Download
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  overlayTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 26,
  },
  alertMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 52,
  },
  smallerButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  primaryButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  secondaryButtonText: {
    // Color will be set dynamically
  },
});

export { CustomAlert, InfoAlert, DownloadOptionsAlert };
export default CustomAlert;
