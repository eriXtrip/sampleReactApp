import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ApiUrlContext } from '../contexts/ApiUrlContext';
import { useSQLiteContext } from 'expo-sqlite';

const OfflineBanner = () => {
  const { isOffline, isReachable, isApiLoaded } = useContext(ApiUrlContext);
  const [heightAnim] = useState(new Animated.Value(0)); // height animation
  const db = useSQLiteContext();

  useEffect(() => {
    if (!db) {
      console.log("⏱ No DB available for sync");
      return;
    }
  }, [db]);

  // Animate offline banner height
  useEffect(() => {
    const show = isOffline || !isReachable;

    Animated.timing(heightAnim, {
      toValue: show ? 19 : 0, // banner height in px
      duration: 300,
      useNativeDriver: false, // MUST be false for height
    }).start();
  }, [isOffline, isReachable]);

  // Don't render if API not loaded
  if (!isApiLoaded) return null;

  return (
    <Animated.View
      style={{
        width: '100%',
        backgroundColor: '#898989ff',
        alignItems: 'center',
        overflow: 'hidden',
        height: heightAnim,
      }}
    >
      <Text style={styles.text}>
        {isOffline ? 'Offline mode' : 'Connecting...'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    paddingVertical: 2,
  },
});

export default OfflineBanner;
