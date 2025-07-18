import { StyleSheet, View, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { useContext, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';
import ThemedAlert from '../../components/ThemedAlert';
import ThemedPasswordInput from '../../components/ThemedPasswordInput';
import { UserContext } from '../../contexts/UserContext';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const ChangePassword = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const { user, changepassword } = useContext(UserContext) || {}; // Fallback to empty object
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Redirect to login if user is not available
    if (!user) {
        return (
        <ThemedView style={[styles.container, styles.loadingContainer]}>
            <ThemedText>No user data found</ThemedText>
            <ThemedButton onPress={() => router.replace('/login')}>
            Go to Login
            </ThemedButton>
        </ThemedView>
        );
    }


  const showAlert = (title, message) => {
    setAlert({ visible: true, title, message });
  };

  const passwordHint = () => {
    showAlert(
      'Tips for a strong password',
      '• Combine upper and lower case letters, numbers, and special characters (e.g., $, #, &, etc.).\n\n' +
      '• Keep your password at least 8 to 12 characters long.\n\n' +
      '• Avoid consecutive characters (e.g., 12345, abcde, qwerty, etc.) or repeating characters (e.g., 11111).\n\n' +
      '• Avoid personal info like names of friends or relatives, your birthday, or your address.\n\n' +
      '• Avoid common or obvious words (e.g., password, maya, bank, money, etc.).\n\n' +
      '• Avoid using the same password from other accounts you own.'
    );
  };

  const handleChange = (field, text) => {
    setFormData(prev => ({ ...prev, [field]: text }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      showAlert('Error', 'Current password is required.');
      return false;
    }
    if (!formData.newPassword) {
      showAlert('Error', 'New password is required.');
      return false;
    }
    if (formData.newPassword.length < 8) {
      showAlert('Error', 'New password must be at least 8 characters long.');
      return false;
    }
    if (!/^(?!\d{8,}$)(?!.*(.)\1{3}).*$/.test(formData.newPassword)) {
      showAlert('Error', 'New password must not be all numbers or contain repeating characters.');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showAlert('Error', 'New password and confirm password do not match.');
      return false;
    }
    return true;
  };

  const handleSubmitNewPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (!user) {
        showAlert('Error', 'User data not available. Please log in again.');
        return;
      }

      if (!changepassword) {
        showAlert('Error', 'Change password function not available. Please try again.');
        return;
      }

      await changepassword({
        server_id: user.server_id,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      showAlert('Success', 'Password changed successfully.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showAlert('Error', error.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ThemedText>No user data found</ThemedText>
        <ThemedButton onPress={() => router.replace('/login')}>
          Go to Login
        </ThemedButton>
        <ThemedAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert({ visible: false, title: '', message: '' })}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safe={true}>
      <ThemedText title={true} style={styles.title}>
        Create a new password
      </ThemedText>

      <ThemedText style={{ marginBottom: 20, marginLeft: 4, fontSize: 14, color: theme.text }}>
        Create a new password with at least 8 letters or numbers. It should be something others can't guess.
      </ThemedText>

      <Spacer height={15} />

      <View style={[styles.card, { backgroundColor: theme.navBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}>
        <ThemedText style={styles.label}>
          Current Password
          <Pressable onPress={() => showAlert('Current Password', 'Enter your current password to verify your identity.')}>
            <Ionicons name="alert-circle" size={18} color={theme.warning} style={{ paddingLeft: 5 }} />
          </Pressable>
        </ThemedText>
        <ThemedPasswordInput
          placeholder="Enter current password"
          value={formData.currentPassword}
          onChangeText={(text) => handleChange('currentPassword', text)}
        />

        <Spacer height={15} />
        <ThemedText style={styles.label}>
          New Password
          <Pressable onPress={passwordHint}>
            <Ionicons name="alert-circle" size={18} color={theme.warning} style={{ paddingLeft: 5 }} />
          </Pressable>
        </ThemedText>
        <ThemedPasswordInput
          placeholder="Enter new password"
          value={formData.newPassword}
          onChangeText={(text) => handleChange('newPassword', text)}
        />

        <Spacer height={15} />
        <ThemedText style={styles.label}>Confirm Password</ThemedText>
        <ThemedPasswordInput
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
        />

        <Spacer height={25} />
      </View>

      <Spacer height={15} />
      <ThemedButton onPress={handleSubmitNewPassword} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </ThemedButton>

      <ThemedAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ visible: false, title: '', message: '' })}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: Colors.light.textSecondary || Colors.light.text,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChangePassword;