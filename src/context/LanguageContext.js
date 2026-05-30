import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LANGUAGE, getLanguageConfig, getTranslations } from "../../app.local";

const LANGUAGE_KEY = "app:language";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (isMounted && (storedLanguage === "en" || storedLanguage === "ar")) {
          setLanguageState(storedLanguage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = async (nextLanguage) => {
    const normalized = nextLanguage === "ar" ? "ar" : DEFAULT_LANGUAGE;
    await AsyncStorage.setItem(LANGUAGE_KEY, normalized);
    setLanguageState(normalized);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      loading,
      isArabic: language === "ar",
      languageConfig: getLanguageConfig(language),
      strings: getTranslations(language),
    }),
    [language, loading]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
