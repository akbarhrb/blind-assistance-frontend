import React from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </LanguageProvider>
    </AuthProvider>
  );
}
