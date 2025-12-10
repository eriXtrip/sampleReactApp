import { useContext, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { ProfileContext } from '../contexts/ProfileContext';

const ThemedActionBar = ({
  visible,
  onMarkDone,
  onUndone,
  onDownload,
  onDelete,
  style,
  showMarkDone = false, // New prop to control visibility
  showUndone = false,   // New prop to control visibility
}) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  if (!visible) return null;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.navBackground,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowColor: '#000',
        zIndex: 2,
      },
      style,
    ]}>
      <View style={styles.row}>
        {/* Conditionally render Mark as Done */}
        {showMarkDone && (
          <TouchableOpacity
            style={styles.action}
            onPress={onMarkDone}
          >
            <Ionicons name="checkmark-done-outline" size={20} color={theme.text} />
            <Text style={[styles.hintText, { color: theme.text }]}>Mark as done</Text>
          </TouchableOpacity>
        )}

        {/* Conditionally render Undone */}
        {showUndone && (
          <TouchableOpacity
            style={styles.action}
            onPress={onUndone}
          >
            <Ionicons name="close-outline" size={20} color={theme.text} />
            <Text style={[styles.hintText, { color: theme.text }]}>Undone</Text>
          </TouchableOpacity>
        )}

        {/* Always show Download */}
        <TouchableOpacity
          style={styles.action}
          onPress={onDownload}
        >
          <Ionicons name="cloud-download-outline" size={28} color={theme.text} />
          <Text style={[styles.hintText, { color: theme.text }]}>Download</Text>
        </TouchableOpacity>

        {/* Always show Delete */}
        <TouchableOpacity
          style={styles.action}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={28} color={theme.text} />
          <Text style={[styles.hintText, { color: theme.text }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'android' ? 15 : 12,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    flex: 1,
  },
  hintText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default ThemedActionBar;