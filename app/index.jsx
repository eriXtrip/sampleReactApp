// SAMPLEREACTAPP/app/index.jsx

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../hooks/useUser';
import { UserProvider } from "../contexts/UserContext";
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '../local-database/services/database';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = 100;

const Index = () => {
  return (
    <SQLiteProvider databaseName="mquest.db" onInit={initializeDatabase}>
      <UserProvider>
        <SplashScreen />
      </UserProvider>
    </SQLiteProvider>
  );
};

export default Index;

const SplashScreen = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [targetRoute, setTargetRoute] = useState(null);
  const [animationsCompleted, setAnimationsCompleted] = useState(false);

  const circle1Scale = useRef(new Animated.Value(0.1)).current;
  const circle2Scale = useRef(new Animated.Value(0.1)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animation effect
  useEffect(() => {
    console.log('Starting animations');
    // Run finite animations
    const mainAnimations = Animated.sequence([
      Animated.timing(circle1Scale, {
        toValue: 10,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(circle2Scale, {
        toValue: 10,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 580,
        useNativeDriver: true,
      }),
    ]);

    // Run looped logo pulse separately
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    // Start both animations
    mainAnimations.start(() => {
      console.log('Main animations completed');
      setAnimationsCompleted(true);
    });
    pulseAnimation.start();

    // Stop pulse animation when main animations complete
    return () => {
      console.log('Stopping pulse animation');
      pulseAnimation.stop();
    };
  }, []);

  // User check effect
  useEffect(() => {
    if (!isLoading) {
      console.log('User check complete, user:', user);
      setTargetRoute(user ? '/home' : '/login');
    }
  }, [isLoading, user]);

  // Navigation effect
  useEffect(() => {
    if (targetRoute && animationsCompleted) {
      console.log('Navigating to:', targetRoute);
      router.replace(targetRoute);
    }
  }, [targetRoute, animationsCompleted, router]);

  return (
    <View style={styles.container}>
      {/* Circle 1 */}
      <Animated.View
        style={[
          styles.expandingCircle,
          {
            transform: [{ scale: circle1Scale }],
            opacity: fadeAnim,
          },
        ]}
      />
      {/* Circle 2 */}
      <Animated.View
        style={[
          styles.expandingCircle,
          {
            backgroundColor: '#ffffffff', // slightly lighter
            transform: [{ scale: circle2Scale }],
            opacity: fadeAnim,
          },
        ]}
      />
      {/* Logo with pulse */}
      <Animated.Image
        source={require('../assets/img/Login_Logo.png')}
        style={[
          styles.logo,
          {
            transform: [{ scale: logoPulse }],
            opacity: fadeAnim,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  expandingCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#3B82F6',
    top: height / 2 - CIRCLE_SIZE / 2,
    left: width / 2 - CIRCLE_SIZE / 2,
    zIndex: 0,
  },
  logo: {
    width: 200,
    height: 200,
    zIndex: 1,
  },
});
