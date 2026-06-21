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
  Rewind,
  Repeat,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest, TOKEN_KEY } from "../utils/api";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const buildImagePart = (uri, fallbackName = "image.jpg") => {
  const name = uri.split("/").pop() || fallbackName;
  return { uri, name, type: "image/jpeg" };
};

const RegisterFacesScreen = ({ navigation }) => {
  const { strings } = useLanguage();
  const t = strings.faces;
  const common = strings.common;
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
    fetchFaces();
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchFaces();
    }
  }, [isFocused]);

  const fetchFaces = async () => {
    try {
      setLoading(true);
      await apiRequest("/faces").then((response) => {
        setLoading(false);
        setSavedFaces(response);
      });

      // setSavedFaces(data);
    } catch (error) {
      setSavedFaces([]);
    }
  };

  const handleCapture = async () => {
    if (!permission?.granted) {
      const updatedPermission = await requestPermission();
      if (!updatedPermission.granted) {
        Alert.alert(t.permissionRequired, t.cameraPermission);
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
      Alert.alert(t.captureFailed, t.captureFailedBody);
    }
  };

  const handleUpload = async () => {
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaPermission.status !== "granted") {
      Alert.alert(t.permissionRequired, t.photoPermission);
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
      Alert.alert(t.missingInfo, t.missingInfoBody);
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("name", name.trim());
      form.append("image", buildImagePart(previewUri, "face.jpg"));

      const token = (await AsyncStorage.getItem(TOKEN_KEY));

      const response = await axios.post(process.env.EXPO_PUBLIC_API_BASE_URL + "/faces/register", form, {
        "headers": {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      const created = response.data;

      setSavedFaces((prev) => [created, ...prev]);
      setName("");
      setPreviewUri(null);
    } catch (error) {
      Alert.alert(t.saveFailed, error.message || t.saveFailedBody);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <ArrowLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity style={styles.voiceIcon}>
          <Volume2 size={24} color="#2DD4BF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.cameraPreview}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} />
          ) : permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraFallbackText}>{t.cameraFallback}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            previewUri ?
              setPreviewUri(null)
              :
              handleCapture();
          }}>
            {
              previewUri ?
                <Repeat size={20} color="#FFFFFF" style={styles.buttonIcon} />
                :
                <Camera size={20} color="#FFFFFF" style={styles.buttonIcon} />
            }
            <Text style={styles.buttonText}>{previewUri ? common.retake : common.capture}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleUpload}>
            <Upload size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{common.upload}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder={t.personName}
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.saveButtonText}>{common.save}</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t.savedFaces}</Text>

        {savedFaces.length > 0 ?
          savedFaces.map((face) => (
            <FaceItemContainer face={face} onDelete={(faceId) => {
              setSavedFaces(
                (prev) => prev.filter((item) => item.id !== faceId)
              );
            }} />
          ))
          :
          (loading ?
            <ActivityIndicator />
            :
          <Text style={{
            color:'#adadad',
            fontSize:16
          }}>no faces</Text>
          )
        }
      </ScrollView>
    </SafeAreaView>
  );
};

const FaceItemContainer = ({ face, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (faceId) => {
    try {
      setLoading(true);
      await apiRequest(`/faces/${faceId}`, { method: "DELETE" });
      onDelete(face.id);
    } catch (error) {
      Alert.alert(t.deleteFailed, error.message || t.deleteFailedBody);
    } finally {
      setLoading(false);
    }
  };
  return (
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
          {loading ?
            <ActivityIndicator />
            :
            <Trash2 size={20} color="#94A3B8" />
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

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
