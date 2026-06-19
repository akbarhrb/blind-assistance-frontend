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
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Upload,
  Camera,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../utils/api";
import { useLanguage } from "../context/LanguageContext";
import { CameraView, useCameraPermissions } from "expo-camera";

const buildImagePart = (uri, fallbackName = "object.jpg") => {
  const name = uri.split("/").pop() || fallbackName;
  return {
    uri,
    name,
    type: "image/jpeg",
  };
};

const AddObjectScreen = ({ navigation }) => {
  const { strings } = useLanguage();
  const t = strings.addObject;
  const common = strings.common;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [imageUri, setImageUri] = useState(null); // Consolidated image state
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (isFocused) {
      fetchObjects();
    }
  }, [isFocused]);

  const fetchObjects = async () => {
    try {
      const data = await apiRequest("/objects");
      setObjects(data);
    } catch (error) {
      setObjects([]);
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
      setImageUri(result.assets[0].uri); // Saves to imageUri
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
        setImageUri(photo.uri); // Now saves to the exact same imageUri state
      }
    } catch (error) {
      Alert.alert(t.captureFailed, t.captureFailedBody);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t.missingInfo, t.missingNameBody);
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("name", name.trim());
      if (category.trim()) {
        form.append("category", category.trim());
      }
      if (imageUri) {
        form.append("image", buildImagePart(imageUri));
      }

      const created = await apiRequest("/objects", {
        method: "POST",
        body: form,
        isForm: true,
      });

      setObjects((prev) => [created, ...prev]);
      setName("");
      setCategory("");
      setImageUri(null); // Clears the preview automatically upon success
    } catch (error) {
      Alert.alert(t.saveFailed, error.message || t.saveFailedBody);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (objectId) => {
    try {
      await apiRequest(`/objects/${objectId}`, { method: "DELETE" });
      setObjects((prev) => prev.filter((item) => item.id !== objectId));
    } catch (error) {
      Alert.alert(t.deleteFailed, error.message || t.deleteFailedBody);
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
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.uploadMain}>
          {imageUri ? (
            // Both methods now feed into imageUri, so both display perfectly here
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.retakeButton} onPress={() => setImageUri(null)}>
                <Text style={styles.retakeText}>Reset Photo</Text>
              </TouchableOpacity>
            </View>
          ) : permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraFallbackText}>{t.cameraFallback}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCapture}>
            {/* Removed the invalid cameraRef from the Icon line below */}
            <Camera size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{common.capture}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleUpload}>
            <Upload size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{common.upload}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={t.objectName}
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.pickerContainer}>
          <TextInput
            style={styles.pickerInput}
            placeholder={t.category}
            placeholderTextColor="#94A3B8"
            value={category}
            onChangeText={setCategory}
          />
          <ChevronDown size={20} color="#94A3B8" />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.saveButtonText}>{common.save}</Text>}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t.customObjects}</Text>

        {objects.map((item) => (
          <View key={item.id} style={styles.objectCard}>
            <View style={styles.objectInfo}>
              <Text style={styles.objectName}>{item.name}</Text>
              <Text style={styles.objectCategory}>{item.category || t.uncategorized}</Text>
            </View>
            <View style={styles.iconGroup}>
              <TouchableOpacity style={styles.iconBtn}>
                <Pencil size={20} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
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
    marginBottom: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 20,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  uploadMain: {
    height: 200,
    backgroundColor: "#1E293B",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  previewContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  retakeButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  retakeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  cameraFallback: {
    alignItems: "center",
    padding: 20,
  },
  cameraFallbackText: {
    color: "#94A3B8",
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
  input: {
    backgroundColor: "#1E293B",
    height: 65,
    borderRadius: 25,
    paddingHorizontal: 20,
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: "#1E293B",
    height: 65,
    borderRadius: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  pickerInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: "#2DD4BF",
    height: 65,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
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
  objectCard: {
    backgroundColor: "#1E293B",
    borderRadius: 25,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  objectInfo: {},
  iconGroup: {
    flexDirection: "row",
  },
  iconBtn: {
    marginLeft: 15,
    padding: 5,
  },
});

export default AddObjectScreen;