// components/OfflineBanner.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ApiUrlContext } from '../contexts/ApiUrlContext';
import { useSQLiteContext } from 'expo-sqlite';

const OfflineBanner = () => {
  const { isOffline, isReachable, isApiLoaded } = useContext(ApiUrlContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const db = useSQLiteContext(); // <-- get DB instance from expo-sqlite
  const cleanupRef = useRef(null);

  useEffect(() => {
     if (!db) {
      console.log("⏱ No DB available for sync");
      return;
    }

    
  }, [db, isOffline, isReachable, isApiLoaded]);

  // Animate offline banner
  useEffect(() => {
    const show = isOffline || !isReachable;
    Animated.timing(fadeAnim, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    console.log('📡 Offline status updated:', { isOffline, isReachable });
  }, [isOffline, isReachable]);

  if (!isApiLoaded || (!isOffline && isReachable)) return null;

  return (
    <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
      <Text style={styles.text}>
        {isOffline ? 'OFF LINE MODE' : 'Connecting...'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#8989898e',
    paddingVertical: 3,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default OfflineBanner;
