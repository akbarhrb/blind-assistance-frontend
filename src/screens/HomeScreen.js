import React, { useEffect, useRef, useState, useCallback } from "react";
import { Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet } from "react-native";
import { Settings, Mic, UserPlus, PackagePlus, ListTodo } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import { useIsFocused } from "@react-navigation/native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiRequest } from "../utils/api";
import AudioVisualizer from "../components/AnimatedWaveBar";

const HomeScreen = ({ navigation }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [detectionStatus, setDetectionStatus] = useState("scanning");
    const [detectedSummary, setDetectedSummary] = useState("");
    const [isDetecting, setIsDetecting] = useState(false);
    const [layout, setLayout] = useState({ width: 0, height: 0 });
    const [boxes, setBoxes] = useState([]);
    const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
    const cameraRef = useRef(null);
    const isDetectingRef = useRef(false);
    const lastSpokenRef = useRef("");
    const isFocused = useIsFocused();
    const { isLoggedIn } = useAuth();
    const { strings, languageConfig, speechRate, voiceType, speechVoiceId } = useLanguage();
    const homeStrings = strings.home;
    const navStrings = strings.navigation;
    const noDetectionsText = homeStrings.noDetections || homeStrings.noObjects || "No faces or objects detected";
    const noDetectionsSpeech = homeStrings.noDetectionsSpeech || homeStrings.noObjectsSpeech || noDetectionsText;
    const faceDetectedText = homeStrings.faceDetected || "Face detected";
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isCameraMounted, setIsCameraMounted] = useState(false);

    useEffect(() => {
        if (!permission) {
            return;
        }
        if (!permission.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    const formatLabel = (label) => {
        if (!label || typeof label !== "string") {
            return "Object";
        }

        return label.charAt(0).toUpperCase() + label.slice(1);
    };

    const buildImageForm = (uri) => {
        const form = new FormData();
        form.append("image", {
            uri,
            name: "frame.jpg",
            type: "image/jpeg",
        });
        return form;
    };

    const normalizeBox = (box, kind) => {
        if (!box || typeof box !== "object") {
            return null;
        }

        const x = typeof box.x === "number"
            ? box.x
            : typeof box.left === "number"
                ? box.left
                : typeof box.x1 === "number"
                    ? box.x1
                    : 0;
        const y = typeof box.y === "number"
            ? box.y
            : typeof box.top === "number"
                ? box.top
                : typeof box.y1 === "number"
                    ? box.y1
                    : 0;
        const width = typeof box.width === "number"
            ? box.width
            : typeof box.w === "number"
                ? box.w
                : typeof box.x2 === "number" && typeof box.x1 === "number"
                    ? box.x2 - box.x1
                    : 0;
        const height = typeof box.height === "number"
            ? box.height
            : typeof box.h === "number"
                ? box.h
                : typeof box.y2 === "number" && typeof box.y1 === "number"
                    ? box.y2 - box.y1
                    : 0;

        if (width <= 0 || height <= 0) {
            return null;
        }

        return {
            ...box,
            kind,
            x,
            y,
            width,
            height,
            confidence: typeof box.confidence === "number"
                ? box.confidence
                : typeof box.score === "number"
                    ? box.score
                    : typeof box.probability === "number"
                        ? box.probability
                        : 0,
            label: typeof box.label === "string"
                ? box.label
                : typeof box.name === "string"
                    ? box.name
                    : typeof box.person_name === "string"
                        ? box.person_name
                        : kind,
        };
    };

    const getBestBox = (items) => {
        return items.reduce((currentBest, item) => {
            if (!currentBest) {
                return item;
            }

            const currentScore = typeof item?.confidence === "number" ? item.confidence : 0;
            const bestScore = typeof currentBest?.confidence === "number" ? currentBest.confidence : 0;
            return currentScore > bestScore ? item : currentBest;
        }, null);
    };

    const isGenericFaceLabel = (label) => {
        const normalized = (label || "").trim().toLowerCase();
        return ["face", "person", "human", "unknown"].includes(normalized);
    };

    const buildDetectionSummary = (faceBox, objectBox) => {
        const summaries = [];

        if (faceBox) {
            const faceLabel = formatLabel(faceBox.label);
            summaries.push(isGenericFaceLabel(faceLabel) ? faceDetectedText : `${faceLabel} ${homeStrings.detectedSuffix}`);
        }

        if (objectBox) {
            const objectLabel = formatLabel(objectBox.label);
            summaries.push(`${objectLabel} ${homeStrings.detectedSuffix}`);
        }

        if (summaries.length === 0) {
            return {
                status: "noDetections",
                summary: "",
                speech: noDetectionsSpeech,
            };
        }

        return {
            status: "detected",
            summary: summaries.join(" | "),
            speech: summaries.join(". "),
        };
    };

    const speakDetection = useCallback((text) => {
        if (!text || lastSpokenRef.current === text) {
            return;
        }

        lastSpokenRef.current = text;
        Speech.stop();
        Speech.speak(text, {
            language: languageConfig.speechLocale,
            rate: speechRate,
            pitch: voiceType === "female" ? 1.12 : 0.9,
            voice: speechVoiceId || undefined,
            volume: 1,
            useApplicationAudioSession: false,
        });
    }, [languageConfig.speechLocale, speechRate, speechVoiceId, voiceType]);

    const runDetection = useCallback(async () => {
        if (isDetectingRef.current || !cameraRef.current || !permission?.granted) {
            return;
        }

        try {
            isDetectingRef.current = true;
            setIsDetecting(true);

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.5,
                skipProcessing: true,
            });

            if (!photo?.uri) {
                return;
            }

            if (photo.width && photo.height) {
                setImageSize({ width: photo.width, height: photo.height });
            }

            const [objectsResult, facesResult] = await Promise.all([
                apiRequest("/detect/objects", {
                    method: "POST",
                    body: buildImageForm(photo.uri),
                    isForm: true,
                }),
                apiRequest("/detect/faces", {
                    method: "POST",
                    body: buildImageForm(photo.uri),
                    isForm: true,
                }),
            ]);

            if (!isFocused) {
                isDetectingRef.current = false;
                setIsDetecting(false);
                return;
            }

            const objectBoxes = Array.isArray(objectsResult?.boxes)
                ? objectsResult.boxes.map((box) => normalizeBox(box, "object")).filter(Boolean)
                : [];
            const faceBoxes = Array.isArray(facesResult?.boxes)
                ? facesResult.boxes.map((box) => normalizeBox(box, "face")).filter(Boolean)
                : Array.isArray(facesResult?.faces)
                    ? facesResult.faces.map((box) => normalizeBox(box, "face")).filter(Boolean)
                    : [];

            setBoxes([...faceBoxes, ...objectBoxes]);

            const bestObjectBox = getBestBox(objectBoxes);
            const bestFaceBox = getBestBox(faceBoxes);
            const detectionResult = buildDetectionSummary(bestFaceBox, bestObjectBox);

            setDetectionStatus(detectionResult.status);
            setDetectedSummary(detectionResult.summary);
            speakDetection(detectionResult.speech);
        } catch (error) {
            setDetectionStatus("unavailable");
            setDetectedSummary("");
        } finally {
            isDetectingRef.current = false;
            setIsDetecting(false);
        }
    }, [permission?.granted, isFocused, speakDetection, homeStrings.detectedSuffix, faceDetectedText, noDetectionsSpeech]);

    const scaleBox = (box) => {
        if (!layout.height || !imageSize.height) {
            return box;
        }

        const viewRatio = layout.width / layout.height;
        const imageRatio = imageSize.width / imageSize.height;

        let scale;
        let offsetX = 0;
        let offsetY = 0;

        if (imageRatio > viewRatio) {
            scale = layout.height / imageSize.height;
            const renderedWidth = imageSize.width * scale;
            offsetX = (layout.width - renderedWidth) / 2;
        } else {
            scale = layout.width / imageSize.width;
            const renderedHeight = imageSize.height * scale;
            offsetY = (layout.height - renderedHeight) / 2;
        }

        return {
            ...box,
            x: (box.x * scale) + offsetX,
            y: (box.y * scale) + offsetY,
            width: box.width * scale,
            height: box.height * scale,
        };
    };

    useEffect(() => {
        let timer = null;

        if (isFocused) {
            timer = setTimeout(() => {
                setIsCameraMounted(true);
            }, 300);
        } else {
            setIsCameraMounted(false);
            setIsCameraReady(false);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [isFocused]);

    useEffect(() => {
        let timeoutId = null;
        let active = true;

        const tick = async () => {
            if (!active || !isFocused || !isCameraReady || !isCameraMounted) {
                return;
            }

            await runDetection();

            if (active) {
                timeoutId = setTimeout(tick, 2500);
            }
        };

        if (isFocused && permission?.granted && isCameraReady && isCameraMounted) {
            tick();
        } else {
            setBoxes([]);
            isDetectingRef.current = false;
            setIsDetecting(false);
        }

        return () => {
            active = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isFocused, permission?.granted, isCameraReady, isCameraMounted, runDetection]);

    useEffect(() => {
        if (detectionStatus === "scanning") {
            return;
        }

        if (detectionStatus === "noDetections") {
            speakDetection(noDetectionsSpeech);
            return;
        }

        if (detectionStatus === "detected" && detectedSummary) {
            speakDetection(detectedSummary);
        }
    }, [detectionStatus, detectedSummary, speakDetection, noDetectionsSpeech]);

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    const guardedNavigate = (routeName) => {
        if (!isLoggedIn) {
            navigation.navigate("Login", { redirectTo: routeName });
            return;
        }

        navigation.navigate(routeName);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logoText}>{homeStrings.appTitle}</Text>
                <TouchableOpacity onPress={() => guardedNavigate("Settings")}>
                    <Settings size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.alertBadge}>
                    <Text style={styles.alertText}>
                        {isDetecting
                            ? homeStrings.detecting
                            : detectionStatus === "detected" && detectedSummary
                                ? detectedSummary
                                : detectionStatus === "noDetections"
                                    ? noDetectionsText
                                    : detectionStatus === "unavailable"
                                        ? homeStrings.unavailable
                                        : homeStrings.scanning}
                    </Text>
                </View>

                <AudioVisualizer />

                <View
                    style={styles.cameraPreview}
                    onLayout={(event) => {
                        const { width, height } = event.nativeEvent.layout;
                        setLayout({ width, height });
                    }}
                >
                    {permission?.granted && isCameraMounted ? (
                        <CameraView
                            key={isFocused ? "camera-active" : "camera-inactive"}
                            onCameraReady={() => {
                                setIsCameraReady(true);
                            }}
                            ref={cameraRef}
                            style={styles.camera}
                            facing="back"
                        />
                    ) : (
                        <View style={styles.cameraFallback}>
                            <Text style={styles.cameraFallbackText}>{homeStrings.cameraFallback}</Text>
                        </View>
                    )}

                    <Svg width={layout.width} height={layout.height} style={styles.overlay} pointerEvents="none">
                        {boxes.map((rawBox, index) => {
                            const box = scaleBox(rawBox);
                            const label = `${formatLabel(rawBox.label)} ${Math.round((rawBox.confidence || 0) * 100)}%`;
                            const labelX = box.x + 8;
                            const labelY = Math.max(16, box.y - 8);
                            const strokeColor = rawBox.kind === "face" ? "#2DD4BF" : "#F59E0B";
                            const fillColor = rawBox.kind === "face"
                                ? "rgba(45, 212, 191, 0.08)"
                                : "rgba(245, 158, 11, 0.08)";

                            return (
                                <React.Fragment key={`${rawBox.kind || "box"}-${rawBox.label}-${index}`}>
                                    <Rect
                                        x={box.x}
                                        y={box.y}
                                        width={box.width}
                                        height={box.height}
                                        stroke={strokeColor}
                                        strokeWidth={3}
                                        fill={fillColor}
                                        rx={10}
                                        ry={10}
                                    />
                                    <SvgText x={labelX} y={labelY} fill={strokeColor} fontSize={16} fontWeight="700">
                                        {label}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}
                    </Svg>
                </View>
            </View>

            <View style={styles.micSection}>
                <TouchableOpacity style={styles.micButton} onPress={runDetection}>
                    {isDetecting ? <ActivityIndicator color="#0F172A" /> : <Mic size={32} color="#0F172A" />}
                </TouchableOpacity>
            </View>

            <View style={styles.bottomGrid}>
                <TouchableOpacity style={styles.gridItem} onPress={() => guardedNavigate("RegisterFaces")}>
                    <UserPlus size={28} color="#FFFFFF" />
                    <Text style={styles.gridLabel}>{navStrings.faces}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => guardedNavigate("AddObject")}>
                    <PackagePlus size={28} color="#FFFFFF" />
                    <Text style={styles.gridLabel}>{navStrings.objects}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => guardedNavigate("Logs")}>
                    <ListTodo size={28} color="#FFFFFF" />
                    <Text style={styles.gridLabel}>{navStrings.logs}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
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
    overlay: {
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

export default HomeScreen;
