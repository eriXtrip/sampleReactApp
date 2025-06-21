import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'
import ThemedButton from '../../components/ThemedButton'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'

const Login = () => {
    const router = useRouter()
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = () => {
        console.log('login form submitted')
        router.replace('/')
    }

    return (
        <ThemedView style={styles.container}>
            <Spacer height={40} />
            
            <ThemedText title={true} style={styles.title}>Login to Your Account</ThemedText>
            
            <Spacer height={30} />
            
            <ThemedText style={styles.label}>Email or LRN</ThemedText>
            <TextInput
                style={[styles.input, { 
                    backgroundColor: theme.uiBackground,
                    color: theme.text,
                    borderColor: theme.iconColor
                }]}
                placeholder="Enter email or LRN"
                placeholderTextColor={theme.iconColor}
                autoCapitalize="none"
                keyboardType="email-address"
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