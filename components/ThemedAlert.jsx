import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ProfileContext } from '../contexts/ProfileContext';
import { useContext } from 'react';

const ThemedAlert = ({ visible, message, onClose }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertBox, { backgroundColor: theme.alertBackground, borderColor: theme.uiBackground }]}>
          <Ionicons name="alert-circle" size={30} color={theme.warning} />
          <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
          <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.warning }]}>
            <Text style={{ color: theme.background, fontWeight: 'bold' }}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default ThemedAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 15,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
