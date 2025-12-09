// SAMPLEREACTAPP/app/auth/forgot-password.jsx

import React, { useState, useRef, useContext } from 'react'
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { UserContext } from '../../contexts/UserContext';

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'
import ThemedButton from '../../components/ThemedButton'
import ThemedAlert from '../../components/ThemedAlert'
import ThemedPasswordInput from '../../components/ThemedPasswordInput'
import ThemedCodeInput from '../../components/ThemedCodeInput'
import ThemedTextInput from '../../components/ThemedTextInput'
import { ProfileContext } from '../../contexts/ProfileContext';
import { useResendTimer } from  '../../hooks/useResendTimer';

const ForgotPassword = () => {
    const router = useRouter()
    const colorScheme = useColorScheme();
    const { themeColors } = useContext(ProfileContext);
    const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

    const {
        startPasswordReset,
        verifyResetCode,
        completePasswordReset
    } = useContext(UserContext);

    const [step, setStep] = useState(1) // 1: email, 2: verification, 3: new password
    const [email, setEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })
    const [alert, setAlert] = useState({ visible: false, message: '' })
    
    const RESEND_TIME = 30;
    const { timer: resendTimer, isRunning, start: startResendTimer } = useResendTimer(RESEND_TIME);

    const inputRefs = useRef(Array(6).fill(null))

    const [isVerififyCode, setVerifyCode] = useState(false);

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
        setTimeout(() => handleVerifyCode(newCode.join('')), 500);
        }
    }

    const handleVerifyCode = async (code) => {
        const result = await verifyResetCode(email, code);
        console.log('email:', email, 'code:', code);
        if (result.success) {
            setStep(3);
            setAttempts(0);
        } else {
            showAlert('Invalid or expired reset code');
            throw new Error('Invalid or expired code');
        }
        console.error('Verification failed:', error.message);
    };

    const handleResendCode = () => {
        if (resendTimer > 0) {
            showAlert(`Please wait ${resendTimer}s before resending.`);
            return;
        }

        handleSubmitEmail(); // Trigger actual resend logic
        startResendTimer(); // Starts the countdown
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus()
        }
    }

    const handleSubmitEmail = async () => {
        if (!email.trim()) return showAlert('Please enter your email');

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return showAlert('Invalid email format.');
        }

        try {
            setVerifyCode(true); // start loading
            console.log('Submitting email:', email);
            await startPasswordReset({ email });
            startResendTimer(); // Starts the countdown
            setStep(2);
        } catch (error) {
            showAlert(error.message || 'Account not found');
            setVerifyCode(false);
        }
    };

    const handleSubmitPassword = async () => {
        if (!formData.password.trim()) return showAlert('Please enter a password');
        if (formData.password !== formData.confirmPassword) return showAlert('Passwords do not match');
        if (formData.password.length < 8) return showAlert('Password must be at least 8 characters');

        // Password regex: at least one uppercase, lowercase, number, and special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

        if (!passwordRegex.test(formData.password)) {
            return showAlert('Password must include uppercase, lowercase, number, and special character.');
        }
        
        try {
            await completePasswordReset({ email, password: formData.password });
            console.log('email:', email, 'password:', formData.password);
            showAlert('Password has been reset successfully');
            setTimeout(() => router.push('/login'), 2000);
        } catch (error) {
            showAlert(error.message || 'Failed to reset password');
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1)
        } else if (step === 3) {
            setStep(2)
        }
    }

    const passwordHint = () => {
        showAlert("Tips for a strong password\n\n" +
            "• Combine upper and lower case letters, numbers, and special characters (e.g., $, #, &, etc.).\n\n" +
            "• Keep your password at least 8 to 12 characters long.\n\n" +
            "• Avoid consecutive characters (e.g., 12345, abcde, qwerty, etc.) or repeating characters (e.g., 11111).\n\n" +
            "• Avoid personal info like names of friends or relatives, your birthday, or your address.\n\n" +
            "• Avoid common or obvious words (e.g., password, maya, bank, money, etc.).\n\n" +
            "• Avoid using the same password from other accounts you own.");
    };


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
                    <ThemedButton 
                        onPress={handleSubmitEmail}
                        loading={isVerififyCode}
                    >
                        {isVerififyCode ? "Sending..." : "Send Reset Code"}
                    </ThemedButton>

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
                        <Pressable onPress={handleResendCode} disabled={resendTimer > 0}>
                            <ThemedText
                            style={{
                                textAlign: 'center',
                                color: resendTimer > 0 ? 'gray' : Colors.primary,
                                fontWeight: 'bold',
                            }}
                            >
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                            </ThemedText>
                        </Pressable>
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
                        Create a password with at least 8 letters or numbers. It should be something other can't guess.
                    </ThemedText>

                    <Spacer height={15} />
                    <ThemedText style={styles.label}>Password
                        <Pressable onPress={passwordHint}>
                            <Ionicons name="alert-circle" size={18} color={theme.warning} paddingLeft={5}/>
                        </Pressable>
                    </ThemedText>
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
        marginTop: 35,
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