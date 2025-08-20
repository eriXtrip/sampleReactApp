import React, { useContext, useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { useColorScheme } from 'react-native';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedAchievement from '../../components/ThemedAchievement';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const Achievements = [
  {
    id: 'first-lesson',
    iconLibrary: 'Ionicons',
    iconName: 'trophy',
    iconColor: '#f59e0b',
    title: 'Bronze Star',
    subtext: 'Completed your first lesson',
    cardStyle: { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' },
    badgeStyle: { backgroundColor: 'rgba(253, 186, 116, 0.25)' },
  },
  {
    id: 'quiz-90',
    iconLibrary: 'Ionicons',
    iconName: 'ribbon',
    iconColor: '#10b981',
    title: 'Quiz Whiz',
    subtext: 'Scored 90%+ on Post Test',
    cardStyle: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
    badgeStyle: { backgroundColor: 'rgba(110, 231, 183, 0.25)' },
  },
  {
    id: 'streak-3',
    iconLibrary: 'Ionicons',
    iconName: 'flame',
    iconColor: '#ef4444',
    title: 'On Fire',
    subtext: '3-day learning streak',
    cardStyle: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
    badgeStyle: { backgroundColor: 'rgba(252, 165, 165, 0.25)' },
  },
  {
    id: 'map-progress',
    iconLibrary: 'Ionicons',
    iconName: 'rocket',
    iconColor: '#3b82f6',
    title: 'Explorer',
    subtext: 'Reached 25% map progress',
    cardStyle: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
    badgeStyle: { backgroundColor: 'rgba(147, 197, 253, 0.25)' },
  },
  {
    id: 'perfect-score',
    iconLibrary: 'Ionicons',
    iconName: 'medal',
    iconColor: '#eab308',
    title: 'Perfect Score',
    subtext: 'Ace a test with 100%',
    cardStyle: { backgroundColor: '#FEFCE8', borderColor: '#FDE68A' },
    badgeStyle: { backgroundColor: 'rgba(253, 230, 138, 0.25)' },
  },
  {
    id: 'five-lessons',
    iconLibrary: 'Ionicons',
    iconName: 'star',
    iconColor: '#8b5cf6',
    title: 'Dedicated Learner',
    subtext: 'Complete 5 lessons',
    cardStyle: { backgroundColor: '#F5F3FF', borderColor: '#C4B5FD' },
    badgeStyle: { backgroundColor: 'rgba(196, 181, 253, 0.25)' },
  },
  {
    id: 'first-quiz',
    iconLibrary: 'Ionicons',
    iconName: 'school',
    iconColor: '#22c55e',
    title: 'First Quiz',
    subtext: 'Finish your first quiz',
    cardStyle: { backgroundColor: '#ECFDF5', borderColor: '#86EFAC' },
    badgeStyle: { backgroundColor: 'rgba(134, 239, 172, 0.25)' },
  },
  {
    id: 'reading-time',
    iconLibrary: 'Ionicons',
    iconName: 'book',
    iconColor: '#0ea5e9',
    title: 'Bookworm',
    subtext: 'Read for 60 minutes',
    cardStyle: { backgroundColor: '#E0F2FE', borderColor: '#93C5FD' },
    badgeStyle: { backgroundColor: 'rgba(147, 197, 253, 0.25)' },
  },
  {
    id: 'productive-day',
    iconLibrary: 'Ionicons',
    iconName: 'time',
    iconColor: '#06b6d4',
    title: 'Productive Day',
    subtext: 'Study for 30 minutes in a day',
    cardStyle: { backgroundColor: '#ECFEFF', borderColor: '#67E8F9' },
    badgeStyle: { backgroundColor: 'rgba(103, 232, 249, 0.25)' },
  },
  {
    id: 'bulk-complete',
    iconLibrary: 'Ionicons',
    iconName: 'checkmark-done',
    iconColor: '#22c55e',
    title: 'Checklist Champ',
    subtext: 'Mark 10 tasks as done',
    cardStyle: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
    badgeStyle: { backgroundColor: 'rgba(134, 239, 172, 0.25)' },
  },
];

const AchievementsPage = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true });
  }, [navigation]);

  return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Spacer height={12} />

        {Achievements.map((a) => (
          <View key={a.id} style={styles.cardWrap}>
            <ThemedAchievement
              iconLibrary={a.iconLibrary}
              iconName={a.iconName}
              iconColor={a.iconColor}
              title={a.title}
              subtext={a.subtext}
              cardStyle={{ width: '100%', ...a.cardStyle }}
              badgeStyle={a.badgeStyle}
              showConfetti={false}
            />
          </View>
        ))}

        <Spacer height={24} />
      </ScrollView>
    </ThemedView>
  );
};

export default AchievementsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  cardWrap: {
    marginBottom: 16,
  },
});
