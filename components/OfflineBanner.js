// components/OfflineBanner.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ApiUrlContext } from '../contexts/ApiUrlContext';
import { startIntervalSync, stopIntervalSync } from '../local-database/services/syncUp.js';
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

    // Start background interval sync
    console.log('⏱ Background sync initialized from OfflineBanner');
    startIntervalSync(db, () => ({
      isOffline,
      isReachable,
      isApiLoaded,
    }));

    // Cleanup on unmount
    return () => {
      console.log('🛑 Cleaning up background sync');
      if (cleanupRef.current) {
        cleanupRef.current(); // Use the stored cleanup function
      } else {
        stopIntervalSync(); // Fallback
      }
      cleanupRef.current = null; // Clear the ref
    };

    
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
        {isOffline ? 'No internet connection' : 'Server cannot be reached'}
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
    zIndex: 1,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default OfflineBanner;
