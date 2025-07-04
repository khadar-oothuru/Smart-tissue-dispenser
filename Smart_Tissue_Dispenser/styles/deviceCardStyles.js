import { StyleSheet } from 'react-native';
import { createShadow } from '../utils/webStyles';

export const deviceCardStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    touchable: {
      borderRadius: 20,
    },
    card: {
      backgroundColor: isDark ? colors.surface : "#FFFFFF",
      borderRadius: 20,
      overflow: "hidden",
      ...createShadow({
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.25 : 0.1,
        shadowRadius: 16,
        elevation: 8,
      }),
      borderWidth: 1,
      borderColor: isDark ? colors.text + '08' : '#E5E7EB',
    },
    statusGradientBar: {
      height: 4,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 20,
      paddingBottom: 16,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      position: 'relative',
    },
    connectionDot: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: isDark ? colors.surface : '#FFFFFF',
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.heading,
      marginBottom: 4,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    deviceLocation: {
      fontSize: 13,
      color: colors.text,
      marginLeft: 4,
      opacity: 0.8,
    },
    deviceId: {
      fontSize: 11,
      color: colors.text,
      opacity: 0.6,
      fontFamily: 'monospace',
    },
    statusContainer: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 4,
      marginBottom: 4,
    },
    statusText: {
      fontSize: 13,
      fontWeight: "600",
    },
    healthIndicator: {
      alignItems: 'center',
      minWidth: 40,
    },
    healthScore: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.heading,
    },
    healthLabel: {
      fontSize: 10,
      color: colors.text,
      opacity: 0.6,
    },
    statsGrid: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 12,
    },
    progressContainer: {
      marginHorizontal: 20,
      marginBottom: 16,
    },
    progressBar: {
      height: 3,
      backgroundColor: isDark ? colors.text + '20' : '#E5E7EB',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
  });