import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const QuizHeader = ({ onExit, onGrid, theme }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onExit}>
        <Ionicons name="close-outline" size={28} color={theme.text} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onGrid}>
        <Ionicons name="grid-outline" size={28} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
});

export default QuizHeader;
