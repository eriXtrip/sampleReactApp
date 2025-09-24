// SAMPLEREACTAPP/components/SelfEnrollmentAlert.jsx

import React, { useContext, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { ProfileContext } from '../contexts/ProfileContext';

import ThemedText from './ThemedText';
import ThemedButton from './ThemedButton';
import ThemedPasswordInput from './ThemedPasswordInput';
import { EnrollmentContext } from '../contexts/EnrollmentContext';

const SelfEnrollmentAlert = ({ visible, onClose, onEnroll }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const { loading } = useContext(EnrollmentContext);
  const [keyValue, setKeyValue] = useState('');

  // Use a Modal so KeyboardAvoidingView can move the content when keyboard opens
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <View style={[styles.card, { backgroundColor: theme.navBackground, shadowColor: theme.tint }] }>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={theme.title} />
            </TouchableOpacity>

            <ThemedText style={[styles.title, { color: theme.title }]}>Self enrolment (Pupil)</ThemedText>

            <ThemedPasswordInput
              value={keyValue}
              onChangeText={setKeyValue}
              placeholder="Enrollment key"
            />

            <ThemedButton 
              style={{ marginTop: 50 }} 
              onPress={() => onEnroll?.(keyValue)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Enroll Now'}
            </ThemedButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SelfEnrollmentAlert;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  card: {
    width: '98%',
    maxWidth: 600,
    minHeight: 240,        // made card a bit bigger
    borderRadius: 12,
    padding: 20,           // increased padding a little
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    alignSelf: 'center',
    justifyContent: 'flex-start',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    borderRadius: 16,
    zIndex: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 25,
  },
});
