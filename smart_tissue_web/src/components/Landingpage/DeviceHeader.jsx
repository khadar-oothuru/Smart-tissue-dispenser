import React from "react";
import { Search } from "lucide-react";
import { useTheme } from "../../hooks/useThemeContext";

export default function DeviceHeader({
  searchTerm,
  onSearchChange,
  bgColor,
  borderColor,
}) {
  const { themeColors, isDark } = useTheme();

  return (
    <div className="w-full">
      <div
        className={`relative rounded-xl overflow-hidden transition-all flex items-center px-4 py-2`}
        style={{
          backgroundColor: bgColor || (isDark ? themeColors.surface : "#fff"),
          border: `1px solid ${
            borderColor || (isDark ? "transparent" : themeColors.border)
          }`,
        }}
      >
        <Search
          className={`w-5 h-5 mr-2 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search devices..."
          className={`w-full px-3 py-2 bg-transparent outline-none text-base ${
            isDark
              ? "text-white placeholder-gray-500"
              : "text-gray-900 placeholder-gray-400"
          }`}
          style={{ color: themeColors.text }}
        />
      </div>
    </div>
  );
}
