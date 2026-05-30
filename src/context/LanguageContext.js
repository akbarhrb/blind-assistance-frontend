import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { DEFAULT_LANGUAGE, getLanguageConfig, getTranslations } from "../../app.local";

const LANGUAGE_KEY = "app:language";
const SPEECH_RATE_KEY = "app:speechRate";
const SPEECH_VOICE_TYPE_KEY = "app:speechVoiceType";
const DEFAULT_SPEECH_RATE = 0.95;
const DEFAULT_SPEECH_VOICE_TYPE = "male";

const LanguageContext = createContext(null);

const normalizeSpeechRate = (value) => {
  const parsedRate = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsedRate)) {
    return DEFAULT_SPEECH_RATE;
  }

  return Math.min(1.5, Math.max(0.5, parsedRate));
};

const normalizeVoiceType = (value) => (value === "female" ? "female" : DEFAULT_SPEECH_VOICE_TYPE);

const isEnhancedVoice = (voice) => voice?.quality === "Enhanced";

const getLocaleMatchScore = (voiceLanguage, targetLocale) => {
  if (!voiceLanguage || !targetLocale) {
    return 0;
  }

  const normalizedVoiceLanguage = String(voiceLanguage).toLowerCase();
  const normalizedTargetLocale = String(targetLocale).toLowerCase();

  if (normalizedVoiceLanguage === normalizedTargetLocale) {
    return 3;
  }

  const targetPrefix = normalizedTargetLocale.split("-")[0];
  if (normalizedVoiceLanguage.startsWith(`${targetPrefix}-`) || normalizedVoiceLanguage === targetPrefix) {
    return 2;
  }

  return 0;
};

const getVoiceTypeScore = (voice, voiceType) => {
  const name = String(voice?.name || "").toLowerCase();
  const identifier = String(voice?.identifier || "").toLowerCase();
  const haystack = `${name} ${identifier}`;

  if (voiceType === "female") {
    if (haystack.includes("female") || haystack.includes("woman") || haystack.includes("girl")) {
      return 3;
    }
    if (haystack.includes("male") || haystack.includes("man") || haystack.includes("boy")) {
      return -1;
    }
  } else if (voiceType === "male") {
    if (haystack.includes("male") || haystack.includes("man") || haystack.includes("boy")) {
      return 3;
    }
    if (haystack.includes("female") || haystack.includes("woman") || haystack.includes("girl")) {
      return -1;
    }
  }

  return 0;
};

const selectVoiceIdentifier = (voices, targetLocale, voiceType) => {
  if (!Array.isArray(voices) || voices.length === 0) {
    return null;
  }

  const sortedVoices = [...voices].sort((a, b) => {
    const localeDelta = getLocaleMatchScore(b.language, targetLocale) - getLocaleMatchScore(a.language, targetLocale);
    if (localeDelta !== 0) {
      return localeDelta;
    }

    const typeDelta = getVoiceTypeScore(b, voiceType) - getVoiceTypeScore(a, voiceType);
    if (typeDelta !== 0) {
      return typeDelta;
    }

    const qualityDelta = Number(isEnhancedVoice(b)) - Number(isEnhancedVoice(a));
    if (qualityDelta !== 0) {
      return qualityDelta;
    }

    return String(a.name || a.identifier || "").localeCompare(String(b.name || b.identifier || ""));
  });

  const preferredVoice = sortedVoices[0];
  const alternateVoice = sortedVoices.find((voice) => voice.identifier !== preferredVoice?.identifier);

  if (!preferredVoice) {
    return null;
  }

  if (
    getVoiceTypeScore(preferredVoice, voiceType) > 0 ||
    !alternateVoice ||
    getVoiceTypeScore(alternateVoice, voiceType) <= 0
  ) {
    return preferredVoice.identifier;
  }

  return voiceType === "female" ? alternateVoice.identifier : preferredVoice.identifier;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [speechRate, setSpeechRateState] = useState(DEFAULT_SPEECH_RATE);
  const [voiceType, setVoiceTypeState] = useState(DEFAULT_SPEECH_VOICE_TYPE);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLanguage = async () => {
      try {
        const [[, storedLanguage], [, storedSpeechRate], [, storedVoiceType]] = await AsyncStorage.multiGet([
          LANGUAGE_KEY,
          SPEECH_RATE_KEY,
          SPEECH_VOICE_TYPE_KEY,
        ]);

        if (isMounted && (storedLanguage === "en" || storedLanguage === "ar")) {
          setLanguageState(storedLanguage);
        }
        if (isMounted) {
          setSpeechRateState(normalizeSpeechRate(storedSpeechRate));
          setVoiceTypeState(normalizeVoiceType(storedVoiceType));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLanguage();

    const loadVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        if (isMounted && Array.isArray(voices)) {
          setAvailableVoices(voices);
        }
      } catch {
        if (isMounted) {
          setAvailableVoices([]);
        }
      }
    };

    loadVoices();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage) => {
    const normalized = nextLanguage === "ar" ? "ar" : DEFAULT_LANGUAGE;
    await AsyncStorage.setItem(LANGUAGE_KEY, normalized);
    setLanguageState(normalized);
  }, []);

  const setSpeechRate = useCallback(async (nextSpeechRate) => {
    const normalized = normalizeSpeechRate(nextSpeechRate);
    await AsyncStorage.setItem(SPEECH_RATE_KEY, String(normalized));
    setSpeechRateState(normalized);
  }, []);

  const setVoiceType = useCallback(async (nextVoiceType) => {
    const normalized = normalizeVoiceType(nextVoiceType);
    await AsyncStorage.setItem(SPEECH_VOICE_TYPE_KEY, normalized);
    setVoiceTypeState(normalized);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      speechRate,
      setSpeechRate,
      voiceType,
      setVoiceType,
      availableVoices,
      loading,
      isArabic: language === "ar",
      languageConfig: getLanguageConfig(language),
      speechVoiceId: selectVoiceIdentifier(availableVoices, getLanguageConfig(language).speechLocale, voiceType),
      strings: getTranslations(language),
    }),
    [availableVoices, language, loading, setLanguage, setSpeechRate, setVoiceType, speechRate, voiceType]
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
