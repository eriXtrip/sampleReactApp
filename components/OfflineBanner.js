// components/OfflineBanner.js

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useContext } from 'react';
import { ApiUrlContext } from '../contexts/ApiUrlContext';

const OfflineBanner = () => {
  const { isOffline, isReachable, isApiLoaded } = useContext(ApiUrlContext);
  const [fadeAnim] = useState(new Animated.Value(0));

  console.log('🛠 OfflineBanner mounted with isOffline:', isOffline, 'isReachable:', isReachable, 'isApiLoaded:', isApiLoaded);

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
    backgroundColor: '#6666668e',
    paddingVertical: 2,
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