// components/ScreenWrapper.js
import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useThemeContext } from "../../context/ThemeContext"

export const ScreenWrapper = ({ children, scrollable = true }) => {
  const { themeColors } = useThemeContext(); // Get theme colors
  const { background } = themeColors;
  
  const tabBarSpace = 75 + Platform.select({
    android: 10,
    ios: 20,
    web: 20,
  }) + 15; // Extra padding for safety

  if (scrollable) {
    return (
      <ScrollView 
        style={{ flex: 1, backgroundColor: background }} // Apply background
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: tabBarSpace 
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: background }}> {/* Apply background */}
      <View style={{ flex: 1, marginBottom: tabBarSpace }}>
        {children}
      </View>
    </View>
  );
};