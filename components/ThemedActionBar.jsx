import { useContext, useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { ProfileContext } from '../contexts/ProfileContext';

// Bottom action bar overlay styled similarly to ThemedTabs
// Props:
// - visible: boolean
// - onMarkDone: () => void
// - onUndone: () => void
// - onDownload: () => void
// - onDelete: () => void
// - style?: ViewStyle (optional)
const ThemedActionBar = ({
  visible,
  onMarkDone,
  onUndone,
  onDownload,
  onDelete,
  style,
}) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const [activeHint, setActiveHint] = useState(null); // 'done' | 'undone' | 'download' | 'delete' | null
  const hintTimerRef = useRef(null);

  const showHint = (key) => {
    setActiveHint(key);
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }
    hintTimerRef.current = setTimeout(() => {
      setActiveHint(null);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.navBackground,
        shadowColor: '#000',
        zIndex: 2,
      },
      style,
    ]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.action}
          onPress={onMarkDone}
          onLongPress={() => showHint('done')}
        >
          <Ionicons name="checkmark-done-outline" size={28} color={theme.text} />
          {activeHint === 'done' && (
            <Text style={[styles.hintText, { color: theme.text }]}>Mark as done</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={onUndone}
          onLongPress={() => showHint('undone')}
        >
          <Ionicons name="close-outline" size={28} color={theme.text} />
          {activeHint === 'undone' && (
            <Text style={[styles.hintText, { color: theme.text }]}>Undone</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={onDownload}
          onLongPress={() => showHint('download')}
        >
          <Ionicons name="cloud-download-outline" size={28} color={theme.text} /> 
          {activeHint === 'download' && (
            <Text style={[styles.hintText, { color: theme.text }]}>Download</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={onDelete}
          onLongPress={() => showHint('delete')}
        >
          <Ionicons name="trash-outline" size={28} color={theme.text} />
          {activeHint === 'delete' && (
            <Text style={[styles.hintText, { color: theme.text }]}>Delete</Text>
          )}
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
    paddingTop: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  hintText: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default ThemedActionBar;
