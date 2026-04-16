import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

const AnimatedWaveBar = ({ delay }) => {
  const heightAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    // Creates a looping animation for each individual bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(heightAnim, {
          toValue: 45, // Max height
          duration: 450,
          delay: delay,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false, // Height doesn't support native driver
        }),
        Animated.timing(heightAnim, {
          toValue: 15, // Min height
          duration: 450,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.waveBar, 
        { height: heightAnim }
      ]} 
    />
  );
};

const AudioVisualizer = () => {
  // We use 4 bars as seen in your image
  const bars = [0, 150, 300, 450]; // Staggered delays in ms

  return (
    <View style={styles.waveContainer}>
      {bars.map((delay, index) => (
        <AnimatedWaveBar key={index} delay={delay} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    gap: 8,
  },
  waveBar: {
    width: 6,
    backgroundColor: "#2DD4BF", // Your teal color
    borderRadius: 3,
  },
});

export default AudioVisualizer;