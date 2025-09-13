import React from "react";
import { View, StyleSheet } from "react-native";

const ProgressBar = ({ current, total }) => {
  const progress = Math.min(Math.max((current + 1) / total, 0), 1); // clamp 0–1
  return (
    <View style={styles.container}>
      {/* Filled progress */}
      <View style={[styles.filled, { flex: progress }]} />

      {/* Remaining progress */}
      <View style={[styles.remaining, { flex: 1 - progress }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 10,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  filled: {
    backgroundColor: "#48cae4", // progress color
    borderRadius: 20,
  },
  remaining: {
    backgroundColor: "#e0e0e0", // background color
    borderRadius: 20,
    marginLeft: 3,
  },
});

export default ProgressBar;
