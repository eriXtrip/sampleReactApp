import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedAlert from '../../components/ThemedAlert';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

const Register = () => {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme] ?? Colors.light;

    const [step, setStep] = useState(0); // Step 0 = Role select
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [alert, setAlert] = useState({ visible: false, message: '' });

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

    const handleNext = () => {
        if (!validateStep(1)) return showAlert('First and Last Name are required.');
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
                ? 'Teacher ID is required.'
                : 'LRN is required.'
            );
        }
        setStep(5);
    };

    const handleNext4 = () => {
        if (!validateStep(5)) return showAlert('Email is required.');
        setStep(6);
    };

    const handleBack5 = () => setStep(5);
    const handleBack4 = () => setStep(4);
    const handleBack3 = () => setStep(3);
    const handleBack2 = () => setStep(2);
    const handleBack1 = () => setStep(1);
    const handleBack0 = () => setStep(0);
    

    
    const validateStep = (step) => {
        const {
            role,
            firstName,
            lastName,
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
            return !!firstName.trim() && !!lastName.trim();

            case 2:
            return !!gender;

            case 3:
            return !!birthday;

            case 4:
            return role === 'Teacher'
                ? !!teacherId.trim()
                : !!lrn.trim();

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

    const handleSubmit = () => {
        if (!validateStep(6)) {
            return showAlert('Please enter a valid and matching passwords.');
        }

        console.log('--- Registration Data ---');
        Object.entries(formData).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });

        router.replace('/');
    };



    


    return (
        <ThemedView style={styles.container} safe={true}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Spacer height={20} />

                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressLine, step >= -1 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 1 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 2 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 3 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 4 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 5 && styles.activeLine]} />
                    <View style={[styles.progressLine, step >= 6 && styles.activeLine]} />
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

                        <ThemedButton onPress={() => handleRoleSelect('Pupil')} style={[styles.button, { width: '100%' }]}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>I am a Pupil</Text>
                        </ThemedButton>

                        <Spacer height={10} />

                        <ThemedButton onPress={() => handleRoleSelect('Teacher')} style={[styles.button, { width: '100%' }]}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>I am a Teacher</Text>
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
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                                placeholder="First name"
                                placeholderTextColor={theme.iconColor}
                                value={formData.firstName}
                                onChangeText={(text) => handleChange('firstName', text)}
                                autoCapitalize="words"
                            />
                            </View>

                            <View style={styles.halfInput}>
                            <ThemedText style={styles.label}>Middle Name</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                                placeholder="Middle name"
                                placeholderTextColor={theme.iconColor}
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
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                                placeholder="Last name"
                                placeholderTextColor={theme.iconColor}
                                value={formData.lastName}
                                onChangeText={(text) => handleChange('lastName', text)}
                                autoCapitalize="words"
                            />
                            </View>

                            <View style={styles.halfInput}>
                            <ThemedText style={styles.label}>Suffix (Optional)</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                                placeholder="e.g. Jr, Sr, III"
                                placeholderTextColor={theme.iconColor}
                                value={formData.suffix}
                                onChangeText={(text) => handleChange('suffix', text)}
                                autoCapitalize="characters"
                            />
                            </View>
                            
                        </View>

                        <Spacer height={25} />
                        <View style={styles.buttonRow}>
                            <ThemedButton onPress={handleNext} style={[styles.button, { width: '100%' }]}>
                            <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Next</Text>
                            </ThemedButton>
                        </View>
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

                        <View style={[styles.genderList, {backgroundColor: theme.uiBackground, borderColor: theme.iconColor,}]}>
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

                        <View style={styles.buttonRow}>
                        <ThemedButton onPress={handleNext1} style={[styles.button, { width: '100%' }]}>
                            <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Next</Text>
                        </ThemedButton>
                        </View>
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
                        <Text style={{ color: theme.text, fontSize: 16 }}>
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
                                handleChange('birthday', selectedDate.toISOString());
                            }
                            }}
                        />
                        )}

                        <Spacer height={25} />

                        <View style={styles.buttonRow}>
                        <ThemedButton onPress={handleNext2} style={[styles.button, { width: '100%' }]}>
                            <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Next</Text>
                        </ThemedButton>
                        </View>
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

                        <ThemedText style={{ marginBottom: 20, marginLeft: 4, fontSize: 14, color: theme.text }}>
                        {formData.role === 'Teacher'
                            ? 'Enter your assigned Teacher ID number.'
                            : 'Enter your 12-digit Learner Reference Number (LRN).'}
                        </ThemedText>

                        <TextInput
                        style={[
                            styles.input,
                            {
                            backgroundColor: theme.uiBackground,
                            color: theme.text,
                            borderColor: theme.iconColor,
                            },
                        ]}
                        placeholder={
                            formData.role === 'Teacher' ? 'Enter Teacher ID' : 'Enter LRN (e.g. 123456789012)'
                        }
                        placeholderTextColor={theme.iconColor}
                        value={formData.role === 'Teacher' ? formData.teacherId : formData.lrn}
                        onChangeText={(text) =>
                            handleChange(formData.role === 'Teacher' ? 'teacherId' : 'lrn', text)
                        }
                        keyboardType="numeric"
                        maxLength={formData.role === 'Teacher' ? 10 : 12}
                        />

                        <Spacer height={25} />

                        <View style={styles.buttonRow}>
                        <ThemedButton onPress={handleNext3} style={[styles.button, { width: '100%' }]}>
                            <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Next</Text>
                        </ThemedButton>
                        </View>
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

                        <TextInput
                        style={[
                            styles.input,
                            {
                            backgroundColor: theme.uiBackground,
                            color: theme.text,
                            borderColor: theme.iconColor,
                            },
                        ]}
                        placeholder="example@email.com"
                        placeholderTextColor={theme.iconColor}
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        />

                        <Spacer height={25} />

                        <View style={styles.buttonRow}>
                        <ThemedButton onPress={handleNext4} style={[styles.button, { width: '100%' }]}>
                            <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Next</Text>
                        </ThemedButton>
                        </View>
                    </>
                    ) : (
                    <>
                        <View style={{ alignItems: 'flex-start' }}>
                        <Pressable onPress={handleBack5}>
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
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor, paddingRight: 40 }]}
                                placeholder="Enter password"
                                placeholderTextColor={theme.iconColor}
                                value={formData.password}
                                onChangeText={(text) => handleChange('password', text)}
                                secureTextEntry={!showPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} style={[styles.eyeIcon, { backgroundColor: theme.uiBackground }]}>
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.iconColor} />
                            </Pressable>
                        </View>

                        <Spacer height={15} />
                        <ThemedText style={styles.label}>Confirm Password</ThemedText>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor, paddingRight: 40 }]}
                                placeholder="Confirm password"
                                placeholderTextColor={theme.iconColor}
                                value={formData.confirmPassword}
                                onChangeText={(text) => handleChange('confirmPassword', text)}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={[styles.eyeIcon, { backgroundColor: theme.uiBackground }]}>
                                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={theme.iconColor} />
                            </Pressable>
                        </View>

                        <Spacer height={25} />
                        <View style={styles.buttonRow}>
                            <ThemedButton onPress={handleSubmit} style={[styles.button, { width: '100%' }]}>
                                <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Register</Text>
                            </ThemedButton>
                        </View>
                    </>
                )}

            </ScrollView>
            <Link href='/login' style={styles.link}>
                <ThemedText style={{ textAlign: 'center', marginBottom: 50 }}>Already have an account? Login Instead</ThemedText>
            </Link>
            <Spacer height={30} />

            <ThemedAlert visible={alert.visible} message={alert.message} onClose={closeAlert} />

        </ThemedView>

        
    );
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
        width: 47,
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

    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
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
    passwordContainer: {
        position: 'relative',
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: 12,
        padding: 5,
        borderRadius: 15,
    },
    button: {
        width: '48%',
        alignItems: 'center',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    link: {
        marginTop: 10,
    },
});
