import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Confetti from "./Confetti"; // ✅ import new component
import { lightenColor } from '../utils/colorUtils';

const BadgeReward = ({ visible, badge, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const confettiRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Badge animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti animation
      confettiRef.current?.play();
    } else {
      scaleAnim.setValue(0);
      translateYAnim.setValue(50);
      confettiRef.current?.reset();
    }
  }, [visible]);

  if (!badge) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        {/* 🎉 Confetti component */}
        <Confetti ref={confettiRef} />

        {/* Badge Container */}
        <Animated.View
          style={[
            styles.container,
            { borderColor: badge.color },
            { backgroundColor: badge.color ? lightenColor(badge.color, 0.85) : styles.container.backgroundColor },
            { transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>

          <View style={[styles.achievementBadge, { borderColor: badge.color }]}>
            <Ionicons name={badge.icon} size={50} color={badge.color} />
          </View>

          <Text style={[styles.title, { color: badge.color }]}>{badge.title}</Text>
          <Text style={styles.subtext}>{badge.subtext}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffffc6"
  },
  container: {
    width: "85%",
    maxWidth: 350,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9E6",
    borderWidth: 3,
    zIndex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 999,
  },
  achievementBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
    color: "#333",
  },
  subtext: {
    fontSize: 18,
    marginVertical: 5,
    color: "#666",
    textAlign: "center",
  },
});

export default BadgeReward;
