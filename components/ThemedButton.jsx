import { StyleSheet, Pressable } from 'react-native'
import { Colors } from '../constants/Colors'

const ThemedButton = ({ style, ...props}) => {
  return (
    <Pressable 
        style={({ pressed }) => [styles.btn, pressed && styles.btnprs, style]}
        {...props}
    />
  )
}

export default ThemedButton

const styles = StyleSheet.create({
    btn: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 6,
        marginVertical: 10,
    },

    btnprs: {
        opacity: 0.5,
    }
})