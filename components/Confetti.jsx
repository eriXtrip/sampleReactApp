import React, { forwardRef } from "react";
import { Dimensions, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

// forwardRef lets BadgeReward control play/reset from outside
const Confetti = forwardRef((props, ref) => {
  return (
    <LottieView
      ref={ref}
      source={require("../assets/animations/Confetti.json")}
      loop={false}
      autoPlay={false}
      resizeMode="cover"
      pointerEvents="none"
      style={styles.confetti}
    />
  );
});

const styles = StyleSheet.create({
  confetti: {
    position: "absolute",
    width: Dimensions.get("window").width * 1.3,
    height: Dimensions.get("window").height,
    top: 0,
    left: 0,
    zIndex: 1,
  },
});

export default Confetti;
