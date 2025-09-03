import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { useContext } from 'react';
import { ProfileContext } from '../contexts/ProfileContext';

const DangerAlert = ({ visible, message, onCancel, onConfirm }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[
    themeColors === 'system'
      ? (colorScheme === 'dark' ? 'dark' : 'light')
      : themeColors
  ];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.alertBox,
            { backgroundColor: theme.alertBackground, borderColor: theme.uiBackground },
          ]}
        >
          <Ionicons name="warning-outline" size={30} color={theme.danger} />
          <Text style={[styles.message, { color: theme.text }]}>{message}</Text>

          <View style={styles.buttonsRow}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { backgroundColor: theme.cardBorder }]}
            >
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: theme.danger  || "#ff3b30" }]}
            >
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Proceed</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DangerAlert;

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
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
