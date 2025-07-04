import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { useThemeContext } from '../../../context/ThemeContext';

export const RoundedBar = ({ x, y, width, height, color }) => {
  const { themeColors } = useThemeContext();
  const radius = Math.min(width / 2, 20);
  return (
    <Svg>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color || themeColors.primary}
        rx={radius}
        ry={radius}
      />
    </Svg>
  );
};
