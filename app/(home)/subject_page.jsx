// samplereactapp/app/(home)/subject_page.jsx

import React, { useContext, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Animated, ImageBackground, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as Application from 'expo-application';
import { useSQLiteContext } from 'expo-sqlite';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedAchievement from '../../components/ThemedAchievement';
import Map from '../../components/Map';
import ThemedActionBar from '../../components/ThemedActionBar';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { ensureLessonFile } from '../../utils/fileHelper';
import { SUBJECT_ICON_MAP } from '../../data/lessonData';
import { lightenColor } from '../../utils/colorUtils';

const SubjectPage = () => {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const router = useRouter();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'Subject' });
  }, [navigation]);

  const { subject_id, name = '', grade = '', progress: progressParam} = useLocalSearchParams();
  console.log('SubjectPage params:', { subject_id, name, grade });
  const subjectName = String(name);
  const subjectGrade = String(grade);
  //const progress = Math.max(0, Math.min(100, Number(progressParam ?? 45)));

  const accentColor = '#48cae4';
  const iconName = 'book';

  const bannerHeight = 0;

  const [activeTab, setActiveTab] = useState(0); // 0 = Lesson, 1 = Map, 2 = Achievement
  const scrollRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Animated scroll value used to lift the details view up as the list scrolls
  const scrollY = useRef(new Animated.Value(0)).current;

  // File system directory for lesson contents
  const LESSONS_DIR = `${FileSystem.documentDirectory}Android/media/${Application.applicationId}/lesson_contents/`;

  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [achievements, setAchievements] = useState([]);

  // Fetch lessons & achievements from local DB
  useEffect(() => {
    const fetchLessonsAndAchievements = async () => {
      try {
        // 1️⃣ Fetch lessons for this subject
        const lessonsData = await db.getAllAsync(
          `SELECT lesson_id, lesson_title AS title, quarter AS Quarter, status, description
            FROM lessons
            WHERE subject_belong = ?`,
          [subject_id]
        );

        // 2️⃣ Collect all lesson_ids
        const lessonIds = lessonsData.map(l => l.lesson_id);

        // 3️⃣ Fetch all content_ids related to these lessons
        const contentsData = await db.getAllAsync(
          `SELECT content_id, lesson_belong 
            FROM subject_contents
            WHERE lesson_belong IN (${lessonIds.map(() => '?').join(',')})`,
          lessonIds
        );

        const contentIds = contentsData.map(c => c.content_id);

        // 4️⃣ Fetch pupil achievements for these contents
        const achievementsData = await db.getAllAsync(
          `SELECT * 
            FROM pupil_achievements
            WHERE subject_content_id IN (${contentIds.map(() => '?').join(',')})`,
          [ ...contentIds] // all content IDs
        );

        // 5️⃣ Calculate total progress
        const totalLessons = lessonsData.length;
        const completedLessons = lessonsData.filter(l => l.status === 1 || l.status === true).length;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        setLessons(lessonsData);
        setAchievements(achievementsData);
        setProgress(progressPercent);

      } catch (err) {
        console.error("❌ Error fetching lessons/achievements:", err);
      }
    };

    fetchLessonsAndAchievements();
  }, [db, subject_id]);

  // no banner overlap in SubjectPage
  const initialOverlap = 0;
  const detailsTranslateY = 0;

  const onTabPress = (index) => {
    setActiveTab(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: index * screenWidth, animated: true });
    }
  };

  const onMomentumEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / screenWidth);
    if (index !== activeTab) setActiveTab(index);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  // handlers for action bar
  const onMarkDone = () => {};
  const onUndone = () => {};
  const onDownload = () => {};
  const onDelete = () => {};

  // Auto-exit selection mode when no cards are selected
  useEffect(() => {
    if (selectionMode && selectedIds.size === 0) {
      setSelectionMode(false);
    }
  }, [selectedIds, selectionMode]);

  const [downloadedFiles, setDownloadedFiles] = useState({}); // { lessonId: true/false }

  // helper: maps lesson type to actual filename
  const getFileNameForLesson = (item) => {
    if (!item.content) return null;
    try {
      // take last part of the URL after slash
      const urlParts = item.content.split('/');
      return decodeURIComponent(urlParts[urlParts.length - 1]);
    } catch {
      return null;
    }
  };
  
  const subjectIcon = SUBJECT_ICON_MAP[subjectName] || SUBJECT_ICON_MAP.English;

  const renderLessonCard = ({ item }) => {
    const isSelected = selectedIds.has(item.id);
    const isDone = item.status === 1; // or check truthy values like 1/"true" if needed

    console.log('Rendering lesson item:', item, 'isSelected:', isSelected, 'isDone:', isDone);

    return (
      <TouchableOpacity
        onPress={() => {
          if (selectionMode) {
            toggleSelect(item.id);
          } else {
            router.push({
              pathname: '/lesson_page',
              params: {
                id: item.lesson_id,
                title: item.title,
                description: item.description,
                Quarter: item.Quarter,
              },
            });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelect(item.id);
          }
        }}
        style={[
          styles.cardBox,
          isSelected && { backgroundColor: '#d1f7ff', borderColor: '#00b4d8' }, // selection highlight
          isDone && { borderColor: '#48cae4' }, // ✅ if lesson is done
        ]}
      >
        {/* Lesson Number in a Box */}
        <View style={[styles.numberBox, isDone && { backgroundColor: '#48cae4' }]}>
          <ThemedText style={styles.lessonNumber}>{item.lesson_id}</ThemedText>
        </View>

        {/* Lesson Title + Quarter */}
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.lessonTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.quarterText}>Quarter {item.Quarter}</ThemedText>
        </View>

        {selectionMode && (
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={28}
            color={isSelected ? '#00b4d8' : '#ccc'}
            style={{ marginLeft: 10 }}
          />
        )}
      </TouchableOpacity>
    );
  };



  const animatedOnScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return (
    <ThemedView style={styles.container} safe={true}>
      
      {/* Details (Animated) */}
      <Animated.View
        style={[
          styles.details,
          {
            marginTop: 0,
            borderRadius: 12,
            backgroundColor: theme.background,
            paddingTop: 16,
            paddingBottom: 16,
            shadowRadius: 8,
            overflow: 'hidden',
            zIndex: 2,
            transform: [{ translateY: detailsTranslateY }],
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={subjectIcon} style={styles.subjectIcon} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.title}>{subjectName}</ThemedText>
            {!!subjectGrade && (
              <ThemedText style={[styles.meta, styles.gradeText]}>{subjectGrade}</ThemedText>
            )}
          </View>
        </View>
        <Spacer height={12} />

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }] }>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
          </View>
          <ThemedText style={styles.progressLabel}>{progress}%</ThemedText>
        </View>
      </Animated.View>

      {/* Bottom nav with underline indicator */}
        <Animated.View
          style={[
            styles.navBar,
            {
              borderBottomColor: theme.cardBorder,
              transform: [{ translateY: detailsTranslateY }],
              zIndex: 2,
            },
          ]}
        >
          <TouchableOpacity style={styles.navItem} onPress={() => onTabPress(0)}>
            <ThemedText style={[styles.navText, { color: theme.text }]}>Lesson</ThemedText>
            <View style={[styles.navIndicator, { backgroundColor: activeTab === 0 ? accentColor : 'transparent' }]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onTabPress(1)}>
            <ThemedText style={[styles.navText, { color: theme.text }]}>Map</ThemedText>
            <View style={[styles.navIndicator, { backgroundColor: activeTab === 1 ? accentColor : 'transparent' }]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onTabPress(2)}>
            <ThemedText style={[styles.navText, { color: theme.text }]}>Achievement</ThemedText>
            <View style={[styles.navIndicator, { backgroundColor: activeTab === 2 ? accentColor : 'transparent' }]} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView
          style={{ transform: [{ translateY: detailsTranslateY }] }}
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Lesson tab */}
          <Animated.View style={{ width: screenWidth }}>
            <View style={[styles.tabContent, { paddingBottom: selectionMode ? 90 : 25 }]}>
          <Animated.FlatList
            data={lessons}
            keyExtractor={(item) => String(item.lesson_id)}
            renderItem={renderLessonCard}
            contentContainerStyle={{ paddingBottom: 0 }}
            showsVerticalScrollIndicator={false}
            onScroll={animatedOnScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled
          />
            </View>

            {/* ThemedActionBar is shown only inside the Lesson tab */}
            <ThemedActionBar
              visible={selectionMode}
              onMarkDone={onMarkDone}
              onUndone={onUndone}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          </Animated.View>

        {/* Map tab */}
        <ImageBackground source={require('../../assets/img/download (1).jpg')} style={{ width: screenWidth, marginBottom:25 }} resizeMode="cover">
          <View style={[styles.tabContent, { paddingBottom: 0, paddingHorizontal: 0 }] }>
            <Map stops={lessons.length} cols={5} progress={progress} accentColor={accentColor} />
          </View>
        </ImageBackground>

        {/* Achievement tab */}
        <View style={{ width: screenWidth }}>
            <Animated.ScrollView 
              contentContainerStyle={[styles.tabContent, { alignItems: 'center', paddingBottom: 20 }]} 
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <Spacer height={10} />
              {achievements.length === 0 ? (
                <ThemedText>No achievements yet</ThemedText>
              ) : (
                achievements.map((ach) => (
                  <ThemedAchievement
                    key={ach.id}
                    iconLibrary="Ionicons"
                    iconName={`${ach.icon ?? 'trophy'}`}
                    iconColor={`${ach.color ?? '#FFD700'}`}
                    title={`${ach.title}`}
                    subtext={`${ach.description ?? 'N/A'}`}
                    cardStyle={{
                      width: '100%',
                      backgroundColor: lightenColor(ach.color ?? '#FFD700', 0.4),
                      borderColor: ach.color ?? '#FFD700',
                      marginBottom: 15
                    }}
                    badgeStyle={{
                      backgroundColor: '#fff',
                      borderColor: ach.color ?? '#FFD700'
                    }}
                  />
                ))
              )}
            </Animated.ScrollView>
          </View>
      </Animated.ScrollView>

      <Spacer height={23} />
    </ThemedView>
  );
};

export default SubjectPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  banner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    width: '100%',
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 16,
  },
  gradeText: {
    marginTop: 4,
    opacity: 0.8,
  },
  subjectIcon: {
    width: 64,
    height: 64,
    marginRight: 12,
    resizeMode: 'contain',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  navBar: {
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 16,
    marginBottom: 8,
  },
  navIndicator: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginBottom: -1,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    marginBottom: 5,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#c8caceff',
    borderLeftWidth: 6,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSub: {
    fontSize: 14,
    opacity: 0.6,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepLine: {
    width: 2,
    height: 40,
    marginTop: 2,
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  numberBox: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: '#a9aaadff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginHorizontal: 8,
  },
  lessonNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '600',
    flexShrink: 1,
    color: '#112954',
    marginLeft: 10,
  },
  quarterText: {
    fontSize: 16,
    color: '#888a94',
    marginTop: 1,
    marginLeft: 10,
  },
});