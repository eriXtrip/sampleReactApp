// samplereactapp/app/(home)/subject_page.jsx

import React, { useContext, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { useIsFocused } from "@react-navigation/native";
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Animated, ImageBackground, Platform, SectionList } from 'react-native';
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
import { UserContext } from '../../contexts/UserContext';
import { getLocalAvatarPath } from '../../utils/avatarHelper';
import { ensureLessonFile } from '../../utils/fileHelper';
import { SUBJECT_ICON_MAP } from '../../data/lessonData';
import { lightenColor } from '../../utils/colorUtils';
import { handleDownload } from '../../utils/handleDownload';
import { handleDelete } from '../../utils/handleDelete';
import { useDownloadQueue } from '../../contexts/DownloadContext';
import { ASSETS_ICONS } from '../../data/assets_icon';


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

  const accentColor = ASSETS_ICONS[subjectName]?.color ?? '#48cae4';
  const iconName = 'book';

  const bannerHeight = 0;

  const [activeTab, setActiveTab] = useState(0); // 0 = Lesson, 1 = Map, 2 = Achievement
  const scrollRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [downloading, setDownloading] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState({});

  const { addDownload, updateDownload, removeDownload, clearQueue } = useDownloadQueue();


  // Animated scroll value used to lift the details view up as the list scrolls
  const scrollY = useRef(new Animated.Value(0)).current;

  // File system directory for lesson contents
  const LESSONS_DIR = `${FileSystem.documentDirectory}Android/media/${Application.applicationId}/lesson_contents/`;

  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [achievements, setAchievements] = useState([]);

  const isFocused = useIsFocused();

  // Fetch lessons & achievements from local DB
  useEffect(() => {
    if (isFocused) {
      fetchLessonsAndAchievements();
    }
  }, [isFocused, db, subject_id]);

  const fetchLessonsAndAchievements = async () => {
    try {
      // 1️⃣ Fetch lessons for this subject
      const lessonsData = await db.getAllAsync(
        `SELECT lesson_id, lesson_title AS title, quarter AS Quarter, status, description, lesson_number
        FROM lessons
        WHERE subject_belong = ?
        ORDER BY lesson_number ASC`, // or DESC for descending order
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

  const toggleSelect = (lesson_number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lesson_number)) {
        newSet.delete(lesson_number);
      } else {
        newSet.add(lesson_number);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  // Mark selected lessons as done
  const onMarkDone = async () => {
    if (selectedIds.size === 0) return;

    try {
      for (const lessonNumber of selectedIds) {
        // Find lesson object
        const lesson = lessons.find(l => l.lesson_number === lessonNumber);
        if (!lesson) continue;

        // Update all subject_contents for this lesson
        await db.runAsync(
          `UPDATE subject_contents
          SET done = 1
          WHERE lesson_belong = ?`,
          [lesson.lesson_id]
        );

        // Optionally, mark lesson itself as done
        await db.runAsync(
          `UPDATE lessons
          SET status = 1
          WHERE lesson_id = ?`,
          [lesson.lesson_id]
        );
      }

      console.log("✅ Selected lessons marked as done");
      await fetchLessonsAndAchievements();

      // Clear selection
      clearSelection();

    } catch (err) {
      console.error("❌ Error marking lessons done:", err);
    }
  };

  // Mark selected lessons as undone
  const onUndone = async () => {
    if (selectedIds.size === 0) return;

    try {
      for (const lessonNumber of selectedIds) {
        const lesson = lessons.find(l => l.lesson_number === lessonNumber);
        if (!lesson) continue;

        await db.runAsync(
          `UPDATE subject_contents
          SET done = 0
          WHERE lesson_belong = ?`,
          [lesson.lesson_id]
        );

        await db.runAsync(
          `UPDATE lessons
          SET status = 0
          WHERE lesson_id = ?`,
          [lesson.lesson_id]
        );
      }

      console.log("✅ Selected lessons marked as undone");
      await fetchLessonsAndAchievements();

      clearSelection();

    } catch (err) {
      console.error("❌ Error marking lessons undone:", err);
    }
  };

  
  const onDelete = async () => {
    if (selectedIds.size === 0) return;

    for (const lesson_number of selectedIds) {
      const lesson = lessons.find(l => l.lesson_number === lesson_number);
      if (!lesson) continue;

      const contents = await getContentsForLesson(lesson.lesson_id);

      for (const content of contents) {
        const fileName = getFileNameForLesson(content);
        if (!fileName) continue;

        await handleDelete(
          fileName,
          content.content_type,
          () => {}  // setFileExists not needed here
        );
      }
    }

    console.log("🗑️ Deleted all downloaded files for selected lessons.");
    clearSelection();
  };

  const onDownload = async () => {
    if (!db) return;
    if (selectedIds.size === 0) return;

    setDownloading(true);

    try {
      const lessonsToDownload = Array.from(selectedIds);

      // 1️⃣ Collect all content items first
      let allContents = [];
      for (const lessonNumberOrId of lessonsToDownload) {
        const lessonId = lessonNumberOrId;

        const contents = await db.getAllAsync(
          `SELECT content_id, title, file_name, url, content_type FROM subject_contents WHERE lesson_belong = ?`,
          [lessonId]
        );

        contents.forEach(c => {
          const fileName = getFileNameForLesson(c);
          if (!fileName) return;

          // Add to global download queue immediately
          addDownload({
            id: c.content_id,
            title: c.title,
            status: 'queued',
            progress: 0
          });

          // Prepare item for async download
          allContents.push({ ...c, fileName });
        });
      }

      // 2️⃣ Start downloads asynchronously, independent of each other
      allContents.forEach(async (c) => {
        // update status to downloading
        updateDownload(c.content_id, { status: 'downloading', progress: 0 });

        const localPath = await handleDownload(
          c.fileName,
          c.url,
          c.content_type,
          () => {},
          () => {}
        );

        if (localPath) {
          updateDownload(c.content_id, { status: 'completed', progress: 100 });

          // mark in SQLite
          try {
            await db.runAsync(
              `UPDATE subject_contents 
              SET downloaded_at = datetime('now'), file_name = ?, is_synced = 0
              WHERE content_id = ?`,
              [c.fileName, c.content_id]
            );
          } catch (e) {
            console.warn('Failed to update subject_contents after download', e);
          }
        } else {
          updateDownload(c.content_id, { status: 'failed', progress: 0 });
          console.warn('Download failed for', c);
        }
      });

    } catch (err) {
      console.error('❌ Download error:', err);
    } finally {
      setDownloading(false);
    }
  };




  // Auto-exit selection mode when no cards are selected
  useEffect(() => {
    if (selectionMode && selectedIds.size === 0) {
      setSelectionMode(false);
    }
  }, [selectedIds, selectionMode]);

  // helper: maps lesson type to actual filename
  const getFileNameForLesson = (item) => {
    if (!item) return null;
    // use explicit file_name column if present
    if (item.file_name && item.file_name.trim() !== "") return item.file_name;

    // otherwise try to parse from url
    const url = item.url || item.content || "";
    if (!url) return null;

    try {
      const parts = url.split('/');
      const last = parts[parts.length - 1] || parts[parts.length - 2] || '';
      return decodeURIComponent(last);
    } catch (e) {
      return null;
    }
  };


  const getContentsForLesson = async (lessonId) => {
    try {
      return await db.getAllAsync(
        `SELECT content_id, content_type, url, file_name
        FROM subject_contents 
        WHERE lesson_belong = ?`,
        [lessonId]
      );
    } catch (err) {
      console.error("❌ Error loading contents for lesson:", err);
      return [];
    }
  };

  
  const { user } = useContext(UserContext);

  const subjectIcon = SUBJECT_ICON_MAP[subjectName] || SUBJECT_ICON_MAP.English;

  // local avatar path for current user (if any)
  const currentAvatarPath = user?.avatar_file_name ? getLocalAvatarPath(user.avatar_file_name) : user?.avatar_url || null;

  const renderLessonCard = ({ item, index }) => {
    const isSelected = selectedIds.has(item.lesson_number);
    const isDone = item.status === 1 || item.status === true;

    // Lock if previous lesson is not done (except first lesson)
    // Since we now render from sections, find the absolute position in the `lessons` array.
    const globalIndex = lessons.findIndex(l => l.lesson_id === item.lesson_id);
    const isLocked = globalIndex > 0 && !(lessons[globalIndex - 1].status === 1 || lessons[globalIndex - 1].status === true);

    return (
      <TouchableOpacity
        disabled={!selectionMode && isLocked} // ✅ In normal mode, locked is blocked
        onPress={() => {
          if (selectionMode) {
            toggleSelect(item.lesson_number); // ✅ only toggle this item
          } else if (!isLocked) {
            router.push({
              pathname: '/lesson_page',
              params: {
                id: item.lesson_id,
                lesson_number: item.lesson_number,
                accentColor: encodeURIComponent(accentColor),
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
            toggleSelect(item.lesson_number); // ✅ start selecting only this one
          }
        }}
        style={[
          styles.cardBox,
          isSelected && { backgroundColor: lightenColor(accentColor, 0.4), borderColor: accentColor },
          isDone && { borderColor: accentColor },
          isLocked && !selectionMode,
        ]}
      >
        {/* Lesson Number */}
        <View style={[styles.numberBox, isDone && { backgroundColor: accentColor }]}>
          <ThemedText style={styles.lessonNumber}>{item.lesson_number}</ThemedText>
          {isLocked && !selectionMode && (
            <Ionicons
              name="lock-closed"
              size={30}
              style={styles.lockIcon}
            />
          )}
        </View>

        {/* Lesson Title + Quarter */}
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.lessonTitle}>
            {item.title} {isLocked && !selectionMode}
          </ThemedText>
          <ThemedText style={styles.quarterText}>Quarter {item.Quarter}</ThemedText>
        </View>

        {selectionMode && (
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={28}
            color={isSelected ? accentColor : '#ccc'}
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

  // create an Animated SectionList for quarter grouping
  const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

  // Group lessons by quarter and sort them
  const groupedSections = useMemo(() => {
    if (!lessons || lessons.length === 0) return [];

    const map = {};
    lessons.forEach((l) => {
      const q = l.Quarter ?? '1';
      if (!map[q]) map[q] = [];
      map[q].push(l);
    });

    return Object.keys(map)
      .map((q) => ({ quarter: q, data: map[q].sort((a, b) => a.lesson_number - b.lesson_number) }))
      .sort((a, b) => Number(a.quarter) - Number(b.quarter));
  }, [lessons]);

  const renderQuarterHeader = ({ section }) => {
    const q = section.quarter;
    return (
      <View style={styles.quarterHeader}>
        <View style={[styles.quarterLine, { backgroundColor: theme.cardBorder }]} />
        <View style={[styles.quarterBadge, { borderColor: accentColor }]}>
          <ThemedText style={[styles.quarterTextHeader, { color: accentColor }]}>Quarter {q}</ThemedText>
        </View>
        <View style={[styles.quarterLine, { backgroundColor: theme.cardBorder }]} />
      </View>
    );
  };

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
            <View style={[styles.tabContent, { paddingBottom: selectionMode ? 70 : 0 }]}>
          <AnimatedSectionList
            sections={groupedSections}
            keyExtractor={(item) => String(item.lesson_id)}
            renderItem={({ item, index, section }) => renderLessonCard({ item, index })}
            renderSectionHeader={renderQuarterHeader}
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
        <ImageBackground source={require('../../assets/img/Gemini_Generated_Image_s24765s24765s247.png')} style={{ width: screenWidth, marginBottom:0 }} resizeMode="cover">
          <View style={[styles.tabContent, { paddingBottom: 0, paddingHorizontal: 20 }] }>
            <Map
              lessons={lessons}
              groupedLessons={groupedSections}
              cols={5}
              progress={progress}
              accentColor={accentColor}
              currentAvatar={currentAvatarPath}
              currentUserName={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : null}
            />
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
    position: 'relative',
    marginRight: 12,
    marginHorizontal: 8,
  },
  lessonNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  lockIcon: {
    position: "absolute",
    color: '#112954',
    bottom: -10,   // push slightly outside if you want
    right: -10,    // move to the corner
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
  quarterHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  quarterLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  quarterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.92)'
  },
  quarterTextHeader: {
    fontSize: 13,
    fontWeight: '700',
  },
});