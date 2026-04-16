import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Camera,
  Volume2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../utils/api";

const buildImagePart = (uri, fallbackName = "image.jpg") => {
  const name = uri.split("/").pop() || fallbackName;
  return {
    uri,
    name,
    type: "image/jpeg",
  };
};

const RegisterFacesScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [previewUri, setPreviewUri] = useState(null);
  const [name, setName] = useState("");
  const [savedFaces, setSavedFaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!permission) {
      return;
    }
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (isFocused) {
      fetchFaces();
    }
  }, [isFocused]);

  const fetchFaces = async () => {
    try {
      const data = await apiRequest("/faces");
      setSavedFaces(data);
    } catch (error) {
      // Silent fail for now
    }
  };

  const handleCapture = async () => {
    if (!permission?.granted) {
      const updatedPermission = await requestPermission();
      if (!updatedPermission.granted) {
        Alert.alert("Permission required", "Camera access is needed to capture a face.");
        return;
      }
    }

    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
      }
    } catch (error) {
      Alert.alert("Capture failed", "Unable to capture the image. Please try again.");
    }
  };

  const handleUpload = async () => {
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaPermission.status !== "granted") {
      Alert.alert("Permission required", "Photo access is needed to upload an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length) {
      setPreviewUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !previewUri) {
      Alert.alert("Missing info", "Please provide a name and image.");
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("name", name.trim());
      form.append("image", buildImagePart(previewUri, "face.jpg"));

      const created = await apiRequest("/faces/register", {
        method: "POST",
        body: form,
        isForm: true,
      });

      setSavedFaces((prev) => [created, ...prev]);
      setName("");
      setPreviewUri(null);
    } catch (error) {
      Alert.alert("Save failed", error.message || "Unable to save face.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (faceId) => {
    try {
      await apiRequest(`/faces/${faceId}`, { method: "DELETE" });
      setSavedFaces((prev) => prev.filter((item) => item.id !== faceId));
    } catch (error) {
      Alert.alert("Delete failed", error.message || "Unable to delete.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <ArrowLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Faces</Text>
        <TouchableOpacity style={styles.voiceIcon}>
          <Volume2 size={24} color="#2DD4BF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Camera Preview Area */}
        <View style={styles.cameraPreview}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} />
          ) : permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraFallbackText}>Enable camera access</Text>
            </View>
          )}
        </View>

        {/* Capture / Upload Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCapture}>
            <Camera size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{previewUri ? "Retake" : "Capture"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleUpload}>
            <Upload size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Input & Save Section */}
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Person Name"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Saved Faces List */}
        <Text style={styles.sectionTitle}>Saved Faces</Text>

        {savedFaces.map((face) => (
          <View key={face.id} style={styles.faceCard}>
            <View style={styles.faceInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{face.name?.[0] || "?"}</Text>
              </View>
              <Text style={styles.faceName}>{face.name}</Text>
            </View>

            <View style={styles.actionGroup}>
              <TouchableOpacity style={styles.iconBtn}>
                <Pencil size={20} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(face.id)}>
                <Trash2 size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 20,
    flex: 1,
  },
  voiceIcon: {
    padding: 5,
  },
  container: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  cameraPreview: {
    height: 220,
    backgroundColor: "#1E293B",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  previewImage: {
    width: "100%",
    height: "100%",
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
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  actionButton: {
    flex: 0.48,
    flexDirection: "row",
    backgroundColor: "#1E293B",
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  formSection: {
    width: "100%",
  },
  input: {
    backgroundColor: "#1E293B",
    height: 60,
    borderRadius: 20,
    paddingHorizontal: 20,
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#2DD4BF",
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 35,
  },
  saveButtonText: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionTitle: {
    color: "#94A3B8",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  faceCard: {
    backgroundColor: "#1E293B",
    borderRadius: 25,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  faceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(45, 212, 191, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "#2DD4BF",
    fontSize: 18,
    fontWeight: "bold",
  },
  faceName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  actionGroup: {
    flexDirection: "row",
  },
  iconBtn: {
    marginLeft: 15,
    padding: 5,
  },
});

export default RegisterFacesScreen;
