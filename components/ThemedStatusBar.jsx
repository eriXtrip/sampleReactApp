import React, { useEffect, useState, useContext } from 'react';
import { View, StatusBar, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { ApiUrlContext } from '../contexts/ApiUrlContext';

const ThemedStatusBar = ({ themeColors }) => {
  const colorScheme = useColorScheme();

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

    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ThemedStatusBar;