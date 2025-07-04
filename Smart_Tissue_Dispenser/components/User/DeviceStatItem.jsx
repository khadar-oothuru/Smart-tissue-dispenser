import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';

const DeviceStatItem = ({ icon, value, label, color }) => {
  const { themeColors, isDark } = useThemeContext();
  const styles = createStyles(themeColors, isDark);

  return (
    <View style={styles.statItem}>
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "15" }]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: themeColors.heading }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    statItem: {
      flex: 1,
      backgroundColor: isDark ? colors.inputbg : colors.inputbg,
      borderRadius: 16,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.text + "10",
    },
    statIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: colors.text,
      textAlign: "center",
      opacity: 0.7,
    },
  });

export default DeviceStatItem;