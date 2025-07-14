// components/Common/ErrorMessage.js
import React from 'react';
import { useTheme } from '../../hooks/useThemeContext';

const ErrorMessage = ({ error, onDismiss }) => {
  const { themeColors, isDark } = useTheme();

  return (
    <div 
      className="p-4 mx-4 rounded-xl flex items-center justify-between"
      style={{ 
        backgroundColor: isDark ? '#3D1F1F' : '#FFE5E5',
      }}
    >
      <p 
        className="flex-1 text-sm font-medium"
        style={{ color: '#FF3B30' }}
      >
        {error}
      </p>
      <button 
        onClick={onDismiss}
        className="ml-3 text-sm font-semibold hover:opacity-80 transition-opacity"
        style={{ color: '#FF3B30' }}
      >
        Dismiss
      </button>
    </div>
  );
};

export default ErrorMessage;