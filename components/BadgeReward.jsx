import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ConfettiCannon from "react-native-confetti-cannon";

const BadgeReward = ({ visible, badge, onClose }) => {
  if (!badge) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        {/* 🎉 Confetti Left */}
        <ConfettiCannon
          count={80}
          origin={{ x: 0, y: 0 }}
          fadeOut={true}
          fallSpeed={2500}       // slower fall
          explosionSpeed={150}   // smoother explosion
          autoStart={true}
        />

        {/* 🎉 Confetti Right */}
        <ConfettiCannon
          count={80}
          origin={{ x: 400, y: 0 }}  // right side (adjust if needed based on screen width)
          fadeOut={true}
          fallSpeed={2500}
          explosionSpeed={150}
          autoStart={true}
        />

        <View style={[styles.container, { borderColor: badge.color }]}>
          {/* Close Button (Top Right) */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>

          {/* Badge Icon */}
          <View style={[styles.achievementBadge, { borderColor: badge.color }]}>
            <Ionicons name={badge.icon} size={50} color={badge.color} />
          </View>

          {/* Text Content */}
          <Text style={[styles.title, { color: badge.color }]}>{badge.title}</Text>
          <Text style={styles.points}>+{badge.points} Points</Text>
        </View>
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
  points: {
    fontSize: 18,
    marginVertical: 5,
    color: "#666",
  },
});

export default BadgeReward;
