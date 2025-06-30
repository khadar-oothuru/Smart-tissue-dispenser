import { StyleSheet } from 'react-native';

export const deviceListStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 20,
      flexGrow: 1,
    },
    refreshingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      backgroundColor: isDark ? colors.background + "CC" : "#FFFFFFCC",
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 68, 68, 0.15)" : "#FEE2E2",
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FF4444" + "30",
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: "#FF4444",
      marginLeft: 12,
      marginRight: 12,
    },
    retryButton: {
      backgroundColor: "#FF4444",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },
    deviceList: {
      paddingBottom: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.heading,
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
      textAlign: "center",
      marginBottom: 20,
    },
    refreshButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "15",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    refreshButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },
    loadingMore: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
      gap: 12,
    },
    loadingMoreText: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
    },
  });