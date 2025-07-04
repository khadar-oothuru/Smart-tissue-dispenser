import { useLanguage } from "../context/LanguageContext";
import { useState, useEffect } from "react";

export const useTranslation = () => {
  const { currentLanguage, translate, t, isTranslating } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState({});

  // Function to translate a single text
  const translateText = async (text) => {
    if (!text || typeof text !== "string") return text;

    // Use sync translation first (for cached/common translations)
    const syncTranslation = t(text);
    if (syncTranslation !== text) {
      return syncTranslation;
    }

    // If not cached, translate and cache
    const translated = await translate(text);
    setTranslatedTexts((prev) => ({
      ...prev,
      [text]: translated,
    }));
    return translated;
  };

  // Function to translate multiple texts at once
  const translateMultiple = async (texts) => {
    const results = {};
    for (const text of texts) {
      results[text] = await translateText(text);
    }
    return results;
  };

  // Function to translate an object with text properties
  const translateObject = async (obj) => {
    const translated = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        translated[key] = await translateText(value);
      } else {
        translated[key] = value;
      }
    }
    return translated;
  };

  return {
    currentLanguage,
    translateText,
    translateMultiple,
    translateObject,
    isTranslating,
    t, // Sync translation for immediate use
  };
};
