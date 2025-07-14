import React from 'react';
import { MdInfo } from 'react-icons/md'; // Example icon
import { useTheme } from '../../hooks/useThemeContext';

const EmptyState = ({ icon: IconComponent = MdInfo, message }) => {
  const { themeColors } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <IconComponent size={64} color={themeColors.text} />
      <p className="text-center text-base mt-4" style={{ color: themeColors.text }}>
        {message}
      </p>
    </div>
  );
};

export default EmptyState;