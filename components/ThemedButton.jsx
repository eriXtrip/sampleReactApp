import { StyleSheet, Pressable, Text } from 'react-native'
import { useColorScheme } from 'react-native'
import { Colors } from '../constants/Colors'

const ThemedButton = ({ children, style, textStyle, ...props }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const defaultTextStyle = {
    color: theme.buttonText,
    fontWeight: 'bold'
  }

  const buttonStyles = {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 6,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <Pressable 
      style={({ pressed }) => [
        buttonStyles, 
        pressed && styles.btnprs, 
        style
      ]}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={[defaultTextStyle, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

export default ThemedButton

const styles = StyleSheet.create({
  btnprs: {
    opacity: 0.5,
  }
})