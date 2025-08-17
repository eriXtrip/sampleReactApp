import React, { useContext, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { ProfileContext } from '../contexts/ProfileContext';

/*
Props:
- type: 'subject' | 'section' (affects icon and accent color)
- name: string (Subject name or Section name)
- createdBy: string
- schoolYear: string
- requiresEnrollmentKey?: boolean (if true, shows a key icon to indicate enrollment key required)
- onPress?: function (optional)
*/

const typeToIcon = {
  subject: { icon: 'book', color: '#48cae4' },
  section: { icon: 'layers', color: '#9d4edd' },
};

const SearchResultCard = ({ type = 'subject', name, createdBy, schoolYear, requiresEnrollmentKey = false, style, onPress }) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const { icon, color } = useMemo(() => typeToIcon[type] || typeToIcon.subject, [type]);

  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={[
          styles.card,
          {
            borderTopColor: color,
            borderTopWidth: 9,
            borderLeftColor: theme.navBackground,
            borderLeftWidth: 5,
            borderRightColor: theme.navBackground,
            borderRightWidth: 5,
            borderBottomWidth: 0,
            backgroundColor: theme.navBackground,
            shadowColor: theme.tint,
          },
          style,
        ]}
      >
        <Ionicons name={icon} size={30} style={[styles.icon, { color: theme.notifColor }]} />
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.cardTitle}>{name}</ThemedText>
            {requiresEnrollmentKey && (
              <Ionicons name="key" size={18} style={[styles.keyIcon, { color: theme.notifColor }]} />
            )}
          </View>
          <ThemedText style={styles.meta}>Created by: {createdBy}</ThemedText>
          <ThemedText style={styles.meta}>School Yr: {schoolYear}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
    
  );
};

export default SearchResultCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 10,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyIcon: {
    marginLeft: 6,
  },
  meta: {
    fontSize: 14,
    marginTop: 2,
  },
});
