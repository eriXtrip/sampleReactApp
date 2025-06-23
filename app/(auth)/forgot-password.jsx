import { useState } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'
import ThemedButton from '../../components/ThemedButton'
import ThemedAlert from '../../components/ThemedAlert'
import ThemedTextInput from '../../components/ThemedTextInput'

const ForgotPassword = () => {
    const router = useRouter()
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    const [email, setEmail] = useState('')
    const [alert, setAlert] = useState({ visible: false, message: '' })

    const showAlert = (msg) => setAlert({ visible: true, message: msg })
    const closeAlert = () => setAlert({ ...alert, visible: false })

    const handleSubmit = () => {
        if (!email.trim()) {
            showAlert('Please enter your email address')
            return
        }

        // Here you would typically call your API to send reset instructions
        console.log('Reset password requested for:', email)
        showAlert('Reset instructions sent to your email')
        setEmail('')
    }

    return (
        <ThemedView style={styles.container} safe={true}>
            {/* Back button */}
            <View style={{ alignItems: 'flex-start', marginBottom: 20 }}>
                <Pressable onPress={() => router.push('/login')}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
            </View>

            {/* Title */}
            <ThemedText title={true} style={styles.title}>Forgot Password?</ThemedText>
            
            {/* Instructions */}
            <ThemedText style={styles.instructions}>
                Enter your email and we'll send you instructions to reset your password.
            </ThemedText>

            <Spacer height={30} />
            
            {/* Email Input */}
            <ThemedText style={styles.label}>Email</ThemedText>
            <ThemedTextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
            />
            
            <Spacer height={30} />
            
            {/* Submit Button */}
            <ThemedButton onPress={handleSubmit} style={styles.button}>
                <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Send Reset Link</Text>
            </ThemedButton>

            {/* Alert */}
            <ThemedAlert visible={alert.visible} message={alert.message} onClose={closeAlert} />
        </ThemedView>
    )
}

export default ForgotPassword

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    instructions: {
        fontSize: 16,
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        marginLeft: 5,
    },
    button: {
        width: '100%',
        alignItems: 'center',
    },
})