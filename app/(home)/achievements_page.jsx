// app/(dashboard)/achievements_page.tsx  (or .js)

import React, { useContext, useLayoutEffect, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedAchievement from '../../components/ThemedAchievement';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { safeExec, safeGetAll, safeRun, safeGetFirst } from '../../utils/dbHelpers';

const AchievementsPage = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const {db, inizialized} = useSQLiteContext();

  const [achievements, setAchievements] = useState([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'Your Achievements' });
  }, [navigation]);

  useEffect(() => {
    const loadAchievements = async () => {
      if (!db || !inizialized) {
        return;
      }
      try {
        const result = await safeGetAll(db, `
          SELECT 
            title,
            description AS subtext,
            icon,
            color,
            earned_at
          FROM pupil_achievements 
          WHERE title IS NOT NULL AND title != ''
          ORDER BY earned_at DESC
        `);

        setAchievements(result);
      } catch (error) {
        console.error('Failed to load achievements:', error);
      }
    };

    loadAchievements();
  }, [db]);

  if (achievements.length === 0) {
    return (
      <ThemedView style={styles.container} safe={true}>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No achievements yet.</ThemedText>
          <ThemedText style={styles.emptySubtext}>Keep learning to unlock awards!</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Spacer height={12} />

        {achievements.map((a, index) => (
          <View key={`${a.title}-${a.earned_at}-${index}`} style={styles.cardWrap}>
            <ThemedAchievement
              iconLibrary="Ionicons"
              iconName={a.icon || 'trophy'}
              iconColor={a.color || '#FFD700'}
              title={a.title}
              subtext={a.subtext || 'Great job!'}
              cardStyle={{
                width: '100%',
                backgroundColor: `${a.color || '#FFD700'}20`, // 12% opacity
                borderColor: a.color || '#FFD700',
              }}
              badgeStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              }}
              showConfetti={index === 0} // Optional: confetti on newest
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
    paddingBottom: 40,
  },
  cardWrap: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});