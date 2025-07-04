// components/Analytics/PeriodSelector.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext'; // Update the path as needed

const PeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const { themeColors } = useThemeContext();
  
  const periods = [
    { value: 'weekly', label: 'Week' },
    { value: 'monthly', label: 'Month' },
    { value: 'quarterly', label: 'Quarter' },
    { value: 'yearly', label: 'Year' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.inputbg }]}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.value}
          style={[
            styles.periodButton,
            selectedPeriod === period.value && { backgroundColor: themeColors.primary },
          ]}
          onPress={() => onPeriodChange(period.value)}
        >
          <Text
            style={[
              styles.periodText,
              { color: themeColors.text },
              selectedPeriod === period.value && styles.selectedPeriodText,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedPeriodText: {
    color: '#fff',
  },
});

export default PeriodSelector;