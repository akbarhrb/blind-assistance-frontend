import React, { useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { 
  Settings, 
  Mic, 
  UserPlus, 
  PackagePlus, 
  ListTodo 
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAuth } from "../context/AuthContext";

// Screen Imports
import RegisterScreen from "../screens/RegisterScreen";
import LogsScreen from "../screens/LogsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AudioVisualizer from "../components/AnimatedWaveBar";
import AddObjectScreen from "../screens/AddObjectScreen";
import RegisterFacesScreen from "../screens/RegisterFacesScreen";
import LoginScreen from "../screens/LoginScreen";

const Stack = createStackNavigator();

const HomeScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!permission) {
      return;
    }
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const guardedNavigate = (routeName) => {
    if (!isLoggedIn) {
      navigation.navigate("Login", { redirectTo: routeName });
      return;
    }

    navigation.navigate(routeName);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>BlindAssistance</Text>
        <TouchableOpacity onPress={() => guardedNavigate("Settings")}>
          <Settings size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Detection Alert Badge */}
        <View style={styles.alertBadge}>
          <Text style={styles.alertText}>Chair detected</Text>
        </View>

        {/* Audio Wave Visualizer Placeholder */}
        <AudioVisualizer />

        {/* Camera Preview */}
        <View style={styles.cameraPreview}>
          {permission?.granted ? (
            <CameraView style={styles.camera} facing="back" />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraFallbackText}>Enable camera access</Text>
            </View>
          )}
        </View>
      </View>

      {/* Mic Button Section */}
      <View style={styles.micSection}>
        <TouchableOpacity style={styles.micButton}>
          <Mic size={32} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Bottom Grid Navigation */}
      <View style={styles.bottomGrid}>
        <TouchableOpacity 
          style={styles.gridItem} 
          onPress={() => guardedNavigate("RegisterFaces")}
        >
          <UserPlus size={28} color="#FFFFFF" />
          <Text style={styles.gridLabel}>Faces</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => guardedNavigate("AddObject")}
        >
          <PackagePlus size={28} color="#FFFFFF" />
          <Text style={styles.gridLabel}>Objects</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => guardedNavigate("Logs")}
        >
          <ListTodo size={28} color="#FFFFFF" />
          <Text style={styles.gridLabel}>Logs</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const AppNavigator = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2DD4BF" />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Using custom headers for more control
          cardStyle: { backgroundColor: "#0F172A" }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="AddObject" component={AddObjectScreen} />
        <Stack.Screen name="Logs" component={LogsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="RegisterFaces" component={RegisterFacesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  alertText: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "bold",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    gap: 6,
  },
  waveBar: {
    width: 4,
    backgroundColor: "#2DD4BF",
    borderRadius: 2,
  },
  cameraPreview: {
    width: 240,
    height: 160,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 20,
    backgroundColor: "#0B0F1A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  cameraFallbackText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
  },
  micSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  micButton: {
    backgroundColor: "#2DD4BF",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2DD4BF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  bottomGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLabel: {
    color: "#FFFFFF",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AppNavigator;
