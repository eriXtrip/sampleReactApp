// components/SplashAnimation.jsx
import React, { useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = 100;

export default function SplashAnimation() {
  const circle1Scale = useRef(new Animated.Value(0.1)).current;
  const circle2Scale = useRef(new Animated.Value(0.1)).current;
  const logo = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('Starting splash screen animations');
    
    Animated.sequence([
      Animated.timing(circle1Scale, { 
        toValue: 12, 
        duration: 600, 
        easing: Easing.out(Easing.quad), 
        useNativeDriver: true 
      }),
      Animated.timing(circle2Scale, { 
        toValue: 12, 
        duration: 600, 
        easing: Easing.out(Easing.quad), 
        useNativeDriver: true 
      }),
      Animated.timing(fade, { 
        toValue: 0, 
        duration: 400, 
        useNativeDriver: true 
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logo, { 
          toValue: 1.08, 
          duration: 800, 
          useNativeDriver: true 
        }),
        Animated.timing(logo, { 
          toValue: 1, 
          duration: 800, 
          useNativeDriver: true 
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle1, { transform: [{ scale: circle1Scale }], opacity: fade }]} />
      <Animated.View style={[styles.circle2, { transform: [{ scale: circle2Scale }], opacity: fade }]} />
      <Animated.Image
        source={require('../assets/img/Login_Logo.png')}
        style={[styles.logo, { transform: [{ scale: logo }], opacity: fade }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#3B82F6',
    top: height / 2 - CIRCLE_SIZE / 2,
    left: width / 2 - CIRCLE_SIZE / 2,
  },
  circle2: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#ffffff',
    top: height / 2 - CIRCLE_SIZE / 2,
    left: width / 2 - CIRCLE_SIZE / 2,
  },
  logo: {
    width: 220,
    height: 220,
  },
});