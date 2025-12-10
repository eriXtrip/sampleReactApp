// app/index.jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { UserProvider } from '../contexts/UserContext';
import { useUser } from '../hooks/useUser';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initializeDatabase } from '../local-database/services/database';
import { setupNetworkSyncListener, triggerSyncIfOnline } from '../local-database/services/syncUp.js';
import { appLifecycleManager } from '../utils/appLifecycleManager';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = 100;

const Index = () => {
  return (
    <SQLiteProvider 
      databaseName="mquest.db" 
      onInit={initializeDatabase}
      useSuspense={false}
    >
      <UserProvider>
        <SplashScreen />
      </UserProvider>
    </SQLiteProvider>
  );
};

export default Index;

const SplashScreen = () => {
  const sqliteContext = useSQLiteContext();
  const db = sqliteContext?.db;
  const initialized = sqliteContext?.initialized || false;
  const router = useRouter();
  const { user, isLoading, checkAuthStatus } = useUser();
  const [targetRoute, setTargetRoute] = useState(null);
  const [animationsCompleted, setAnimationsCompleted] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [syncTriggered, setSyncTriggered] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  const circle1Scale = useRef(new Animated.Value(0.1)).current;
  const circle2Scale = useRef(new Animated.Value(0.1)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // DEBUG: Log database status
  useEffect(() => {
    console.log('🔄 SplashScreen - Database Status:', { 
      hasSqliteContext: !!sqliteContext,
      db: db ? '✓ Available' : '✗ Undefined', 
      initialized,
      isDbReady 
    });
  }, [sqliteContext, db, initialized, isDbReady]);

  // Set up network listener once
  useEffect(() => {
    console.log('📡 Setting up network listener');
    const unsubscribe = setupNetworkSyncListener();
    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  // Initialize database and wait for it to be ready
  useEffect(() => {
    if (db && initialized && !isDbReady) {
      console.log('✅ Database is now fully ready!');
      setIsDbReady(true);
      
      // Initialize app lifecycle manager
      if (db && !appLifecycleManager.isInitialized) {
        appLifecycleManager.initialize(db);
      }
    }
  }, [db, initialized, isDbReady]);

  // Check auth status once DB is ready
  useEffect(() => {
    if (isDbReady && !userChecked && checkAuthStatus) {
      console.log('🔐 Checking authentication status...');
      checkAuthStatus();
      setUserChecked(true);
    }
  }, [isDbReady, userChecked, checkAuthStatus]);

  // Animation
  useEffect(() => {
    console.log('🎬 Starting splash screen animations');
    const mainAnimations = Animated.sequence([
      Animated.timing(circle1Scale, { 
        toValue: 10, 
        duration: 500, 
        easing: Easing.out(Easing.quad), 
        useNativeDriver: true 
      }),
      Animated.timing(circle2Scale, { 
        toValue: 10, 
        duration: 500, 
        easing: Easing.out(Easing.quad), 
        useNativeDriver: true 
      }),
      Animated.timing(fadeAnim, { 
        toValue: 0, 
        duration: 580, 
        useNativeDriver: true 
      }),
    ]);

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { 
          toValue: 1.1, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.timing(logoPulse, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
      ])
    );

    mainAnimations.start(() => {
      console.log('✅ Animations completed');
      setAnimationsCompleted(true);
    });
    pulseAnimation.start();

    return () => {
      mainAnimations.stop();
      pulseAnimation.stop();
    };
  }, []);

  // Determine navigation when everything is ready
  useEffect(() => {
    console.log('📍 Navigation check:', {
      isDbReady,
      isLoading,
      userChecked,
      animationsCompleted,
      user: user ? 'logged in' : 'not logged in'
    });
    
    if (isDbReady && !isLoading && animationsCompleted && userChecked) {
      const route = user ? '/home' : '/login';
      console.log('🎯 Setting target route to:', route);
      setTargetRoute(route);
      
      // Trigger sync if user is logged in
      if (user && db && !syncTriggered) {
        console.log('🔄 Triggering initial sync');
        triggerSyncIfOnline(db);
        setSyncTriggered(true);
      }
    }
  }, [isDbReady, isLoading, userChecked, animationsCompleted, user, db, syncTriggered]);

  // Navigate when target route is set
  useEffect(() => {
    if (targetRoute) {
      console.log('🚀 Navigating to:', targetRoute);
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        router.replace(targetRoute);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [targetRoute, router]);

  // Fallback navigation after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!targetRoute) {
        console.log('⚠️ Navigation timeout - forcing to login');
        router.replace('/login');
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [targetRoute, router]);

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
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden' 
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
    zIndex: 1 
  },
});