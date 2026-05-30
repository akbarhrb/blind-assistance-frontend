import React, { useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  StatusBar,
  Alert,
} from "react-native";
import { ArrowLeft, Globe, Volume2, LogOut } from "lucide-react-native";
import * as Speech from "expo-speech";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const SPEED_OPTIONS = [0.75, 0.9, 1, 1.15];

const SettingsScreen = ({ navigation }) => {
  const [faceDetection, setFaceDetection] = React.useState(true);
  const [objectDetection, setObjectDetection] = React.useState(true);
  const [highContrast, setHighContrast] = React.useState(true);
  const { signOut } = useAuth();
  const {
    language,
    setLanguage,
    speechRate,
    setSpeechRate,
    voiceType,
    setVoiceType,
    speechVoiceId,
    strings,
    isArabic,
    languageConfig,
  } = useLanguage();
  const t = strings.settings;
  const common = strings.common;
  const femaleLabel = isArabic ? "أنثى" : "Female";

  const handleLogout = () => {
    Alert.alert(t.logoutTitle, t.logoutMessage, [
      { text: common.cancel, style: "cancel" },
      {
        text: t.logout,
        style: "destructive",
        onPress: async () => {
          await signOut();
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  const handleTestVoice = useCallback(() => {
    Speech.stop();
    Speech.speak(t.testVoicePhrase, {
      language: languageConfig.speechLocale,
      volume: 1,
      rate: speechRate,
      pitch: voiceType === "female" ? 1.12 : 0.9,
      voice: speechVoiceId || undefined,
      useApplicationAudioSession: false,
    });
  }, [languageConfig.speechLocale, speechRate, speechVoiceId, t.testVoicePhrase, voiceType]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <ArrowLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{t.language}</Text>
        <View style={styles.card}>
          <View style={styles.languageRow}>
            <View style={styles.langLeft}>
              <Globe size={22} color="#2DD4BF" style={styles.iconMargin} />
              <Text style={styles.cardText}>{isArabic ? t.arabic : t.english}</Text>
            </View>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[styles.langToggle, language === "en" && styles.langToggleActive]}
                onPress={() => setLanguage("en")}
              >
                <Text style={styles.langToggleText}>{t.english}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langToggle, language === "ar" && styles.langToggleActive]}
                onPress={() => setLanguage("ar")}
              >
                <Text style={styles.langToggleText}>{t.arabic}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t.voice}</Text>
        <View style={styles.card}>
          <View style={styles.voiceControlGroup}>
            <Text style={styles.innerLabel}>{t.speed}</Text>
            <View style={styles.optionRow}>
              {SPEED_OPTIONS.map((rate) => {
                const active = speechRate === rate;
                return (
                  <TouchableOpacity
                    key={rate}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => setSpeechRate(rate)}
                  >
                    <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                      {`${rate.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}x`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.innerLabel, { marginTop: 20 }]}>{t.voiceType}</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionChip, voiceType === "male" && styles.optionChipActive]}
                onPress={() => setVoiceType("male")}
              >
                <Text style={[styles.optionChipText, voiceType === "male" && styles.optionChipTextActive]}>
                  {t.male}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionChip, voiceType === "female" && styles.optionChipActive]}
                onPress={() => setVoiceType("female")}
              >
                <Text
                  style={[styles.optionChipText, voiceType === "female" && styles.optionChipTextActive]}
                >
                  {femaleLabel}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.testVoiceButton} onPress={handleTestVoice}>
              <Volume2 size={20} color="#FFFFFF" style={styles.iconMargin} />
              <Text style={styles.testVoiceText}>{t.testVoice}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t.detection}</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.cardText}>{t.faceDetection}</Text>
            <Switch
              value={faceDetection}
              onValueChange={setFaceDetection}
              trackColor={{ false: "#334155", true: "#2DD4BF" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.switchRow, { marginTop: 15 }]}>
            <Text style={styles.cardText}>{t.objectDetection}</Text>
            <Switch
              value={objectDetection}
              onValueChange={setObjectDetection}
              trackColor={{ false: "#334155", true: "#2DD4BF" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t.accessibility}</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.cardText}>{t.highContrast}</Text>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: "#334155", true: "#2DD4BF" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={[styles.innerLabel, { marginTop: 20 }]}>{t.textSize}</Text>
          <View style={styles.dropdown}>
            <Text style={styles.cardText}>{t.normal}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t.account}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#F8FAFC" style={styles.iconMargin} />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    marginLeft: 20,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: "#2DD4BF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  langLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  languageButtons: {
    flexDirection: "row",
    gap: 10,
  },
  langToggle: {
    backgroundColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "transparent",
  },
  langToggleActive: {
    borderColor: "#2DD4BF",
  },
  langToggleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cardText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  voiceControlGroup: {
    gap: 0,
  },
  innerLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minWidth: 74,
    alignItems: "center",
  },
  optionChipActive: {
    borderColor: "#2DD4BF",
    backgroundColor: "rgba(45, 212, 191, 0.15)",
  },
  optionChipText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: "#FFFFFF",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 15,
    borderRadius: 15,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  sliderFill: {
    width: "40%",
    height: "100%",
    backgroundColor: "#2DD4BF",
    borderRadius: 3,
  },
  sliderThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2DD4BF",
    marginLeft: -9,
  },
  testVoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#334155",
    marginTop: 20,
    height: 55,
    borderRadius: 15,
  },
  testVoiceText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconMargin: {
    marginRight: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    height: 55,
    borderRadius: 18,
  },
  logoutText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default SettingsScreen;
