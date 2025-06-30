// SAMPLEREACTAPP/app/auth/register.jsx
import React, { useState, useRef, useContext  } from 'react'
import { StyleSheet, Text, TextInput, View, Pressable, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { UserContext } from '../../contexts/UserContext';

import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedAlert from '../../components/ThemedAlert';
import ThemedTextInput from '../../components/ThemedTextInput';
import ThemedPasswordInput from '../../components/ThemedPasswordInput';
import ThemedCodeInput from '../../components/ThemedCodeInput';


const Register = () => {
    const router = useRouter();
    const { 
        startRegistration, 
        verifyCode, 
        completeRegistration, 
        registrationData 
    } = useContext(UserContext);
    const [loading, setLoading] = useState(false);

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme] ?? Colors.light;

    const [step, setStep] = useState(0); // Step 0 = Role select so on to other steps
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [attempts, setAttempts] = useState(0)
    const MAX_ATTEMPTS = 3
    
    const inputRefs = useRef(Array(6).fill(null))

    const [alert, setAlert] = useState({ visible: false, message: '' });

    const showAlert = (msg) => setAlert({ visible: true, message: msg });
    const closeAlert = () => setAlert({ ...alert, visible: false });


    const [formData, setFormData] = useState({
        role: '',
        lrn: '',
        teacherId: '',
        fullName: '',
        gender: '',
        birthday: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleRoleSelect = (selectedRole) => {
        setFormData({ ...formData, role: selectedRole });
        setStep(1);
    };

    const handleNext = () => {
        if (!validateStep(1)) return showAlert('Full Name is required.');
        setStep(2);
    };

    const handleNext1 = () => {
        if (!validateStep(2)) return showAlert('Please select your gender.');
        setStep(3);
    };

    const handleNext2 = () => {
        if (!validateStep(3)) return showAlert('Please choose your birthday.');
        setStep(4);
    };

    const handleNext3 = () => {
        if (!validateStep(4)) {
            return showAlert(
            formData.role === 'Teacher'
                ? 'Teacher ID must be exactly 10 digits.'
                : 'LRN must be exactly 12 digits.'
            )}
        setStep(5);
    };

    const handleNext4 = () => {
        if (!validateStep(5)) return showAlert('Email is required.');
        setStep(6);
    };

    const handleBack6 = () => setStep(6);
    const handleBack5 = () => setStep(5);
    const handleBack4 = () => setStep(4);
    const handleBack3 = () => setStep(3);
    const handleBack2 = () => setStep(2);
    const handleBack1 = () => setStep(1);
    const handleBack0 = () => setStep(0);
    

    
    const validateStep = (step) => {
        const {
            role,
            fullName,
            gender,
            birthday,
            lrn,
            teacherId,
            email,
            password,
            confirmPassword,
        } = formData;

        switch (step) {
            case 0:
            return !!role;

            case 1:
            return !!fullName.trim();

            case 2:
            return !!gender;

            case 3:
            return (
                !!birthday &&
                new Date(birthday).toDateString() !== new Date().toDateString() &&
                new Date(birthday) < new Date()
            );

            case 4:
                if (role === 'Teacher') {
                    return /^\d{10}$/.test(teacherId); // Teacher ID must be exactly 10 digits
                } else {
                    return /^\d{12}$/.test(lrn); // LRN must be exactly 12 digits
                }


            case 5:
            return !!email;
        
            case 6:
            return (
                !!password &&
                !!confirmPassword &&
                password === confirmPassword
            );

            default:
            return false;
        }
    };

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
            const fullCode = [...newCode].join(''); // Get the complete code
            console.log('Verification Code Submitted:', {
                code: fullCode,
                email: formData.email, // Also log the associated email
                timestamp: new Date().toISOString()
            });
            
           setTimeout(() => {
                handleVerifyCode(fullCode)
           }, 500)
        }
    }

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus()
        }
    }


    // Step 1: Start Registration with backend
    const handleStartRegistration = async () => {
        if (!validateStep(1)) return showAlert('Full Name is required.');
        
        setLoading(true);
        try {
            const result = await startRegistration({
                email: formData.email,
                role: formData.role.toLowerCase(), // backend expects 'pupil' or 'teacher'
                fullName: formData.fullName,
                gender: formData.gender,
                birthday: formData.birthday,
                lrn: formData.role === 'Pupil' ? formData.lrn : null,
                teacherId: formData.role === 'Teacher' ? formData.teacherId : null
            });

            if (result.success) {
                setStep(6); // Move to verification step
                console.log('DEBUG - Registration Started:', {
                    email: formData.email,
                    role: formData.role,
                    fullName: formData.fullName,
                    gender: formData.gender,
                    birthday: formData.birthday,
                    lrn: formData.lrn,
                    teacherId: formData.teacherId,
                });
            } else {
                showAlert(result.error || 'Registration failed');
            }
        } catch (error) {
            showAlert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Code with backend
    const handleVerifyCode = async (code) => {
        if (code.length !== 6) return showAlert('Please enter a 6-digit code');

        // Debug output
        console.log('DEBUG - Verification Attempt:', {
            email: formData.email,
            verificationCode: code,
            timestamp: new Date().toISOString()
        });

        setLoading(true);
        try {
            const result = await verifyCode(formData.email, code);
            if (result.success) {
                setStep(7); // Move to password step
            } else {
                // Handle failed attempts
                // const newAttempts = attempts + 1;
                // setAttempts(newAttempts);
                
                // if (newAttempts >= MAX_ATTEMPTS) {
                //     showAlert('Too many attempts. Please start over.');
                //     setStep(0);
                //     setAttempts(0);
                // } else {
                //     showAlert(`Invalid code (${newAttempts}/${MAX_ATTEMPTS} attempts)`);
                //     setVerificationCode(['', '', '', '', '', '']);
                //     if (inputRefs.current[0]) inputRefs.current[0].focus();
                // }
            }
        } catch (error) {
            showAlert('Verification failed. Please try again.');
            console.error('Verification Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Complete Registration with backend
    const handleCompleteRegistration = async () => {
        setLoading(true);
        try {
            // Validate all required fields
            const requiredFields = {
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            role: formData.role,
            fullName: formData.fullName,
            gender: formData.gender,
            birthday: formData.birthday
            };

            const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

            if (missingFields.length > 0) {
            showAlert(`Missing required fields: ${missingFields.join(', ')}`);
            return;
            }

            if (formData.password !== formData.confirmPassword) {
            showAlert('Passwords do not match');
            return;
            }

            const result = await completeRegistration(formData);

            if (result.success) {
            router.replace('/home');
            } else {
            showAlert(result.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert(error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle resend verification code
    const handleResendCode = async () => {
        if (attempts >= MAX_ATTEMPTS) {
            showAlert('Please wait before requesting a new code.');
            return;
        }
        
        setLoading(true);
        try {
            const result = await startRegistration({
                email: formData.email,
                role: formData.role.toLowerCase(),
            });

            if (result.success) {
                showAlert('New verification code sent to your email');
                setVerificationCode(['', '', '', '', '', '']);
                setAttempts(0);
                if (inputRefs.current[0]) inputRefs.current[0].focus();
            } else {
                showAlert(result.error || 'Failed to resend code');
            }
        } catch (error) {
            showAlert('Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <ThemedView style={styles.container} safe={true}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressLine, step >= 0 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 1 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 2 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 3 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 4 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 5 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 6 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 7 && styles.activeLine]} />
                </View>

                {/* Step 0: Role Selection */}
                {step === 0 ? (
                    <>
                        <View style={{ alignItems: 'flex-start' }}>
                            <Pressable onPress={() => router.push('/login')}>
                                <Ionicons name="arrow-back" size={24} color={theme.text} />
                            </Pressable>
                        </View>

                        <ThemedText title={true} style={[styles.title, { textAlign: 'left' }]}>
                            Who are you registering as?
                        </ThemedText>
                        <ThemedText style={{ marginBottom: 20, marginLeft: 4, fontSize: 14, color: theme.text }}>
                            Please choose your role to continue the registration.
                        </ThemedText>

                        <ThemedButton onPress={() => handleRoleSelect('Pupil')}>
                            I am a Pupil
                        </ThemedButton>

                        <Spacer height={10} />

                        <ThemedButton onPress={() => handleRoleSelect('Teacher')}>
                            I am a Teacher
                        </ThemedButton>
                    </>
                ) : step === 1 ? (
                    <>
                        <View style={{ alignItems: 'flex-start' }}>
                            <Pressable onPress={handleBack0}>
                                <Ionicons name="arrow-back" size={24} color={theme.text} />
                            </Pressable>
                        </View>

                        <ThemedText title={true} style={[styles.title, { textAlign: 'left' }]}>
                            What's your name?
                        </ThemedText>
                        <ThemedText style={{ marginBottom: 20, marginLeft: 4, fontSize: 14, color: theme.text }}>
                            Enter the name you use in real life.
                        </ThemedText>

                        <ThemedText style={styles.label}>Full Name</ThemedText>
                        <ThemedTextInput
                            placeholder="Full name"
                            value={formData.fullName}
                            onChangeText={(text) => handleChange('fullName', text)}
                            autoCapitalize="words"
                        />

                        <Spacer height={25} />
                            <ThemedButton onPress={handleNext}>
                                Next
                            </ThemedButton>
                        </>
                ) : step === 2 ? (
                    <>
                        <View style={styles.backButtonContainer}>
                        <Pressable onPress={handleBack1}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </Pressable>
                        </View>

                        <ThemedText title={true} style={[styles.title, { textAlign: 'left' }]}>
                            What's your gender?
                        </ThemedText>

                        <ThemedText style={styles.subtitle}>
                            Select your gender.
                        </ThemedText>

                        <View style={[styles.genderList, {backgroundColor: theme.Background, borderColor: theme.iconColor,}]}>
                        {['Female', 'Male', 'Prefer not to say'].map((option) => (
                            <Pressable
                            key={option}
                            onPress={() => handleChange('gender', option)}
                            style={styles.genderOption}
                            >
                            <Text style={[styles.genderText, { color: theme.text }]}>
                                {option}
                            </Text>
                            <Ionicons
                                name={formData.gender === option ? 'radio-button-on' : 'radio-button-off'}
                                size={25}
                                color={theme.text}
                            />
                            </Pressable>
                        ))}
                        </View>

                        <Spacer height={25} />

                        <ThemedButton onPress={handleNext1} >
                            Next
                        </ThemedButton>
                    </>

                ) : step === 3 ? (
                    <>
                        <View style={{ alignItems: 'flex-start' }}>
                        <Pressable onPress={handleBack2}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </Pressable>
                        </View>

                        <ThemedText title={true} style={[styles.title, { textAlign: 'left' }]}>
                        What's your birthday?
                        </ThemedText>

                        <ThemedText style={{ marginBottom: 20, marginLeft: 4, fontSize: 14, color: theme.text }}>
                        Choose your date of birth.
                        </ThemedText>

                        <Pressable
                            onPress={() => setShowDatePicker(true)}
                            style={[styles.datePicker, { backgroundColor: theme.uiBackground, borderColor: theme.iconColor }]}
                        >
                        <Text style={{ fontSize: 16 }}>
                            {formData.birthday ? new Date(formData.birthday).toLocaleDateString() : 'Select Date'}
                        </Text>
                        </Pressable>

                        {showDatePicker && (
                        <DateTimePicker
                            value={formData.birthday ? new Date(formData.birthday) : new Date()}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                                if (selectedDate) {
                                    handleChange('birthday', selectedDate.toISOString().split('T')[0]);
                                }
                            }}
                        />
                        )}

                        <Spacer height={25} />

                        <ThemedButton onPress={handleNext2} >
                            Next
                        </ThemedButton>
                    </>
                ) : step === 4 ? (
                    <>
                        <View style={{ alignItems: 'flex-start' }}>
                        <Pressable onPress={handleBack3}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </Pressable>
                        </View>

                        <ThemedText title={true} style={[styles.title, { textAlign: 'left' }]}>
                        {formData.role === 'Teacher' ? "What's your Teacher ID?" : "What's your LRN?"}
                        </ThemedText>

                        <ThemedText>
                        {formData.role === 'Teacher'
                            ? 'Enter your assigned Teacher ID number.'
                            : 'Enter your 12-digit Learner Reference Number (LRN).'}
                        </ThemedText>

                        <Spacer height={25} />

                        <ThemedTextInput
                            placeholder={formData.role === 'Teacher' ? 'Enter Teacher ID' : 'Enter LRN (e.g. 123456789012)'}
                            value={formData.role === 'Teacher' ? formData.teacherId : formData.lrn}
                            onChangeText={(text) =>
                                handleChange(formData.role === 'Teacher' ? 'teacherId' : 'lrn', text)
                            }
                            keyboardType="numeric"
                            maxLength={formData.role === 'Teacher' ? 10 : 12}
                        />

                        <Spacer height={25} />

                        <ThemedButton onPress={handleNext3} >
                            Next
                        </ThemedButton>
                    </>
                ) : step === 5 ? (
                    <>
                        <View style={{ alignItems: 'flex-start' }}>
                        <Pressable onPress={handleBack4}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </Pressable>
                        </View>

                        <ThemedText title={true} style={[styles.title, { textAlign: 'left' }]}>
                        What's your email?
                        </ThemedText>

                        <ThemedText style={{ marginBottom: 20, marginLeft: 4, fontSize: 14, color: theme.text }}>
                        Enter your active email where you can be contacted.
                        </ThemedText>

                        <ThemedTextInput
                            placeholder="example@email.com"
                            value={formData.email}
                            onChangeText={(text) => handleChange('email', text)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Spacer height={25} />

                        <ThemedButton 
                            onPress={handleStartRegistration} 
                            disabled={!formData.email || loading}
                            loading={loading}
                        >
                            Send Verification Code
                        </ThemedButton>
                    </>
                    ) : step === 6 ? (
                    <>
                        {/* Back button */}
                        <View style={{ alignItems: 'flex-start', marginBottom: 20 }}>
                            <Pressable onPress={handleBack5}>
                                <Ionicons name="arrow-back" size={24} color={theme.text} />
                            </Pressable>
                        </View>

                        {/* Title */}
                        <ThemedText title={true} style={[styles.title, { textAlign: 'left' }]}>Verification Code</ThemedText>
                        
                        {/* Instructions */}
                        <ThemedText style={styles.instructions}>
                            Enter the 6-digit code sent to {formData.email}
                        </ThemedText>

                        <Spacer height={30} />
                        
                        {/* Verification Code Input */}
                        <View style={styles.codeContainer}>
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <ThemedCodeInput
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
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
                    ) : (
                    <>
                        <View style={{ alignItems: 'flex-start' }}>
                        <Pressable onPress={handleBack6}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </Pressable>
                        </View>

                        <ThemedText title={true} style={[styles.title, { textAlign: 'left' }]}>
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
                        <ThemedButton 
                            onPress={handleCompleteRegistration}
                            disabled={loading || !formData.password || formData.password !== formData.confirmPassword}
                            loading={loading}
                        >
                            Complete Registration
                        </ThemedButton>
                    </>
                )}
                {/* <Link href='/login' style={styles.link}>
                    <ThemedText style={{ textAlign: 'center', marginBottom: 50 }}>Already have an account? Login Instead</ThemedText>
                </Link> */}
            </ScrollView>

            <ThemedAlert visible={alert.visible} message={alert.message} onClose={closeAlert} />

        </ThemedView>

        
    )
};

export default Register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    topBackButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 30,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    progressLine: {
        height: 2,
        width: '12.5%',
        backgroundColor: '#ddd',
        marginHorizontal: 0,
    },
    activeLine: {
        backgroundColor: Colors.primary,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        marginLeft: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    halfInput: {
        flex: 1,
    },
    backButtonContainer: {
        alignItems: 'flex-start',
    },
    subtitle: {
        marginBottom: 20,
        marginLeft: 4,
        fontSize: 14,
    },
    genderList: {
        gap: 10,
        marginVertical: 10,
        
        borderWidth: 1,
        borderRadius: 10,
    },
    genderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    genderText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    datePicker: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        marginVertical: 10,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 10,
    },
    link: {
        marginTop: 10,
    },
});
