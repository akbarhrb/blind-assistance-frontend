import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../utils/api";

const MainScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [boxes, setBoxes] = useState([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [isDetecting, setIsDetecting] = useState(false);
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      return;
    }
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!isFocused || !permission?.granted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        runDetection();
      }, 2000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isFocused, permission?.granted]);

  const runDetection = async () => {
    if (isDetecting || !cameraRef.current) {
      return;
    }

    try {
      setIsDetecting(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
      if (!photo?.uri) {
        return;
      }

      if (photo.width && photo.height) {
        setImageSize({ width: photo.width, height: photo.height });
      }

      const form = new FormData();
      form.append("image", {
        uri: photo.uri,
        name: "frame.jpg",
        type: "image/jpeg",
      });

      const result = await apiRequest("/detect/objects", {
        method: "POST",
        body: form,
        isForm: true,
      });

      setBoxes(result.boxes || []);
    } catch (error) {
      // Silent fail; keep last boxes
    } finally {
      setIsDetecting(false);
    }
  };

  const scaleBox = (box) => {
    const scaleX = layout.width / imageSize.width;
    const scaleY = layout.height / imageSize.height;
    return {
      ...box,
      x: box.x * scaleX,
      y: box.y * scaleY,
      width: box.width * scaleX,
      height: box.height * scaleY,
    };
  };

  if (!permission || !permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <Svg width={layout.width} height={layout.height} style={styles.overlay} pointerEvents="none">
        {boxes.map((rawBox, index) => {
          const box = scaleBox(rawBox);
          const label = `${rawBox.label} ${Math.round(rawBox.confidence * 100)}%`;
          const labelX = box.x + 8;
          const labelY = Math.max(16, box.y - 8);

          return (
            <React.Fragment key={`${rawBox.label}-${index}`}>
              <Rect
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                stroke="#FFFFFF"
                strokeWidth={3}
                fill="rgba(255,255,255,0.04)"
                rx={10}
                ry={10}
              />
              <SvgText x={labelX} y={labelY} fill="#FFFFFF" fontSize={16} fontWeight="700">
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <TouchableOpacity style={styles.detectButton} onPress={runDetection}>
        {isDetecting ? (
          <ActivityIndicator color="#0F172A" />
        ) : (
          <Text style={styles.detectButtonText}>Detect Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B0D",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  detectButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#2DD4BF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  detectButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default MainScreen;
