import React, { useEffect, useState } from "react";
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
  UploadCloud,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../utils/api";

const buildImagePart = (uri, fallbackName = "object.jpg") => {
  const name = uri.split("/").pop() || fallbackName;
  return {
    uri,
    name,
    type: "image/jpeg",
  };
};

const AddObjectScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

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
      // silent for now
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
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing info", "Please provide an object name.");
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
      setImageUri(null);
    } catch (error) {
      Alert.alert("Save failed", error.message || "Unable to save object.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (objectId) => {
    try {
      await apiRequest(`/objects/${objectId}`, { method: "DELETE" });
      setObjects((prev) => prev.filter((item) => item.id !== objectId));
    } catch (error) {
      Alert.alert("Delete failed", error.message || "Unable to delete.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <ArrowLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Object</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Main Upload Area */}
        <View style={styles.uploadMain}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <>
              <UploadCloud size={48} color="#94A3B8" />
              <Text style={styles.uploadText}>Upload or Capture</Text>
            </>
          )}
        </View>

        {/* Secondary Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Camera size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Capture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleUpload}>
            <Upload size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <TextInput
          style={styles.input}
          placeholder="Object Name"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.pickerContainer}>
          <TextInput
            style={styles.pickerInput}
            placeholder="Category (optional)"
            placeholderTextColor="#94A3B8"
            value={category}
            onChangeText={setCategory}
          />
          <ChevronDown size={20} color="#94A3B8" />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

        {/* Custom Objects List */}
        <Text style={styles.sectionTitle}>Custom Objects</Text>

        {objects.map((item) => (
          <View key={item.id} style={styles.objectCard}>
            <View style={styles.objectInfo}>
              <Text style={styles.objectName}>{item.name}</Text>
              <Text style={styles.objectCategory}>{item.category || "Uncategorized"}</Text>
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
  previewImage: {
    width: "100%",
    height: "100%",
  },
  uploadText: {
    color: "#94A3B8",
    marginTop: 10,
    fontSize: 16,
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
  objectName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  objectCategory: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
  },
  iconGroup: {
    flexDirection: "row",
  },
  iconBtn: {
    marginLeft: 15,
    padding: 5,
  },
});

export default AddObjectScreen;
