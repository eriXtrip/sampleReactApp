import React, { useContext, useLayoutEffect, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { useColorScheme} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedActivity from '../../components/ThemedActivity';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { safeExec, safeGetAll, safeRun, safeGetFirst } from '../../utils/dbHelpers';

const RecentActivityPage = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const db = useSQLiteContext();

  const [activities, setActivities] = useState([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'Recent Activity' });
  }, [navigation]);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const raw = await safeGetAll(db, `
          -- Completed Lessons
          SELECT 
            'lesson' AS type,
            'Completed Lesson' AS status,
            l.lesson_title AS title,
            l.completed_at AS timestamp,
            l.lesson_id AS source_id

          FROM lessons l
          WHERE l.completed_at IS NOT NULL

          UNION ALL

          -- Accessed Content (Games, PDFs, Quizzes, etc.)
          SELECT 
            'content' AS type,
            CASE 
              WHEN sc.content_type LIKE '%quiz%' THEN 'Quiz Taken'
              WHEN sc.content_type LIKE '%game%' THEN 'Game Played'
              ELSE 'Content Viewed'
            END AS status,
            sc.title AS title,
            sc.last_accessed AS timestamp,
            sc.content_id AS source_id

          FROM subject_contents sc
          WHERE sc.last_accessed IS NOT NULL

          UNION ALL

          -- Achievements Earned
          SELECT 
            'achievement' AS type,
            'Achievement Unlocked' AS status,
            pa.title AS title,
            pa.earned_at AS timestamp,
            pa.id AS source_id

          FROM pupil_achievements pa
          WHERE pa.earned_at IS NOT NULL

          ORDER BY timestamp DESC
          LIMIT 50
        `);

        const now = Date.now();
        const formatted = raw.map((act, index) => {
          const diffMs = now - new Date(act.timestamp).getTime();
          const diffMin = Math.floor(diffMs / 60000);
          const diffHr = Math.floor(diffMin / 60);
          const diffDay = Math.floor(diffHr / 24);

          let timeAgo = 'just now';
          if (diffMin >= 1 && diffMin < 60) timeAgo = `${diffMin}m ago`;
          else if (diffHr >= 1 && diffHr < 24) timeAgo = `${diffHr}h ago`;
          else if (diffDay >= 1 && diffDay < 7) timeAgo = `${diffDay}d ago`;
          else if (diffDay >= 7) timeAgo = '1w+ ago';

          return {
            id: `${act.type}-${act.source_id}-${index}`,
            title: act.title,
            status: act.status,
            time: timeAgo,
          };
        });

        setActivities(formatted);
      } catch (err) {
        console.error('Failed to load recent activity:', err);
        setActivities([]);
      }
    };

    loadActivity();
    const interval = setInterval(loadActivity, 30000);
    return () => clearInterval(interval);
  }, [db]);

  return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        <Spacer height={8} />

        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No activity yet. Start learning to see your progress!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {activities.map((a) => (
              <View key={a.id} style={styles.activityItem}>
                <ThemedActivity
                  title={a.title}
                  status={a.status}
                  time={a.time}
                  cardStyle={[
                    styles.activityCard,
                    {
                      backgroundColor: theme.navBackground,
                      borderColor: theme.cardBorder,
                    }
                  ]}
                  titleStyle={{ color: theme.text }}
                  statusStyle={{ color: theme.text, opacity: 0.9 }}
                  timeStyle={{ color: theme.text, opacity: 0.7 }}
                />
              </View>
            ))}
          </View>
        )}

        <Spacer height={24} />
      </ScrollView>
    </ThemedView>
  );
};

export default RecentActivityPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  listContainer: {
    flexDirection: 'column',
  },
  activityItem: {
    marginBottom: 14,
    width: '100%',
  },
  activityCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 16,
  },
});