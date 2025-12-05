// components/OfflineBanner.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ApiUrlContext } from '../contexts/ApiUrlContext';
import { triggerLocalNotification } from '../utils/notificationUtils';

const OfflineBanner = () => {
  const { 
    isOffline, 
    isReachable, 
    isApiLoaded, 
    networkType,
    refreshApiUrl 
  } = useContext(ApiUrlContext);
  
  const [heightAnim] = useState(new Animated.Value(0));
  const [message, setMessage] = useState('');
  const prevReachableRef = useRef(null);

  // Show toast notifications on connection changes
  useEffect(() => {
    if (prevReachableRef.current === false && isReachable === true) {
      // Went from unreachable to reachable
      triggerLocalNotification('Connected', 'Server connection restored', 'success', {
        duration: 3000,
      });
    } else if (prevReachableRef.current === true && isReachable === false && !isOffline) {
      // Went from reachable to unreachable (but still have internet)
      triggerLocalNotification('Server Unavailable', 'Cannot connect to server', 'warning', {
        duration: 4000,
      });
    }
    
    prevReachableRef.current = isReachable;
  }, [isReachable, isOffline]);

  // Update banner message based on state
  useEffect(() => {
    if (isOffline) {
      setMessage(`Offline mode`); //${networkType || 'No connection'}
    } else if (!isReachable) {
      setMessage('Connecting to server...');
    } else {
      setMessage('Online');
    }
  }, [isOffline, isReachable, networkType]);

  // Animate banner height
  useEffect(() => {
    const show = isOffline || !isReachable;
    const targetHeight = show ? 28 : 0;
    
    Animated.timing(heightAnim, {
      toValue: targetHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOffline, isReachable]);

  if (!isApiLoaded) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          height: heightAnim,
          backgroundColor: isOffline ? '#8989894b' : !isReachable ? '#FFD93D' : '#6BCF7F',
        }
      ]}
    >
      <Text style={styles.text}>{message}</Text>
      
      {/* Refresh button when offline but has connection */}
      {isOffline && networkType && networkType !== 'none' && (
        <Text 
          style={styles.refreshText}
          onPress={refreshApiUrl}
        >
          Retry
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  refreshText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
});

export default OfflineBanner;