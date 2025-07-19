// SAMPLEREACTAPP/app/index.jsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../hooks/useUser'
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

  const circle1Scale = useRef(new Animated.Value(0.1)).current;
  const circle2Scale = useRef(new Animated.Value(0.1)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start circle animations
    Animated.sequence([
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
    ]).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        if (user) {
            router.replace('/home');
        }else{
          router.replace('/login');
        }
      });
    });

    // Logo pulse animation (loop)
    Animated.loop(
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
    ).start();
  }, []);

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
