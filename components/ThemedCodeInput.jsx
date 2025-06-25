import React from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { useColorScheme } from 'react-native'
import { Colors } from '../constants/Colors'

const ThemedCodeInput = React.forwardRef((props, ref) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  
  return (
    <TextInput
      ref={ref}
      style={[
        styles.codeInput,
        { 
          color: theme.text,
          borderColor: theme.border,
          backgroundColor: theme.inputBackground,
          // Add any additional theme-specific styles here
        }
      ]}
      placeholderTextColor={theme.placeholder}
      keyboardType="number-pad"
      maxLength={1}
      textAlign="center"
      selectTextOnFocus
      {...props}
    />
  )
})

export default ThemedCodeInput

const styles = StyleSheet.create({
  codeInput: {
    width: 45,
    height: 50,
    fontSize: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
})