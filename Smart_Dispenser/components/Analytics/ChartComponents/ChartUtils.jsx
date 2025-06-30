import { Dimensions } from 'react-native';

export const screenWidth = Dimensions.get('window').width;

export const createChartConfig = (themeColors, isDark) => ({
  backgroundGradientFrom: themeColors.background,
  backgroundGradientTo: themeColors.background,
  decimalPlaces: 0,
  color: (opacity = 1) => isDark 
    ? `rgba(248, 83, 6, ${opacity})`
    : `rgba(58, 176, 255, ${opacity})`,
  labelColor: (opacity = 1) => isDark
    ? `rgba(209, 209, 209, ${opacity})`
    : `rgba(123, 132, 147, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: themeColors.primary,
    fill: themeColors.background
  },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: isDark ? themeColors.border : '#F2F2F7',
    strokeWidth: 1,
  },
});
