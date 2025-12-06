// samplereactnative/app/(dashboard)/home

import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, Animated, RefreshControl  } from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useSQLiteContext } from 'expo-sqlite';

import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import ThemedSearch from '../../components/ThemedSearch';
import ThemedAchievement from '../../components/ThemedAchievement';
import ThemedActivity from '../../components/ThemedActivity';
import { lightenColor } from '../../utils/colorUtils';
import { ProfileContext } from '../../contexts/ProfileContext';
import { useContext } from 'react';
import { ASSETS_ICONS } from '../../data/assets_icon';
import { getLocalAvatarPath } from '../../utils/avatarHelper';
import usePullToRefresh from "../../hooks/usePullToRefresh";


const Home = () => {
  const colorScheme = useColorScheme();
  const { themeColors, user } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current; // starts fully visible

  const [subjectsProgress, setSubjectsProgress] = useState([]);

  const [recentActivities, setRecentActivities] = useState([]);

  const [avatarUri, setAvatarUri] = useState(null);

  const [achievements, setAchievements] = useState([]);
  const db = useSQLiteContext();
  const { refreshControlProps } = usePullToRefresh(db);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const result = await db.getAllAsync(
          `SELECT * FROM pupil_achievements`,
        );
        setAchievements(result);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      }
    };

    fetchAchievements();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // After fade-out, update content
        setCurrentIndex((prev) => (prev + 1) % achievements.length);

        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [achievements, fadeAnim]);

  useEffect(() => {
    setCurrentIndex(0); // Always start from first real achievement
    fadeAnim.setValue(1); // Reset opacity
  }, [achievements]);

  useEffect(() => {
    const loadSubjectsProgress = async () => {
      try {
        const result = await db.getAllAsync(`
         SELECT 
            s.subject_id,
            s.subject_name,
            COUNT(l.lesson_id) AS total_lessons,
            SUM(CASE WHEN l.status = 1 OR l.progress >= 100 THEN 1 ELSE 0 END) AS completed_lessons,
            CASE 
              WHEN COUNT(l.lesson_id) = 0 THEN 0 
              ELSE ROUND(
                SUM(CASE WHEN l.status = 1 OR l.progress >= 100 THEN 1 ELSE 0 END) * 100.0 / COUNT(l.lesson_id)
              , 1)
            END AS progress_percentage
          FROM subjects s
          LEFT JOIN lessons l ON l.subject_belong = s.subject_id
          GROUP BY s.subject_id, s.subject_name
          ORDER BY s.subject_name ASC;
        `);

        setSubjectsProgress(result);
      } catch (error) {
        console.error('Failed to load subjects:', error);
        setSubjectsProgress([]);
      }
    };

    loadSubjectsProgress();
    const interval = setInterval(loadSubjectsProgress, 15000);
    return () => clearInterval(interval);
  }, [db]);

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        const activities = await db.getAllAsync(`
          -- Completed lessons
          SELECT 
            'lesson' AS type,
            'Completed Lesson' AS status,
            l.lesson_title AS title,
            l.completed_at AS timestamp,
            l.lesson_id AS source_id

          FROM lessons l
          WHERE l.completed_at IS NOT NULL

          UNION ALL

          -- Accessed content
          SELECT 
            'content' AS type,
            'Accessed' AS status,
            sc.title AS title,
            sc.last_accessed AS timestamp,
            sc.content_id AS source_id

          FROM subject_contents sc
          WHERE sc.last_accessed IS NOT NULL

          UNION ALL

          -- Achievements
          SELECT 
            'achievement' AS type,
            'Achievement Unlocked' AS status,
            pa.title AS title,
            pa.earned_at AS timestamp,
            pa.id AS source_id

          FROM pupil_achievements pa
          WHERE pa.earned_at IS NOT NULL

          ORDER BY timestamp DESC
          LIMIT 15
        `);

        const now = Date.now();
        const formatted = activities.map((act, index) => {
          const diffMs = now - new Date(act.timestamp).getTime();
          const diffMin = Math.floor(diffMs / 60000);
          const diffHr = Math.floor(diffMin / 60);
          const diffDay = Math.floor(diffHr / 24);

          let timeAgo = '';
          if (diffMin < 1) timeAgo = 'just now';
          else if (diffMin < 60) timeAgo = `${diffMin}m ago`;
          else if (diffHr < 24) timeAgo = `${diffHr}h ago`;
          else if (diffDay < 7) timeAgo = `${diffDay}d ago`;
          else timeAgo = '1w+ ago';

          return {
            id: `${act.type}-${act.source_id}-${index}`, // 100% unique!
            title: act.title,
            status: act.status,
            time: timeAgo,
          };
        });

        setRecentActivities(formatted);
      } catch (err) {
        console.error('Recent activity error:', err);
        setRecentActivities([]);
      }
    };

    loadRecentActivity();
    const interval = setInterval(loadRecentActivity, 30000);
    return () => clearInterval(interval);
  }, [db]);

  useEffect(() => {
    (async () => {
      if (!user) {
        setAvatarUri(null);
        return;
      }

      // If we have file name → check if local file exists
      if (user.avatar_file_name) {
        const localPath = getLocalAvatarPath(user.avatar_file_name);
        try {
          const info = await FileSystem.getInfoAsync(localPath);
          if (info.exists) {
            setAvatarUri(localPath);
            console.log('Local avatar found:', localPath);
            return;
          }
        } catch (e) {
          console.log('Avatar file check failed');
        }
      }

      // Fallback to thumbnail
      setAvatarUri(user.avatar_thumbnail || null);
    })();
  }, [user]);


  return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl {...refreshControlProps} />}
      >
        
        {/* Header with Search and Avatar */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/searchpage')} style={{ width: '80%'}}>
            <ThemedSearch 
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.search}
              inputStyle={styles.searchInput}
              editable={false}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/profile_page')}
            >
            <Image
              key={avatarUri || 'no-avatar'}   // ← Forces remount when URI changes
              source={{ uri: avatarUri || undefined }}
              style={styles.avatar}
              onLoad={() => console.log('AVATAR LOADED:', avatarUri)}
              onError={(e) => {
                console.log('IMAGE ERROR:', e.nativeEvent.error);
                console.log('CURRENT URI:', avatarUri);
              }}
            />
          </TouchableOpacity>
        </View>

        <Spacer height={20} />

        {/* Welcome Section */}
        <ThemedText title={true} style={styles.welcomeText}>
          Welcome back!
        </ThemedText>
        <ThemedText style={styles.subtitle}>Time to continue your quest...</ThemedText>

        <Spacer height={30} />

        {/* Achievements Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>🌟 Your Achievements</ThemedText>
          <Link href="/achievements_page">
            <ThemedText style={styles.seeAll}>View All</ThemedText>
          </Link>
        </View>

        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
          }}
        >
          {achievements.length > 0 ? (
            <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
              <ThemedAchievement
                iconLibrary="Ionicons"
                iconName={achievements[currentIndex]?.icon ?? 'trophy'}
                iconColor={achievements[currentIndex]?.color ?? '#FFD700'}
                title={achievements[currentIndex]?.title ?? 'No title'}
                subtext={achievements[currentIndex]?.description ?? 'N/A'}
                showConfetti={
                  achievements[currentIndex]?.title === 'Top Performer'
                }
                cardStyle={{
                  backgroundColor: lightenColor(
                    achievements[currentIndex]?.color ?? '#FFD700',
                    0.4
                  ),
                  borderColor: achievements[currentIndex]?.color ?? '#FFD700',
                  width: '100%',
                }}
                badgeStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
              />
            </Animated.View>
          ) : (
            <ThemedText style={{ opacity: 0.6, textAlign: 'center', paddingVertical: 20 }}>No achievements yet.</ThemedText>
          )}
        </View>

        <Spacer height={30} />

        {/* Recent Activities Carousel */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>📚 Recent Activity</ThemedText>
          <Link href="/recent_activity_page">
            <ThemedText style={styles.seeAll}>See all</ThemedText>
          </Link>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <ThemedActivity
                key={index} // Simple, safe, no warning gone
                title={activity.title}
                status={activity.status}
                time={activity.time}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                No recent activity yet.
              </ThemedText>
            </View>
          )}
        </ScrollView>

        <Spacer height={30} />

        {/* Subjects Progress */}
        <ThemedText style={styles.sectionTitle}>📖 Your Subjects</ThemedText>
        
        {subjectsProgress.length > 0 ? (
          subjectsProgress.map((subject) => {
            const subjectKey = subject.subject_name.trim();
            const asset = ASSETS_ICONS[subjectKey] || ASSETS_ICONS['English']; // fallback
            const subjectColor = asset?.color || '#888888';

            return (
              <View key={subject.subject_id} style={styles.subjectContainer}>
                <View style={styles.subjectHeader}>
                  <ThemedText style={styles.subjectName}>{subjectKey}</ThemedText>
                  <ThemedText style={styles.progressText}>
                    {Math.round(subject.progress_percentage)}%
                  </ThemedText>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${subject.progress_percentage}%`,
                        backgroundColor: subjectColor,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.subjectContainer}>
            <ThemedText style={{ opacity: 0.6, textAlign: 'center', paddingVertical: 20 }}>
              No subjects enrolled yet.
            </ThemedText>
          </View>
        )}
      </ScrollView>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Spacer height={100} />
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  search: {
    width: '100%',
  },
  searchInput: {
    borderRadius: 150,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  carousel: {
    paddingVertical: 10,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderColor: '#5f6e85',
    borderWidth: 2,
    borderRadius: 10,
    padding: 20,
    width: 150,
    marginRight: 10,
  },
  activityTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  activityStatus: {
    fontSize: 12,
    marginBottom: 3,
  },
  activityTime: {
    color: '#999',
    fontSize: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 100,
    paddingVertical: 20,
  },
  emptyStateText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  subjectContainer: {
    marginBottom: 10,
    marginTop: 10,
    width: '100%', // Ensure full width
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectName: {
    fontWeight: '600',
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    width: '100%', // Critical - must have explicit width
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden', // Ensures rounded corners for fill
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    // No width here - it's set inline
  },
  progressText: {
    fontSize: 12,
  },
});