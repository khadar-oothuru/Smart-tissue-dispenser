/**
 * Web-compatible style utilities
 * Provides cross-platform styling solutions
 */

import { Platform } from 'react-native';

/**
 * Creates web-compatible shadow styles
 * @param {Object} shadowConfig - Shadow configuration
 * @param {string} shadowConfig.shadowColor - Shadow color
 * @param {Object} shadowConfig.shadowOffset - Shadow offset {width, height}
 * @param {number} shadowConfig.shadowOpacity - Shadow opacity
 * @param {number} shadowConfig.shadowRadius - Shadow radius
 * @param {number} shadowConfig.elevation - Android elevation
 * @returns {Object} Platform-specific shadow styles
 */
export const createShadow = ({
  shadowColor = '#000',
  shadowOffset = { width: 0, height: 2 },
  shadowOpacity = 0.25,
  shadowRadius = 3.84,
  elevation = 5
}) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  }
  
  if (Platform.OS === 'android') {
    return {
      elevation,
    };
  }
  
  // iOS
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
  };
};

/**
 * Web-compatible font weight mapping
 */
export const getFontWeight = (weight) => {
  if (Platform.OS === 'web') {
    const weightMap = {
      'light': '300',
      'normal': '400',
      'medium': '500',
      'bold': '700',
      '100': '100',
      '200': '200',
      '300': '300',
      '400': '400',
      '500': '500',
      '600': '600',
      '700': '700',
      '800': '800',
      '900': '900',
    };
    return weightMap[weight] || weight;
  }
  return weight;
};

/**
 * Web-compatible text decoration styles
 */
export const getTextDecoration = (decoration) => {
  if (Platform.OS === 'web') {
    return {
      textDecoration: decoration || 'none',
    };
  }
  
  // For React Native, handle text decoration differently
  const styles = {};
  if (decoration === 'underline') {
    styles.textDecorationLine = 'underline';
  } else if (decoration === 'line-through') {
    styles.textDecorationLine = 'line-through';
  }
  return styles;
};

/**
 * Creates responsive styles based on screen size (web)
 */
export const createResponsiveStyle = (baseStyle, webStyle = {}) => {
  if (Platform.OS === 'web') {
    return {
      ...baseStyle,
      ...webStyle,
    };
  }
  return baseStyle;
};



