// components/Common/EmptyState.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';

const EmptyState = ({ icon, message }) => {
  const { themeColors } = useThemeContext();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name={icon} 
        size={64} 
        color={themeColors.text} 
      />
      <Text style={[styles.text, { color: themeColors.text }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default EmptyState;