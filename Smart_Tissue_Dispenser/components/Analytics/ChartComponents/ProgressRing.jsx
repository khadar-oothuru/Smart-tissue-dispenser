import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useThemeContext } from '../../../context/ThemeContext';
import { progressStyles } from './styles';

export const ProgressRing = ({ progress, size = 200, strokeWidth = 20, color }) => {
  const { themeColors, isDark } = useThemeContext();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const ringColor = color || themeColors.primary;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? themeColors.border : '#F2F2F7'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={progressStyles.centerContent}>
        <Text style={[progressStyles.progressText, { color: themeColors.heading }]}>{progress}%</Text>
      </View>
    </View>
  );
};
