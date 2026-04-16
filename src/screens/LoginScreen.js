import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Eye, Mail, Lock, Volume2, Fingerprint, ScanEye } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

const LoginScreen = ({ navigation, route }) => {
  const { signIn, isLoggedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoggedIn) {
    navigation.replace("Home");
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await signIn(email.trim(), password);
      const redirectTo = route?.params?.redirectTo;
      if (redirectTo) {
        navigation.replace(redirectTo);
      } else {
        navigation.replace("Home");
      }
    } catch (error) {
      Alert.alert("Login failed", error.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header / Logo Section */}
        <View style={styles.headerContainer}>
          <View style={styles.logoCircle}>
            <ScanEye size={48} color="#2DD4BF" />
          </View>
          <View style={styles.fingerprintRow}>
            <Fingerprint size={20} color="#D97706" style={{ marginHorizontal: 2 }} />
            <Fingerprint size={20} color="#2DD4BF" style={{ marginHorizontal: 2 }} />
            <Fingerprint size={20} color="#D97706" style={{ marginHorizontal: 2 }} />
          </View>
          <Text style={styles.title}>BlindAssist</Text>
          <Text style={styles.subtitle}>Vision Aid</Text>
        </View>

        {/* Voice Guide Button */}
        <TouchableOpacity style={styles.voiceGuide}>
          <Volume2 size={24} color="#2DD4BF" />
          <Text style={styles.voiceGuideText}>Tap for voice guide</Text>
        </TouchableOpacity>

        {/* Form Section */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Eye size={20} color="#94A3B8" style={styles.eyeIcon} />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A", // Dark navy/black background
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(45, 212, 191, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(45, 212, 191, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  fingerprintRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 4,
  },
  voiceGuide: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  voiceGuideText: {
    color: "#94A3B8",
    fontSize: 18,
    marginLeft: 10,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 60,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: "#2DD4BF", // Teal color from image
    borderRadius: 20,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "bold",
  },
  createAccountButton: {
    marginTop: 25,
    alignItems: "center",
  },
  createAccountText: {
    color: "#2DD4BF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LoginScreen;
