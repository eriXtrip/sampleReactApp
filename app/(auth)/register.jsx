// SAMPLEREACTAPP/app/auth/register.jsx
import React, { useState, useRef, useContext  } from 'react'
import { StyleSheet, Platform, Text, TouchableOpacity, View, Pressable, ScrollView, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
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
import { ProfileContext } from '../../contexts/ProfileContext';
import { useResendTimer } from  '../../hooks/useResendTimer';

const Register = () => {
    const router = useRouter();
    const { 
        startPasswordReset,
        startRegistration, 
        verifyCode, 
        completeRegistration
    } = useContext(UserContext);
    const [loading, setLoading] = useState(false);

    const colorScheme = useColorScheme();
    const { themeColors } = useContext(ProfileContext);
    const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

    const [step, setStep] = useState(0); // Step 0 = Role select so on to other steps
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const RESEND_TIME = 30;
    const { timer: resendTimer, isRunning, start: startResendTimer } = useResendTimer(RESEND_TIME);
    
    const inputRefs = useRef(Array(6).fill(null))

    const [alert, setAlert] = useState({ visible: false, message: '' });
    
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);

    const [isVerififyCode, setVerifyCode] = useState(false);

    const showAlert = (msg) => setAlert({ visible: true, message: msg });
    const closeAlert = () => setAlert({ ...alert, visible: false });


    const [formData, setFormData] = useState({
        role: '',
        lrn: '',
        teacherId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
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

    const isValidName = (name) => {
        // Regular expression that allows only letters (uppercase and lowercase) and spaces
        return /^[a-zA-Z\s]+$/.test(name) && name.trim().length > 0;
    };

    const handleNext = () => {
        if (!validateStep(1)) return showAlert('Please enter valid names (only letters allowed).');
        setStep(2);
    };

    const handleNext1 = () => {
        if (!validateStep(2)) return showAlert('Please select your gender.');
        setStep(3);
    };

    const handleNext2 = () => {
        if (!validateStep(3)) return showAlert('Please choose your birthday.');
        setStep(5); //skip step 5
    };

    const handleNext3 = () => {
        if (!validateStep(4)) {
            return showAlert(
            formData.role === 'Teacher'
                ? 'Teacher ID must be exactly 10 digits and contain only numbers.'
                : 'LRN must be exactly 12 digits and contain only numbers.'
            )}
        setStep(5);
    };

    const handleNext4 = () => {
        if (!formData.email) {
            return showAlert('Email is required.');
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            return showAlert('Invalid email format.');
        }
        handleStartRegistration(); // Proceed if email is valid
    };

    const handleBack6 = () => setStep(6);
    const handleBack5 = () => setStep(5);
    const handleBack4 = () => setStep(3);
    const handleBack3 = () => setStep(3);
    const handleBack2 = () => setStep(2);
    const handleBack1 = () => setStep(1);
    const handleBack0 = () => setStep(0);
    

    
    const validateStep = (step) => {
        const {
            role,
            firstName,
            middleName,
            lastName,
            suffix,
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
                // Validate first and last name are present and valid
                // Middle name and suffix are optional but if provided, must be valid
                const isFirstNameValid = isValidName(firstName);
                const isLastNameValid = isValidName(lastName);
                const isMiddleNameValid = !middleName || isValidName(middleName); // optional
                const isSuffixValid = !suffix || isValidName(suffix); // optional
                
                return isFirstNameValid && isLastNameValid && isMiddleNameValid && isSuffixValid;

            case 2:
            return !!gender;

            case 3:
            return (
                !!birthday &&
                new Date(birthday).toDateString() !== new Date().toDateString() &&
                new Date(birthday) < new Date()
            );


            case 4:
                if (formData.role === 'Teacher') {
                    const teacherId = formData.teacherId ? formData.teacherId.trim() : '';
                    return teacherId && /^\d{10}$/.test(teacherId);
                } else {
                    const lrn = formData.lrn ? formData.lrn.trim() : '';
                    return lrn && /^\d{12}$/.test(lrn);
                }

            case 5:
                if (!email) {
                    return showAlert('Email is required.');
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    return showAlert('Invalid email format.');
                }
    
    // If validation passes, proceed to backend registration
    handleStartRegistration();  
        
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
        startResendTimer(); // Starts the countdown
        setVerifyCode(true);
        setLoading(true);
        try {
            const result = await startRegistration({
                email: formData.email,
                role: formData.role.toLowerCase(), // backend expects 'pupil' or 'teacher'
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName,
                suffix: formData.suffix,
                gender: formData.gender,
                birthday: formData.birthday,
                lrn: formData.role === 'Pupil' ? '000000000000' : null,
                teacherId: formData.role === 'Teacher' ? '0000000000' : null
            });

            if (result.success) {
                setVerifyCode(false);
                setStep(6); // Move to verification step
                console.log('DEBUG - Registration Started:', {
                    email: formData.email,
                    role: formData.role,
                    firstName: formData.firstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    suffix: formData.suffix,
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
                firstName: formData.firstName,
                lastName: formData.lastName,
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

            if (formData.password.length < 8 || formData.confirmPassword.length < 8){
                showAlert('Password must be at least 8 character long');
                return;
            }

            // Password regex: at least one uppercase, lowercase, number, and special character
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

            if (!passwordRegex.test(formData.password)) {
                return showAlert('Password must include uppercase, lowercase, number, and special character.');
            }

            const result = await completeRegistration(formData);

            if (result.success) {
                showAlert('Account successfully created.');
                setTimeout(() => router.push('/login'), 2000);
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
    const handleResendCode = () => {
        if (resendTimer > 0) {
            showAlert(`Please wait ${resendTimer}s before resending.`);
            return;
        }

        resendCode(); // Trigger actual resend logic
        startResendTimer(); // Starts the countdown

    };

    const resendCode = async () => {
        handleStartRegistration();
    };

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
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressLine, step >= 0 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 1 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 2 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 3 && styles.activeLine]} />
                    {/* <View style={[styles.progressLine, step >= 4 && styles.activeLine]} /> */}
                    <View style={[styles.progressLine, step >= 5 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 6 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 7 && styles.activeLine]} />
                </View>

                {/* Step 0: Role Selection */}
                {step === 0 ? (
                    <>
                        <View style={{ alignItems: 'flex-start' }}>
                            <Pressable
                                onPress={() => {
                                const goBack = async () => {
                                    await wait(1500); // or however long you need
                                    router.push('/login');
                                };
                                goBack();
                                }}
                            >
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

                        <ThemedButton style={{ display: 'none' }} onPress={() => handleRoleSelect('Teacher')}>
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

                        {/* First and Middle Name Row */}
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                            <ThemedText style={styles.label}>First Name</ThemedText>
                            <ThemedTextInput
                                placeholder="First name"
                                value={formData.firstName}
                                onChangeText={(text) => handleChange('firstName', text)}
                                autoCapitalize="words"
                            />

                            </View>

                            <View style={styles.halfInput}>
                            <ThemedText style={styles.label}>Middle Name</ThemedText>
                            <ThemedTextInput
                                placeholder="Middle name"
                                value={formData.middleName}
                                onChangeText={(text) => handleChange('middleName', text)}
                                autoCapitalize="words"
                            />
                            </View>
                            
                        </View>

                        {/* Last Name and Suffix Row */}
                        <Spacer height={15} />
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                            <ThemedText style={styles.label}>Last Name</ThemedText>
                            <ThemedTextInput
                                placeholder="Last name"
                                value={formData.lastName}
                                onChangeText={(text) => handleChange('lastName', text)}
                                autoCapitalize="words"
                            />
                            </View>

                            <View style={styles.halfInput}>
                            <ThemedText style={styles.label}>Suffix (Optional)</ThemedText>
                            <ThemedTextInput
                                placeholder="e.g. Jr, Sr, III"
                                value={formData.suffix}
                                onChangeText={(text) => handleChange('suffix', text)}
                                autoCapitalize="characters"
                            />
                            </View>
                            
                        </View>

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

                        <View style={[styles.genderList, {backgroundColor: theme.navBackground, borderColor: theme.cardBorder,}]}>
                        {['Female', 'Male', 'Prefer not to say'].map((option, index) => (
                            <TouchableOpacity
                            key={option}
                            onPress={() => handleChange('gender', option)}
                            style={[styles.genderOption,
                                {borderColor: theme.cardBorder},
                                index === 2 && { borderBottomWidth: 0 }
                            ]}
                            
                            >
                            <Text style={[styles.genderText, { color: theme.text }]}>
                                {option}
                            </Text>
                            <Ionicons
                                name={formData.gender === option ? 'radio-button-on' : 'radio-button-off'}
                                size={25}
                                color={theme.text}
                            />
                            </TouchableOpacity>
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
                                {
                                    formData.birthday && formData.birthday !== ''
                                    ? new Date(formData.birthday).toLocaleDateString()
                                    : 'Select Date'
                                }
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
                            onPress={handleNext4} 
                            disabled={!formData.email || isVerififyCode}
                        >
                            {isVerififyCode ?  "Sending..." : "Send Verification Code" }
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
                                    style={[styles.codeInput, {color: theme.text, borderColor: theme.iconColor}]}
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
                                Didn't receive code? Check your spam
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
                        <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : undefined}>
                            <ThemedPasswordInput
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChangeText={(text) => handleChange('confirmPassword', text)}
                            />
                        </KeyboardAvoidingView>
                        

                        <Spacer height={20} />

                        {/* Terms and Conditions Checkbox */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <TouchableOpacity
                                onPress={() => setAgreedTerms(!agreedTerms)}
                                style={{ paddingRight: 8, paddingTop: 2 }}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: agreedTerms }}
                            >
                                <Ionicons
                                    name={agreedTerms ? 'checkbox' : 'square-outline'}
                                    size={22}
                                    color={agreedTerms ? Colors.primary : theme.iconColor}
                                />
                            </TouchableOpacity>
                            <View style={{ flex: 1, flexWrap: 'wrap' }}>
                                <Text style={{ color: theme.text }}>
                                    I agree to the
                                    <Text> </Text>
                                    <Text
                                        onPress={() => router.push('/terms')}
                                        style={{ color: Colors.primary, textDecorationLine: 'underline' }}
                                    >
                                        Terms and Conditions
                                    </Text>
                                </Text>
                            </View>
                        </View>

                        <Spacer height={12} />

                        {/* Privacy Policy Checkbox */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <TouchableOpacity
                                onPress={() => setAgreedPrivacy(!agreedPrivacy)}
                                style={{ paddingRight: 8, paddingTop: 2 }}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: agreedPrivacy }}
                            >
                                <Ionicons
                                    name={agreedPrivacy ? 'checkbox' : 'square-outline'}
                                    size={22}
                                    color={agreedPrivacy ? Colors.primary : theme.iconColor}
                                />
                            </TouchableOpacity>
                            <View style={{ flex: 1, flexWrap: 'wrap' }}>
                                <Text style={{ color: theme.text }}>
                                    I agree to the
                                    <Text> </Text>
                                    <Text
                                        onPress={() => router.push('/privacy')}
                                        style={{ color: Colors.primary, textDecorationLine: 'underline' }}
                                    >
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </View>
                        </View>

                        <Spacer height={20} />

                        <ThemedButton 
                            onPress={handleCompleteRegistration}
                            disabled={!agreedTerms || !agreedPrivacy || loading}
                            loading={loading}
                        >
                            Complete Registration
                        </ThemedButton>
                    </>
                )}
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
        marginTop: 35,
    },
    progressLine: {
        height: 2,
        width: '14.28%',
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
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
    codeInput: {
        width: 45,
        height: 50,
        fontSize: 20,
        borderRadius: 8,
        borderWidth: 1,
    },
    link: {
        marginTop: 10,
    },
});
