// SAMPLEREACTAPP/app/(auth)/login.jsx
import React, { useState, useContext, useEffect  } from 'react';
import { KeyboardAvoidingView, StyleSheet, Image, View, ActivityIndicator, Platform} from 'react-native'
import { Link, useRouter, Redirect } from 'expo-router'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'
import { useUser } from '../../hooks/useUser'
import { UserContext } from '../../contexts/UserContext';

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'
import ThemedButton from '../../components/ThemedButton'
import ThemedAlert from '../../components/ThemedAlert'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedPasswordInput from '../../components/ThemedPasswordInput'

const login = () => {
    const router = useRouter()
    const {
        login,
    } = useContext(UserContext);
    const [email, setemail] = useState('');
    const [password, setPassword] = useState('');
    const [alert, setAlert] = useState({ visible: false, message: '' });
    const [loading, setLoading] = useState(false);
    const showAlert = (msg) => setAlert({ visible: true, message: msg });
    const closeAlert = () => setAlert({ ...alert, visible: false });
    const { setUser } = useUser();
    const { user, isLoading } = useUser();

    useEffect(() => {
        if (user) {
            router.replace('/home');
        }
    }, [user]); // Only run when user changes

    const handleSubmit = async () => {
        setLoading(true);
        if (!!!email || !!!password){
            return showAlert( 'Pls enter your email and password');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return showAlert('Invalid email format.');
        }
            
        try{
            await login(email, password); // Use login from context
            router.replace('/home');
        } catch (error){
            showAlert(error.message);
        } finally {
            setLoading(false);
        }

    };

    // Show loading indicator while checking auth state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ThemedView style={styles.container} safe={true}>
            <View style={styles.logoContainer}>
            <Image 
                source={require('../../assets/img/Login_Logo.png')} // Update path to your logo
                style={styles.logo}
                resizeMode="contain"
            />
            </View>
            {/* Welcome Message */}
            
            <ThemedText title={true} style={styles.welcome}>Welcome!</ThemedText>
            <ThemedText style={styles.subtitle}>Please login to your account</ThemedText>
            
            <Spacer height={30} />
            
            <ThemedText style={styles.label}>Email</ThemedText>
            <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : undefined}>
                <ThemedTextInput
                    value={email}
                    onChangeText={setemail}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </KeyboardAvoidingView>
            
            
            <Spacer height={20} />
            
            {/* Password with Forgot Password link */}
            <View style={styles.passwordHeader}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <Link href="/forgot-password" style={styles.forgotPassword}>
                    <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
                </Link>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ThemedPasswordInput
                    value={password}
                    onChangeText={setPassword}
                />
            </KeyboardAvoidingView>
            
            
            <Spacer height={30} />
            
            <ThemedButton onPress={handleSubmit} > Login </ThemedButton>
            
            <Spacer height={20} />
            
            <ThemedText style={{ textAlign: 'center' }}>Don't have an account? {''}
                <Link href='/register' style={styles.link}>
                    Register Instead
                </Link>
            </ThemedText>

            <ThemedAlert visible={alert.visible} message={alert.message} onClose={closeAlert} />
        </ThemedView>
    )
}

export default login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 10,
    },
    logo: {
        width: 100,  // Adjust as needed
        height: 100, // Adjust as needed
    },
    welcome: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 0,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        marginLeft: 5,
        marginBottom: 8,
    },
    forgotPassword: {
        marginRight: 5,
    },
    forgotPasswordText: {
        color: '#007AFF', // iOS-like blue link color
        fontSize: 14,
    },
    link: {
        marginTop: 10,
        color: Colors.primary,
        fontWeight: 'bold',
    },
})