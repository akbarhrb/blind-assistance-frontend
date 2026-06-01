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

  // useEffect(() => {
  //   let timeoutId = null;

  //   const loopDetection = async () => {
  //     // Only capture if the screen is focused, permission is good, and the hardware is bound
  //     if (isFocused && permission?.granted && cameraRef.current && layout.width > 0 && !isDetecting) {
  //       await runDetection();
  //     }

  //     // Queue the next cycle only if we are still looking at this page
  //     if (isFocused) {
  //       timeoutId = setTimeout(loopDetection, 2000);
  //     }
  //   };

  //   if (isFocused && permission?.granted) {
  //     // Small 300ms cushion delay to let the native hardware layer shutter open cleanly
  //     timeoutId = setTimeout(loopDetection, 300);
  //   }

  //   return () => {
  //     if (timeoutId) {
  //       clearTimeout(timeoutId);
  //     }
  //   };
  // }, [isFocused, permission?.granted, layout.width, isDetecting]);

  const runDetection = async () => {
    // Added !isFocused safety check to protect background cycles
    if (isDetecting || !cameraRef.current || layout.width === 0 || !isFocused) {
      return;
    }

    try {
      setIsDetecting(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });

      // If the hardware stream isn't fully ready yet, photo might be null
      if (!photo?.uri) {
        setIsDetecting(false);
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
      // Silent fail
    } finally {
      setIsDetecting(false);
    }
  };

  // Corrected mapping algorithm that factors in the "Aspect Fill" resize behavior of the camera view
  const scaleBox = (box) => {
    if (layout.width === 0 || layout.height === 0) return box;

    const scaleX = layout.width / imageSize.width;
    const scaleY = layout.height / imageSize.height;

    // Determine if the camera preview container is cropping horizontally or vertically
    const scale = Math.max(scaleX, scaleY);

    const offsetX = (layout.width - imageSize.width * scale) / 2;
    const offsetY = (layout.height - imageSize.height * scale) / 2;

    return {
      ...box,
      x: box.x * scale + offsetX,
      y: box.y * scale + offsetY,
      width: box.width * scale,
      height: box.height * scale,
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
      {/* 16:9 ratio requested explicitly to improve backend matching predictions */}
      {/* Re-mounts the camera cleanly only when this page is actively focused */}
      {
        isFocused && permission.granted &&
        <CameraView ref={cameraRef} style={styles.camera} facing="back" ratio="16:9" />
      }
      <Svg width={layout.width} height={layout.height} style={styles.overlay} pointerEvents="none">
        {boxes.map((rawBox, index) => {
          const box = scaleBox(rawBox);
          const label = `${rawBox.label} ${Math.round(rawBox.confidence * 100)}%`;
          const labelX = box.x + 8;
          const labelY = Math.max(20, box.y - 8); // Added safety padding for higher labels

          return (
            <React.Fragment key={`${rawBox.label}-${index}`}>
              <Rect
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                stroke="#2DD4BF" // Swapped white for bright teal to match UI styles nicely
                strokeWidth={3}
                fill="rgba(45, 212, 191, 0.1)" // Consistent with brand highlight colors
                rx={10}
                ry={10}
              />
              <SvgText x={labelX} y={labelY} fill="#2DD4BF" fontSize={16} fontWeight="700">
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <TouchableOpacity style={styles.detectButton} onPress={runDetection} disabled={isDetecting}>
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
    // backgroundColor: "#000000",
  },
  camera: {
    // ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10, // Explicitly forces the Svg overlay to sit directly on top of the native video channel
  },
  detectButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#2DD4BF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 20, // Forces the button to stay interactable above the Svg canvas layer
  },
  detectButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default MainScreen;