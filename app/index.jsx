// app/index.jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../hooks/useUser';
import { UserProvider } from "../contexts/UserContext";
import { SQLiteProvider, useSQLiteContext  } from 'expo-sqlite';
import { initializeDatabase } from '../local-database/services/database';
import { setupNetworkSyncListener, triggerSyncIfOnline, markDbInitialized } from '../local-database/services/syncUp.js';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = 100;

const Index = () => {

  return (
    <SQLiteProvider databaseName="mydatabase.db" onInit={initializeDatabase}>
      <UserProvider>
        <SplashScreen />
      </UserProvider>
    </SQLiteProvider>
  );
};

export default Index;

// 1. Setup NetInfo listener once
const SyncInitializer = () => {
  useEffect(() => {
    const unsubscribe = setupNetworkSyncListener();
    return unsubscribe;
  }, []);
  return null;
};

const SplashScreen = () => {
  const db = useSQLiteContext();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [targetRoute, setTargetRoute] = useState(null);
  const [animationsCompleted, setAnimationsCompleted] = useState(false);

  const circle1Scale = useRef(new Animated.Value(0.1)).current;
  const circle2Scale = useRef(new Animated.Value(0.1)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animation
  useEffect(() => {
    const mainAnimations = Animated.sequence([
      Animated.timing(circle1Scale, { toValue: 10, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(circle2Scale, { toValue: 10, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 580, useNativeDriver: true }),
    ]);

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.1, duration: 300, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    );

    mainAnimations.start(() => setAnimationsCompleted(true));
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // 2. When user is loaded → mark DB ready + trigger sync
  useEffect(() => {
    if (!isLoading) {
      setTargetRoute(user ? '/home' : '/login');
      markDbInitialized();  // ← Enable sync
      triggerSyncIfOnline(db); // ← TRIGGER SYNC NOW
    }
  }, [isLoading, user]);

  // 3. Navigate when ready
  useEffect(() => {
    if (targetRoute && animationsCompleted) {
      router.replace(targetRoute);
    }
  }, [targetRoute, animationsCompleted, router]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.expandingCircle, { transform: [{ scale: circle1Scale }], opacity: fadeAnim }]} />
      <Animated.View style={[styles.expandingCircle, { backgroundColor: '#ffffffff', transform: [{ scale: circle2Scale }], opacity: fadeAnim }]} />
      <Animated.Image
        source={require('../assets/img/Login_Logo.png')}
        style={[styles.logo, { transform: [{ scale: logoPulse }], opacity: fadeAnim }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
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
  logo: { width: 200, height: 200, zIndex: 1 },
});