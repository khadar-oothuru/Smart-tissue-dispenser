import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

const WiFiOptionsModal = ({
  visible,
  onClose,
  onWifiNetworkScan,
  onWifiQRScan,
}) => {
  const { themeColors, isDark } = useThemeContext();
  const styles = createStyles(themeColors, isDark);
  const scaleValue = React.useRef(new Animated.Value(0)).current;

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

  const handleWifiNetworkScan = () => {
    onClose();
    setTimeout(() => {
      onWifiNetworkScan();
    }, 300);
  };

  const handleWifiQRScan = () => {
    onClose();
    setTimeout(() => {
      onWifiQRScan();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              
              <MaterialCommunityIcons
                name="information"
                size={32}
                color={themeColors.primary}
              />
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          {/* WiFi Options */}
          <View style={styles.content}>
            <View style={styles.optionsContainer}>
              {/* Scan WiFi Networks Option */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleWifiNetworkScan}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialCommunityIcons
                    name="wifi"
                    size={28}
                    color={themeColors.primary}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Scan WiFi Networks</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={themeColors.text}
                />
              </TouchableOpacity>

              {/* Scan WiFi QR Code Option */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleWifiQRScan}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={28}
                    color={themeColors.primary}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Scan WiFi QR Code</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (themeColors, isDark) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContainer: {
      backgroundColor: themeColors.surface || "#ffffff",
      borderRadius: 20,
      width: width * 0.9,
      maxWidth: 450,
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
      borderColor: isDark ? themeColors.border : "transparent",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginBottom: 20,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark
        ? `${themeColors.primary}20`
        : `${themeColors.primary}15`,
      justifyContent: "center",
      alignItems: "center",
    },
    closeButton: {
      padding: 4,
    },
    content: {
      alignItems: "center",
      width: "100%",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: themeColors.heading || themeColors.text,
      textAlign: "center",
      marginBottom: 8,
      lineHeight: 26,
    },
    message: {
      fontSize: 16,
      color: themeColors.text,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 22,
      opacity: 0.8,
    },
    optionsContainer: {
      marginBottom: 20,
      width: "100%",
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.surface || "#ffffff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border || "#E0E0E0",
    },
    optionIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: `${themeColors.primary}15`,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: themeColors.text,
    },
    cancelButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    cancelButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default WiFiOptionsModal;
