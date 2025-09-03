import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Animated, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";

const screenWidth = Dimensions.get("window").width;

export default function MicPulseButton({ sentence, voiceIdentifier }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Pulse animations
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;

  // Mic breathing animation
  const micScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSpeaking) {
      startPulse(pulseAnim1, 0);
      startPulse(pulseAnim2, 500);
      startMicBreathing();
    } else {
      pulseAnim1.stopAnimation(() => pulseAnim1.setValue(0));
      pulseAnim2.stopAnimation(() => pulseAnim2.setValue(0));
      micScaleAnim.stopAnimation(() => micScaleAnim.setValue(1));
    }
  }, [isSpeaking]);

  const startPulse = (anim, delay) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startMicBreathing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micScaleAnim, {
          toValue: 1.1, // mic grows slightly
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(micScaleAnim, {
          toValue: 1.0, // mic shrinks back
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleSpeak = () => {
    if (!voiceIdentifier) return;
    setIsSpeaking(true);

    Speech.speak(sentence, {
      voice: voiceIdentifier,
      rate: 0.7,
      pitch: 1.0,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Waves scaling/opacity
  const scale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3],
  });
  const opacity1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const scale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3],
  });
  const opacity2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.container}>
      {/* Pulse Waves */}
      <Animated.View
        style={[
          styles.pulse,
          { backgroundColor: "#48cae4", transform: [{ scale: scale1 }], opacity: opacity1 },
        ]}
      />
      <Animated.View
        style={[
          styles.pulse,
          { backgroundColor: "#0077b6", transform: [{ scale: scale2 }], opacity: opacity2 },
        ]}
      />

      {/* Mic Button with breathing effect */}
      <TouchableOpacity onPress={handleSpeak} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.micButton,
            { transform: [{ scale: micScaleAnim }] }, // breathing scale
          ]}
        >
          <Ionicons name="mic-circle" size={100} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pulse: {
    position: "absolute",
    width: screenWidth * 0.3,
    height: screenWidth * 0.3,
    borderRadius: (screenWidth * 0.3) / 2,
  },
  micButton: {
    width: screenWidth * 0.3,
    height: screenWidth * 0.3,
    borderRadius: (screenWidth * 0.3) / 2,
    backgroundColor: "#48cae4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
});
