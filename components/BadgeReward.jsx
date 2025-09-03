import React, { useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ConfettiCannon from "react-native-confetti-cannon";

const screenHeight = Dimensions.get("window").height;

const BadgeReward = ({ visible, badge, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current; // for scaling badge
  const translateYAnim = useRef(new Animated.Value(50)).current; // for vertical slide

  useEffect(() => {
    if (visible) {
      // Animate badge entrance: slide + scale
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
    } else {
      scaleAnim.setValue(0);
      translateYAnim.setValue(50);
    }
  }, [visible]);

  if (!badge) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        {/* 🎉 Confetti Left */}
        <ConfettiCannon
          count={80}
          origin={{ x: 0, y: 0 }}
          fadeOut={true}
          fallSpeed={2500}
          explosionSpeed={150}
          autoStart={true}
        />

        {/* 🎉 Confetti Right */}
        <ConfettiCannon
          count={80}
          origin={{ x: Dimensions.get("window").width, y: 0 }}
          fadeOut={true}
          fallSpeed={2500}
          explosionSpeed={150}
          autoStart={true}
        />

        {/* Badge Container Animated at Center */}
        <Animated.View
          style={[
            styles.container,
            { borderColor: badge.color },
            { transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>

          {/* Badge Icon */}
          <View style={[styles.achievementBadge, { borderColor: badge.color }]}>
            <Ionicons name={badge.icon} size={50} color={badge.color} />
          </View>

          {/* Text */}
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
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxWidth: 350,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: "#FFF9E6",
    borderWidth: 3,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
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
