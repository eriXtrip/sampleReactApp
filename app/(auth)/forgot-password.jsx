import React, { useState, useRef } from 'react'
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'
import ThemedButton from '../../components/ThemedButton'
import ThemedAlert from '../../components/ThemedAlert'
import ThemedPasswordInput from '../../components/ThemedPasswordInput'
import ThemedCodeInput from '../../components/ThemedCodeInput'
import ThemedTextInput from '../../components/ThemedTextInput'

const ForgotPassword = () => {
    const router = useRouter()
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    const [step, setStep] = useState(1) // 1: email, 2: verification, 3: new password
    const [email, setEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })
    const [alert, setAlert] = useState({ visible: false, message: '' })
    const [attempts, setAttempts] = useState(0)
    const MAX_ATTEMPTS = 3
    
    const inputRefs = useRef(Array(6).fill(null))

    const showAlert = (msg) => setAlert({ visible: true, message: msg })
    const closeAlert = () => setAlert({ ...alert, visible: false })

    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        })
    }

    const handleVerificationChange = (text, index) => {
        // Only allow numeric input
        const numericValue = text.replace(/[^0-9]/g, '')
        
        // If empty (backspace), update and focus previous
        if (numericValue === '') {
            const newCode = [...verificationCode]
            newCode[index] = ''
            setVerificationCode(newCode)
            return
        }
        
        // Take only the first character if pasted multiple digits
        const digit = numericValue.charAt(0)
        
        const newCode = [...verificationCode]
        newCode[index] = digit
        setVerificationCode(newCode)
        
        // Auto focus next input if available
        if (digit && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus()
        }
        
        // Submit if last digit is entered
        if (index === 5 && digit) {
            setTimeout(() => {
                // Combine all digits into a string
                const enteredCode = newCode.join('')
                const correctCode = '808080' // Your verification code
                
                if (enteredCode === correctCode) {
                    // Code is correct, proceed to next step
                    setStep(3)
                    setAttempts(0) // Reset attempts on success
                } else {
                    // Increment attempt counter
                    const newAttempts = attempts + 1
                    setAttempts(newAttempts)

                    if (newAttempts >= MAX_ATTEMPTS) {
                        showAlert(`Too many attempts. Please request a new code.`)
                        setStep(1) // Go back to email entry
                        setAttempts(0)
                    } else {
                        showAlert(`Invalid code (${newAttempts}/${MAX_ATTEMPTS} attempts)`)
                        setVerificationCode(['', '', '', '', '', ''])
                        // Focus first input
                        if (inputRefs.current[0]) {
                            inputRefs.current[0].focus()
                        }
                    }
                }
            }, 500)
        }
    }

    const handleResendCode = () => {
        if (attempts >= MAX_ATTEMPTS) {
            showAlert('Please wait before requesting a new code.')
            return
        }
        
        // Here you would typically call your API to resend the code
        console.log('Resending code to:', email)
        showAlert('New verification code sent to your email')
        setVerificationCode(['', '', '', '', '', ''])
        setAttempts(0)
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus()
        }
    }

    const handleSubmitEmail = () => {
        if (!email.trim()) {
            showAlert('Please enter your email address')
            return
        }

        // Here you would typically call your API to send verification code
        console.log('Reset password requested for:', email)
        setStep(2)
    }

    const handleSubmitPassword = () => {
        if (!formData.password.trim()) {
            showAlert('Please enter a password')
            return
        }
        
        if (formData.password !== formData.confirmPassword) {
            showAlert('Passwords do not match')
            return
        }
        
        if (formData.password.length < 6) {
            showAlert('Password must be at least 6 characters')
            return
        }

        // Here you would typically call your API to reset password
        showAlert('Password has been reset successfully')
        console.log('Reset password:', formData.password, 'email:', email)
        setTimeout(() => {
            router.push('/login')
        }, 1500)
    }

    const handleBack = () => {
        if (step === 2) {
            setStep(1)
        } else if (step === 3) {
            setStep(2)
        }
    }

    return (
        <ThemedView style={styles.container} safe={true}>
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressLine, step >= 1 && styles.activeLine]} />
                <View style={[styles.progressLine, step >= 2 && styles.activeLine]} />
                <View style={[styles.progressLine, step >= 3 && styles.activeLine]} />
            </View>

            {step === 1 && (
                <>
                    {/* Back button */}
                    <View style={{ alignItems: 'flex-start', marginBottom: 20 }}>
                        <Pressable onPress={() => router.push('/login')}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </Pressable>
                    </View>

                    {/* Title */}
                    <ThemedText title={true} style={styles.title}>Find your account</ThemedText>
                    
                    {/* Instructions */}
                    <ThemedText style={styles.instructions}>
                        Enter your email assocciated with your account and we'll send you instructions to reset your password.
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
                    
                    <Spacer height={20} />
                    
                    {/* Submit Button */}
                    <ThemedButton onPress={handleSubmitEmail}>Send Reset Link</ThemedButton>

                </>
            )}

            {step === 2 && (
                <>
                    {/* Back button */}
                    <View style={{ alignItems: 'flex-start', marginBottom: 20 }}>
                        <Pressable onPress={handleBack}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </Pressable>
                    </View>

                    {/* Title */}
                    <ThemedText title={true} style={styles.title}>Verification Code</ThemedText>
                    
                    {/* Instructions */}
                    <ThemedText style={styles.instructions}>
                        Enter the 6-digit code sent to {email}
                    </ThemedText>

                    <Spacer height={30} />
                    
                    {/* Verification Code Input */}
                    <View style={styles.codeContainer}>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <ThemedCodeInput
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                style={styles.codeInput}
                                value={verificationCode[index]}
                                onChangeText={(text) => handleVerificationChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                                selectTextOnFocus
                            />
                        ))}
                    </View>
                    
                    <Spacer height={30} />
                    
                    {/* Resend Code */}
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText style={{ textAlign: 'center' }}>
                            Didn't receive code? Check your spam,
                        </ThemedText>
                        <Pressable onPress={handleResendCode}>
                            <ThemedText style={{ textAlign: 'center', color: Colors.primary, fontWeight: 'bold' }}>
                                Resend Code
                            </ThemedText>
                        </Pressable>
                        {attempts > 0 && (
                            <ThemedText style={{ textAlign: 'center', marginTop: 10, color: theme.textSecondary }}>
                                Attempts: {attempts}/{MAX_ATTEMPTS}
                            </ThemedText>
                        )}
                    </View>
                </>
            )}

            {step === 3 && (
                <>
                    <View style={{ alignItems: 'flex-start', marginBottom: 20}}>
                        <Pressable onPress={handleBack}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </Pressable>
                    </View>

                    <ThemedText title={true} style={styles.title}>
                        Create a password
                    </ThemedText>

                    <ThemedText style={{ marginBottom: 20, marginLeft: 4, fontSize: 14, color: theme.text }}>
                        Create a password with at least 6 letters or numbers. It should be something other can't guess.
                    </ThemedText>

                    <Spacer height={15} />
                    <ThemedText style={styles.label}>Password</ThemedText>
                    <ThemedPasswordInput
                        placeholder="Enter password"
                        value={formData.password}
                        onChangeText={(text) => handleChange('password', text)}
                    />

                    <Spacer height={15} />
                    <ThemedText style={styles.label}>Confirm Password</ThemedText>
                    <ThemedPasswordInput
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChangeText={(text) => handleChange('confirmPassword', text)}
                    />

                    <Spacer height={25} />
                    <ThemedButton onPress={handleSubmitPassword}> Reset Password </ThemedButton>
                </>
            )}

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
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    progressLine: {
        height: 2,
        width: '32%',
        backgroundColor: '#ddd',
        marginHorizontal: 0,
    },
    activeLine: {
        backgroundColor: Colors.primary,
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
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 10,
    },
    codeInput: {
        width: 45,
        height: 50,
        fontSize: 20,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: Colors.light.uiBackground,
        borderColor: Colors.light.iconColor,
    },
})