import React from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TryAgainModal = ({ visible, onClose }) => {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Ionicons name="sad-outline" size={60} color="#ff6b6b" />
          <Text style={styles.title}>Better Luck Next Time!</Text>
          <Text style={styles.message}>
            Don’t worry, keep practicing and you’ll get it! 🌟
          </Text>
          <Text style={styles.close} onPress={onClose}>
            Try Again
          </Text>
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
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: "80%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#ff6b6b",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    color: "#444",
    marginBottom: 15,
  },
  close: {
    fontSize: 18,
    color: "#0077b6",
    fontWeight: "600",
  },
});

export default TryAgainModal;
