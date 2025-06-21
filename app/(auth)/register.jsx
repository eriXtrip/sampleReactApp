import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

const Register = () => {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme] ?? Colors.light;

    const [step, setStep] = useState(0); // Step 0 = Role select
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        role: '', // 'Pupil' or 'Teacher'
        lrn: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
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

    const handleNext = () => setStep(2);
    const handleBack1 = () => setStep(1);
    const handleBack0 = () => setStep(0);

    const handleSubmit = () => {
        console.log('Registration data:', formData);
        router.replace('/');
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Spacer height={20} />

                <ThemedText title={true} style={styles.title}>
                    {step === 0 ? 'Register As' : step === 1 ? 'Personal Information' : 'Account Details'}
                </ThemedText>

                <Spacer height={20} />

                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressStep, step >= 0 && styles.activeStep]}>
                        <ThemedText style={styles.progressText}>1</ThemedText>
                    </View>
                    <View style={[styles.progressLine, step >= 1 && styles.activeLine]} />
                    <View style={[styles.progressStep, step >= 1 && styles.activeStep]}>
                        <ThemedText style={styles.progressText}>2</ThemedText>
                    </View>
                    <View style={[styles.progressLine, step >= 2 && styles.activeLine]} />
                    <View style={[styles.progressStep, step === 2 && styles.activeStep]}>
                        <ThemedText style={styles.progressText}>3</ThemedText>
                    </View>
                </View>

                <Spacer height={20} />

                {/* Step 0: Role Selection */}
                {step === 0 ? (
                    <>
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
                        <ThemedText style={styles.label}>First Name</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                            placeholder="Enter first name"
                            placeholderTextColor={theme.iconColor}
                            value={formData.firstName}
                            onChangeText={(text) => handleChange('firstName', text)}
                            autoCapitalize="words"
                        />

                        <Spacer height={15} />
                        <ThemedText style={styles.label}>Middle Name</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                            placeholder="Enter middle name"
                            placeholderTextColor={theme.iconColor}
                            value={formData.middleName}
                            onChangeText={(text) => handleChange('middleName', text)}
                            autoCapitalize="words"
                        />

                        <Spacer height={15} />
                        <ThemedText style={styles.label}>Last Name</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                            placeholder="Enter last name"
                            placeholderTextColor={theme.iconColor}
                            value={formData.lastName}
                            onChangeText={(text) => handleChange('lastName', text)}
                            autoCapitalize="words"
                        />

                        <Spacer height={15} />
                        <ThemedText style={styles.label}>Suffix (Optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                            placeholder="e.g. Jr, Sr, III"
                            placeholderTextColor={theme.iconColor}
                            value={formData.suffix}
                            onChangeText={(text) => handleChange('suffix', text)}
                            autoCapitalize="characters"
                        />

                        <Spacer height={25} />
                        <View style={styles.buttonRow}>
                            <ThemedButton onPress={handleBack0} style={[styles.button, styles.secondaryButton]}>
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Back</Text>
                            </ThemedButton>
                            <ThemedButton onPress={handleNext} style={[styles.button, { width: '50%' }]}>
                                <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Next</Text>
                            </ThemedButton>
                        </View>
                        
                    </>
                ) : (
                    <>
                        <ThemedText style={styles.label}>LRN</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                            placeholder="Enter LRN"
                            placeholderTextColor={theme.iconColor}
                            value={formData.lrn}
                            onChangeText={(text) => handleChange('lrn', text)}
                            keyboardType="numeric"
                        />

                        <Spacer height={15} />
                        <ThemedText style={styles.label}>Email</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text, borderColor: theme.iconColor }]}
                            placeholder="Enter email"
                            placeholderTextColor={theme.iconColor}
                            value={formData.email}
                            onChangeText={(text) => handleChange('email', text)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

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
                            <ThemedButton onPress={handleBack1} style={[styles.button, styles.secondaryButton]}>
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Back</Text>
                            </ThemedButton>

                            <ThemedButton onPress={handleSubmit} style={styles.button}>
                                <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Register</Text>
                            </ThemedButton>
                        </View>
                    </>
                )}

                <Spacer height={15} />
                <Link href='/login' style={styles.link}>
                    <ThemedText style={{ textAlign: 'center' }}>Already have an account? Login Instead</ThemedText>
                </Link>
            </ScrollView>
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
    progressStep: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeStep: {
        backgroundColor: Colors.primary,
    },
    progressText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    progressLine: {
        height: 2,
        width: 40,
        backgroundColor: '#ddd',
        marginHorizontal: 5,
    },
    activeLine: {
        backgroundColor: Colors.primary,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        marginLeft: 5,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
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
