import { useState } from 'react'
import { TextInput, StyleSheet, View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import { Colors } from '../constants/Colors'
import { ProfileContext } from '../contexts/ProfileContext';
import { useContext } from 'react';

const ThemedPasswordInput = ({
  value,
  onChangeText,
  placeholder = 'Enter password',
  style = [],
  ...rest
}) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const [showPassword, setShowPassword] = useState(false)

  return (
    <View style={styles.passwordContainer}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        placeholder={placeholder}
        placeholderTextColor={theme.iconColor}
        contextMenuHidden={true} //disable copy&paste
        style={[
          styles.input,
          {
            backgroundColor: theme.uiBackground,
            color: '#000000',
            borderColor: theme.iconColor,
          },
          style,
        ]}
        {...rest}
      />
      <Pressable
        onPress={() => setShowPassword(!showPassword)}
        style={[styles.eyeIcon, { backgroundColor: theme.uiBackground }]}
      >
        <Ionicons
          name={showPassword ? 'eye-off' : 'eye'}
          size={20}
          color={theme.iconColor}
        />
      </Pressable>
    </View>
  )
}

export default ThemedPasswordInput

const styles = StyleSheet.create({
  passwordContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 5,
    borderRadius: 15,
  },
})
