import React, { useContext } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { ProfileContext } from '../contexts/ProfileContext';
import { Colors } from '../constants/Colors';

const ThemedStatusBar = ({ themeColors }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const needsInvertedStatusBar = themeColors === 'system' ? colorScheme === 'light' : themeColors === 'light';

  return Platform.OS === 'android' ? (
    <View
      style={{
        height: 40,
        backgroundColor: theme.statusbarBackground,
      }}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={needsInvertedStatusBar ? 'dark-content' : 'light-content'}
      />
    </View>
  ) : null;
};

export default ThemedStatusBar;