import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const QuizHeader = ({ onExit, onGrid, theme, subtitle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit}>
          <Ionicons name="close-outline" size={28} color={theme.text} />
        </TouchableOpacity>
        {subtitle && (
          <View style={styles.subtitleContainer}>
            <Text style={[styles.subtitle, { color: theme.text }]}>
              {subtitle}
            </Text>
          </View>
        )}
        <TouchableOpacity onPress={onGrid}>
          <Ionicons name="grid-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: 'relative', // Needed for absolute positioning of subtitle
  },
  subtitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#48cae4", // Default color, can be overridden by theme
  },
});

export default QuizHeader;