// components/ThemedTextInput.jsx
import { View, TextInput, StyleSheet, Pressable } from 'react-native'
import { useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Colors } from '../constants/Colors'
import { ProfileContext } from '../contexts/ProfileContext';
import { useContext } from 'react';

const ThemedTextInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secure = false,
  autoCapitalize = 'sentences',
}) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  return (
    <View style={secure ? styles.Container : null}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.uiBackground,
            color: '#000000',
            borderColor: theme.iconColor,
            paddingRight: secure ? 40 : 15,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.iconColor}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  )
}

export default ThemedTextInput

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  Container: {
    position: 'relative',
  },
})
