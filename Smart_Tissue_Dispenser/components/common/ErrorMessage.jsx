// components/Common/ErrorMessage.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

const ErrorMessage = ({ error, onDismiss }) => {
  const { themeColors, isDark } = useThemeContext();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: isDark ? '#3D1F1F' : '#FFE5E5',
      }
    ]}>
      <Text style={[styles.errorText, { color: '#FF3B30' }]}>
        {error}
      </Text>
      <TouchableOpacity onPress={onDismiss}>
        <Text style={styles.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  dismissText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default ErrorMessage;