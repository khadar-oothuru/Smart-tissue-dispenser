import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { statStyles } from './styles';

export const StatCard = ({ value, label, icon, color }) => {
  const { themeColors, isDark } = useThemeContext();
  return (
    <View style={[statStyles.container, { backgroundColor: themeColors.inputbg }]}>
      {icon && <View style={statStyles.iconContainer}>{icon}</View>}
      <Text style={[statStyles.value, { color: color || themeColors.heading }]}>{value}</Text>
      <Text style={[statStyles.label, { color: themeColors.text }]}>{label}</Text>
    </View>
  );
};
