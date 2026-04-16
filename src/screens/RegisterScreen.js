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
import { ArrowLeft, User, Mail, Lock, Eye, ShieldCheck, Volume2, UserPlus } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

const RegisterScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please re-enter your password.");
      return;
    }

    try {
      setSubmitting(true);
      await signUp(name.trim(), email.trim(), password);
      navigation.replace("Home");
    } catch (error) {
      console.log(error);
      Alert.alert("Registration failed", error.message || "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header with Back Arrow */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <ArrowLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register</Text>
      </View>

      <View style={styles.container}>
        {/* Profile/Add User Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <UserPlus size={44} color="#F59E0B" />
          </View>
        </View>

        {/* Voice Guide Toggle */}
        <TouchableOpacity style={styles.voiceGuide}>
          <Volume2 size={24} color="#2DD4BF" />
          <Text style={styles.voiceGuideText}>Voice guide</Text>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#64748B"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#64748B"
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
              placeholderTextColor="#64748B"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Eye size={20} color="#94A3B8" style={styles.eyeIcon} />
          </View>

          <View style={styles.inputContainer}>
            <ShieldCheck size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#64748B"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginLinkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A", // Matching the dark theme
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  iconContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(245, 158, 11, 0.15)", // Transparent orange
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
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
    backgroundColor: "#1E293B", // Darker field color
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    height: 65,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  registerButton: {
    backgroundColor: "#2DD4BF", // Teal color
    borderRadius: 25,
    height: 65,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerButtonText: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "bold",
  },
  loginLink: {
    alignItems: "center",
    marginTop: 18,
  },
  loginLinkText: {
    color: "#2DD4BF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RegisterScreen;
