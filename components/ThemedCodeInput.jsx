import React from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { useColorScheme } from 'react-native'
import { Colors } from '../constants/Colors'
import { ProfileContext } from '../contexts/ProfileContext';
import { useContext } from 'react';

const ThemedCodeInput = React.forwardRef((props, ref) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  
  // Create dynamic styles object
  const inputStyles = {
    width: 45,
    height: 50,
    fontSize: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    color: theme.text,
    borderColor: theme.iconColor,
    backgroundColor: theme.uiBackground,
  }

  return (
    <TextInput
      ref={ref}
      style={[inputStyles, props.style]} // Merge with any passed styles
      placeholderTextColor={theme.placeholder || '#9ca3af'} // Added fallback
      keyboardType="number-pad"
      maxLength={1}
      textAlign="center"
      selectTextOnFocus
      {...props}
    />
  )
})

export default ThemedCodeInput