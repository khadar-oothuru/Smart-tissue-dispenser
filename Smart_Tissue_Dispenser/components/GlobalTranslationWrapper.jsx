import React, { useEffect } from "react";
import { View } from "react-native";
import { useLanguage } from "../context/LanguageContext";

const GlobalTranslationWrapper = ({ children }) => {
  const { forceUpdate, currentLanguage } = useLanguage();

  // This component forces re-renders when language changes
  useEffect(() => {
    // Force re-render when language changes
    console.log("Language changed to:", currentLanguage);
  }, [currentLanguage, forceUpdate]);

  return (
    <View style={{ flex: 1 }} key={`lang-${currentLanguage}-${forceUpdate}`}>
      {children}
    </View>
  );
};

export default GlobalTranslationWrapper;
