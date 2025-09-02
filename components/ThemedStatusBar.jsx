import React, { useEffect, useState, useContext } from 'react';
import { View, StatusBar, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { ApiUrlContext } from '../contexts/ApiUrlContext';

const ThemedStatusBar = ({ themeColors }) => {
  const colorScheme = useColorScheme();
  const { isOffline, isReachable, isApiLoaded } = useContext(ApiUrlContext);
  const [bannerHeight] = useState(new Animated.Value(0));

  const themeKey =
    themeColors === 'system'
      ? colorScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeColors;

  const theme = Colors[themeKey] || Colors.light;
  const needsInvertedStatusBar =
    themeColors === 'system'
      ? colorScheme === 'light'
      : themeColors === 'light';

  if (Platform.OS !== 'android') return null;

  // Show banner if offline or server unreachable
  const showBanner = isOffline || !isReachable;

  useEffect(() => {
    Animated.timing(bannerHeight, {
      toValue: showBanner ? 25 : 0, // adjust height as needed
      duration: 300,
      useNativeDriver: false, // height animation requires false
    }).start();
  }, [showBanner]);

  return (
    <View>
      {/* Status Bar */}
      <View style={{ height: 40, backgroundColor: theme.statusbarBackground }}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={needsInvertedStatusBar ? 'dark-content' : 'light-content'}
        />
      </View>

      {/* Animated Offline Banner */}
      {isApiLoaded && (
        <Animated.View style={[styles.banner, { height: bannerHeight, backgroundColor: theme.bannerBackground }]}>
          {showBanner && (
            <Text style={styles.text}>
              {isOffline ? 'Offline Mode' : 'Server cannot be reached'}
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ThemedStatusBar;