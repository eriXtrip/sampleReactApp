import { use, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'
import { useUser } from '../../hooks/useUser'

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'
import ThemedButton from '../../components/ThemedButton'
import ThemedAlert from '../../components/ThemedAlert'
import ThemedTextInput from '../../components/ThemedTextInput'
import ThemedPasswordInput from '../../components/ThemedPasswordInput'

const login = () => {
    const router = useRouter()

    const [emailOrLrn, setEmailOrLrn] = useState('');
    const [password, setPassword] = useState('');
    const [alert, setAlert] = useState({ visible: false, message: '' });
    const [loading, setLoading] = useState(false);
    const showAlert = (msg) => setAlert({ visible: true, message: msg });
    const closeAlert = () => setAlert({ ...alert, visible: false });
    const { setUser } = useUser();
    const { user } = useUser();

    const handleSubmit = async () => {
        if (!emailOrLrn.trim() || !password) {
            showAlert('Please enter both Email and Password.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save token and user data (implementation depends on your storage solution)
            await SecureStore.setItemAsync('authToken', data.token);
            setUser(data.user);

            router.replace('/home');
        } catch (error) {
            console.error('Login error:', error);
            showAlert(error.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container} safe={true}>
            {/* Welcome Message */}
            <ThemedText title={true} style={styles.welcome}>Welcome!</ThemedText>
            <ThemedText style={styles.subtitle}>Please login to your account</ThemedText>
            
            <Spacer height={30} />
            
            <ThemedText style={styles.label}>Email</ThemedText>
            <ThemedTextInput
                value={emailOrLrn}
                onChangeText={setEmailOrLrn}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
            />
            
            <Spacer height={20} />
            
            {/* Password with Forgot Password link */}
            <View style={styles.passwordHeader}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <Link href="/forgot-password" style={styles.forgotPassword}>
                    <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
                </Link>
            </View>
            <ThemedPasswordInput
                value={password}
                onChangeText={setPassword}
            />
            
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
    welcome: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
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