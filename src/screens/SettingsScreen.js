import React, { useState } from "react";
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
import { ArrowLeft, Globe, Volume2, ChevronDown, LogOut } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

const SettingsScreen = ({ navigation }) => {
  const [faceDetection, setFaceDetection] = useState(true);
  const [objectDetection, setObjectDetection] = useState(true);
  const [highContrast, setHighContrast] = useState(true);
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <ArrowLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Language Section */}
        <Text style={styles.sectionLabel}>Language</Text>
        <View style={styles.card}>
          <View style={styles.languageRow}>
            <View style={styles.langLeft}>
              <Globe size={22} color="#2DD4BF" style={styles.iconMargin} />
              <Text style={styles.cardText}>English</Text>
            </View>
            <TouchableOpacity style={styles.langToggleActive}>
              <Text style={styles.langToggleText}>العربية</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Section */}
        <Text style={styles.sectionLabel}>Voice</Text>
        <View style={styles.card}>
          <View style={styles.voiceControlGroup}>
            <Text style={styles.innerLabel}>Speed</Text>
            <View style={styles.sliderTrack}>
              <View style={styles.sliderFill} />
              <View style={styles.sliderThumb} />
            </View>
            
            <Text style={[styles.innerLabel, {marginTop: 20}]}>Voice Type</Text>
            <View style={styles.dropdown}>
              <Text style={styles.cardText}>Male</Text>
              <ChevronDown size={20} color="#94A3B8" />
            </View>

            <TouchableOpacity style={styles.testVoiceButton}>
              <Volume2 size={20} color="#FFFFFF" style={styles.iconMargin} />
              <Text style={styles.testVoiceText}>Test Voice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Detection Section */}
        <Text style={styles.sectionLabel}>Detection</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.cardText}>Face Detection</Text>
            <Switch
              value={faceDetection}
              onValueChange={setFaceDetection}
              trackColor={{ false: "#334155", true: "#2DD4BF" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.switchRow, {marginTop: 15}]}>
            <Text style={styles.cardText}>Object Detection</Text>
            <Switch
              value={objectDetection}
              onValueChange={setObjectDetection}
              trackColor={{ false: "#334155", true: "#2DD4BF" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Accessibility Section */}
        <Text style={styles.sectionLabel}>Accessibility</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.cardText}>High Contrast Mode</Text>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: "#334155", true: "#2DD4BF" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={[styles.innerLabel, {marginTop: 20}]}>Text Size</Text>
          <View style={styles.dropdown}>
            <Text style={styles.cardText}>Normal</Text>
            <ChevronDown size={20} color="#94A3B8" />
          </View>
        </View>

        {/* Logout */}
        <Text style={styles.sectionLabel}>Account</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#F8FAFC" style={styles.iconMargin} />
          <Text style={styles.logoutText}>Log out</Text>
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
  },
  langLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  langToggleActive: {
    backgroundColor: "#334155",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  langToggleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cardText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  innerLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 12,
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
