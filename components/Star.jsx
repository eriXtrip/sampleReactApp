import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Dimensions, StyleSheet, View, TouchableOpacity, Text, Animated } from "react-native";
import LottieView from "lottie-react-native";

const Star = forwardRef(({ style, onClose, ...props }, ref) => {
  const animationRef = useRef(null);
  const [showButton, setShowButton] = useState(false);
  const [showComponent, setShowComponent] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const componentFadeAnim = useRef(new Animated.Value(1)).current;

  useImperativeHandle(ref, () => ({
    play: () => {
      setShowComponent(true);
      componentFadeAnim.setValue(1);
      animationRef.current?.play();
      setTimeout(() => {
        setShowButton(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 500);
    },
    reset: () => {
      animationRef.current?.reset();
      setShowButton(false);
      setShowComponent(false);
      fadeAnim.setValue(0);
      componentFadeAnim.setValue(1);
    },
  }));

  const handleReceive = () => {
    // Fade out both button and component
    Animated.timing(componentFadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowButton(false);
      setShowComponent(false);
      onClose?.();
    });
  };

  // Don't render anything if component should be hidden
  if (!showComponent) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        style, 
        { opacity: componentFadeAnim }
      ]}
      pointerEvents={showComponent ? "auto" : "none"}
    >
      <LottieView
        ref={animationRef}
        source={require("../assets/animations/Star.json")}
        loop={false}
        autoPlay={false}
        speed={0.5}
        resizeMode="contain"
        pointerEvents="none"
        style={styles.star}
        {...props}
      />

      {showButton && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.receiveButton} onPress={handleReceive}>
            <Text style={styles.receiveText}>Receive</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    top: 0,
    left: 0,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Optional: semi-transparent background
  },
  star: {
    width: Dimensions.get("window").width * 0.9,
    height: Dimensions.get("window").width * 0.9,
  },
  receiveButton: {
    marginTop: 15,
    backgroundColor: "#ffb400",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 3,
  },
  receiveText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default Star;