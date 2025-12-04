// components/ThemedActivity.jsx
import { View, StyleSheet } from 'react-native';
import ThemedText from './ThemedText';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { ProfileContext } from '../contexts/ProfileContext';
import { useContext } from 'react';

const ThemedActivity = ({
  title,
  status,
  time,
  cardStyle,
  titleStyle,
  statusStyle,
  timeStyle,
}) => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[theme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  return (
    <View style={[
      styles.activityCard,
      { 
        backgroundColor: theme.navBackground,
        borderColor: theme.cardBorder || '#e0e0e0'
      },
      cardStyle
    ]}>
      <ThemedText style={[styles.activityTitle, titleStyle, { color: theme.text }]}>
        {title}
      </ThemedText>
      <ThemedText style={[
        styles.activityStatus, 
        { color: theme.text },
        statusStyle
      ]}>
        {status}
      </ThemedText>
      <ThemedText style={[
        styles.activityTime,
        { color: theme.text },
        timeStyle
      ]}>
        {time}
      </ThemedText>
    </View>
  );
};

export default ThemedActivity;

const styles = StyleSheet.create({
  activityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: 160,
    marginRight: 12,
  },
  activityTitle: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 14,
  },
  activityStatus: {
    fontSize: 12,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    opacity: 0.8,
  },
});