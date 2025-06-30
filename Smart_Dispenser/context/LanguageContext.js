import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { translateText, commonTranslations } from "../utils/translator";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render when language changes

  // Available languages
  const availableLanguages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  ];

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("app_language");
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
        } else {
          // Use device locale if available, otherwise default to English
          const deviceLocale = Localization.locale.split("-")[0];
          const supportedLocale = availableLanguages.find(
            (lang) => lang.code === deviceLocale
          );
          const defaultLanguage = supportedLocale ? deviceLocale : "en";
          setCurrentLanguage(defaultLanguage);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
        setCurrentLanguage("en");
      }
    };

    loadLanguage();
  }, []);

  // Change language
  const changeLanguage = async (languageCode) => {
    try {
      console.log("Changing language to:", languageCode);
      await AsyncStorage.setItem("app_language", languageCode);
      setCurrentLanguage(languageCode);
      // Clear cache when language changes
      setTranslationCache({});
      // Force all components to re-render
      setForceUpdate((prev) => prev + 1);

      // Trigger a global app refresh
      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
      }, 100);
    } catch (error) {
      console.error("Error saving language preference:", error);
    }
  };

  // Comprehensive translation function
  const translate = async (text, targetLanguage = currentLanguage) => {
    if (!text || typeof text !== "string") {
      return text;
    }

    if (targetLanguage === "en") {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${targetLanguage}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // Check common translations first
    if (
      commonTranslations[targetLanguage] &&
      commonTranslations[targetLanguage][text.toLowerCase()]
    ) {
      const commonTranslation =
        commonTranslations[targetLanguage][text.toLowerCase()];
      setTranslationCache((prev) => ({
        ...prev,
        [cacheKey]: commonTranslation,
      }));
      return commonTranslation;
    }

    try {
      setIsTranslating(true);
      const translatedText = await translateText(text, targetLanguage);

      // Cache the translation
      setTranslationCache((prev) => ({
        ...prev,
        [cacheKey]: translatedText,
      }));

      return translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Return original text if translation fails
    } finally {
      setIsTranslating(false);
    }
  };

  // Sync translation function (for immediate use with cached translations)
  const t = (text) => {
    if (!text || typeof text !== "string") {
      return text;
    }

    if (currentLanguage === "en") {
      return text;
    }

    // Check cache for immediate return
    const cacheKey = `${text}_${currentLanguage}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // Check common translations
    if (
      commonTranslations[currentLanguage] &&
      commonTranslations[currentLanguage][text.toLowerCase()]
    ) {
      return commonTranslations[currentLanguage][text.toLowerCase()];
    }

    return text; // Return original if not cached
  };

  // Batch translate multiple texts
  const translateBatch = async (texts) => {
    if (currentLanguage === "en") {
      return texts;
    }

    const results = [];
    for (const text of texts) {
      const translated = await translate(text);
      results.push(translated);
    }
    return results;
  };

  // Force refresh all translations
  const refreshTranslations = () => {
    setForceUpdate((prev) => prev + 1);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    translate,
    t,
    translateBatch,
    isTranslating,
    forceUpdate,
    refreshTranslations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
