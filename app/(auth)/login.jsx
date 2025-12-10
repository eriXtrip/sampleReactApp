// SAMPLEREACTAPP/app/(auth)/login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { KeyboardAvoidingView, StyleSheet, Image, View, ActivityIndicator, Platform, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Link, useRouter, Redirect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../hooks/useUser';
import { UserContext } from '../../contexts/UserContext';
import { ApiUrlContext } from '../../contexts/ApiUrlContext';
import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedAlert from '../../components/ThemedAlert';
import ThemedTextInput from '../../components/ThemedTextInput';
import ThemedPasswordInput from '../../components/ThemedPasswordInput';
import ApiConfigScreen from '../contact';
import { clearApiUrl } from '../../utils/apiManager';
import { wait } from '../../utils/wait';

const Login = () => {
  const router = useRouter();
  const { login } = useContext(UserContext);
  const { refreshApiUrl } = useContext(ApiUrlContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState({ visible: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!user) return;

    const goHome = async () => {
      await wait(1500); 
      router.replace('/home');
    };

    goHome();
  }, [user]);


  const handleSubmit = async () => {
    setLoading(true);
    console.log('Login button pressed');
    if (!email || !password) {
      setLoading(false);
      return showAlert('Please enter your email and password');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoading(false);
      return showAlert('Invalid email format.');
    }
    try {
      const result = await login(email, password);
      
      // Check if user is web user or mobile user
      if (result.isWebUser) {
        // Navigate to in-app browser for web users (roles 1 & 2)
        console.log('Navigating to in-app browser for web user');
        await wait(1500);
        router.replace({
          pathname: '/inapp-browser',
          params: {
            url: encodeURIComponent('https://mquestlaraveladmin-production-231c.up.railway.app/'),
            title: 'MQuest Web Portal'
          }
        });
      } else {
        // Navigate to home for mobile users (role 3)
        console.log('Navigating to home for mobile user');
        await wait (1500);
        router.replace('/home');
      }
    } catch (error) {
      showAlert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (msg) => setAlert({ visible: true, message: msg });
  const closeAlert = () => setAlert({ ...alert, visible: false });

  const handleLogoPress = async () => {
    setCleared(false);
    router.replace('/');
  };

  const handleApiConfigComplete = () => {
    setCleared(false);
    router.replace('/login');
  };

  const handleAccountPress = async () => {
    await clearApiUrl();
    console.log('✅ API URL cleared!');
    setCleared(true);
  };

  const handleTestSQLInjection = () => {
    router.replace('/TestSQLInjectionScreen');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Pull-to-refresh triggered');
    await refreshApiUrl();
    console.log('🔄 Pull-to-refresh completed');
    setRefreshing(false);
  };

  if (cleared) return <ApiConfigScreen onComplete={handleApiConfigComplete} />;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container} safe={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={handleLogoPress}>
            <Image
              source={require('../../assets/img/Login_Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* onPress={handleTestSQLInjection} */}
        <TouchableOpacity >
          <ThemedText title={true} style={styles.welcome}>
            Welcome!
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleAccountPress}>
          <ThemedText style={styles.subtitle}>Please login to your account</ThemedText>
        </TouchableOpacity>

        <Spacer height={30} />

        <ThemedText style={styles.label}>Email</ThemedText>
        <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : undefined}>
          <ThemedTextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </KeyboardAvoidingView>

        <Spacer height={20} />

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

        <ThemedButton onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : 'Login'}
        </ThemedButton>

        <Spacer height={20} />

        <ThemedText style={{ textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link href="/register" style={styles.link}>
            Register Instead
          </Link>
        </ThemedText>

        <ThemedAlert visible={alert.visible} message={alert.message} onClose={closeAlert} />
      </ScrollView>
    </ThemedView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 100,
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
    color: '#007AFF',
    fontSize: 14,
  },
  link: {
    marginTop: 10,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});