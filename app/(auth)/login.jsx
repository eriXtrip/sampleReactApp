import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'
import ThemedButton from '../../components/ThemedButton'
import ThemedAlert from '../../components/ThemedAlert'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'

const Login = () => {
    const router = useRouter()
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [showPassword, setShowPassword] = useState(false)

    const [emailOrLrn, setEmailOrLrn] = useState('');
    const [password, setPassword] = useState('');
    const [alert, setAlert] = useState({ visible: false, message: '' });

    const showAlert = (msg) => setAlert({ visible: true, message: msg });
    const closeAlert = () => setAlert({ ...alert, visible: false });

    const handleSubmit = () => {
        if (!emailOrLrn.trim() || !password) {
            showAlert('Please enter both Email and Password.');
            return;
        }

        console.log('Login submitted:', { emailOrLrn, password });
        router.replace('/home');
    };


    return (
        <ThemedView style={styles.container} safe={true}>
            <Spacer height={40} />
            
            <ThemedText title={true} style={styles.title}>Login to Your Account</ThemedText>
            
            <Spacer height={30} />
            
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
                style={[styles.input, { 
                    backgroundColor: theme.uiBackground,
                    color: theme.text,
                    borderColor: theme.iconColor
                }]}
                placeholder="Enter email"
                placeholderTextColor={theme.iconColor}
                autoCapitalize="none"
                keyboardType="email-address"
                value={emailOrLrn}
                onChangeText={setEmailOrLrn}
            />
            
            <Spacer height={20} />
            
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={[styles.input, { 
                        backgroundColor: theme.uiBackground,
                        color: theme.text,
                        borderColor: theme.iconColor,
                        paddingRight: 40 // Make space for the eye icon
                    }]}
                    placeholder="Enter password"
                    placeholderTextColor={theme.iconColor}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <Pressable 
                    onPress={() => setShowPassword(!showPassword)}
                    style={[styles.eyeIcon, { backgroundColor: theme.uiBackground }]}
                >
                    <Ionicons 
                        name={showPassword ? 'eye-off' : 'eye'} 
                        size={20} 
                        color={theme.iconColor} 
                    />
                </Pressable>
            </View>
            
            <Spacer height={30} />
            
            <ThemedButton onPress={handleSubmit} style={styles.button}>
                <Text style={{ color: '#f2f2f2', fontWeight: 'bold' }}>Login</Text>
            </ThemedButton>
            
            <Spacer height={20} />
            
            <Link href='/register' style={styles.link}>
                <ThemedText style={{ textAlign: 'center' }}>Don't have an account? Register Instead</ThemedText>
            </Link>

            <ThemedAlert visible={alert.visible} message={alert.message} onClose={closeAlert} />

        </ThemedView>
    )
}

export default Login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 20,
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
        width: '100%',
        alignItems: 'center',
    },
    link: {
        marginTop: 10,
    },
})