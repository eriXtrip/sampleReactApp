// loadingAnimation.jsx
import React from "react";
import { StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import ThemedView from "./ThemedView"; // adjust path if needed

export default function LoadingAnimation() {
  return (
    <ThemedView style={[styles.container, { justifyContent: "center" }]}>
      <LottieView
        source={require("../assets/animations/Material wave loading.json")}
        autoPlay
        loop
        style={styles.lottie}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  lottie: {
    width: 150,
    height: 150,
  },
});
