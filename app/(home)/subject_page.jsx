// samplereactapp/app/(home)/subject_page.jsx

import React, { useContext, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Animated, ImageBackground, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedAchievement from '../../components/ThemedAchievement';
import Map from '../../components/Map';
import ThemedActionBar from '../../components/ThemedActionBar';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { ensureLessonFile } from '../../utils/fileHelper';

const SUBJECT_ICON_MAP = {
  Mathematics: require('../../assets/icons/math_.png'),
  Science: require('../../assets/icons/saturn_.png'),
  English: require('../../assets/icons/english_.png'),
  Filipino: require('../../assets/icons/filipino_.png'),
};

const LESSON_CARDS = [
  { id: 'gen', title: 'General', type: 'general', status: true, shortDescription: 'An introductory overview of the subject, covering key concepts and foundations.' },
  { id: 't1', title: 'Topic 1', type: 'ppt', status: true, shortDescription: 'A detailed presentation on the first major topic of the subject.' },
  { id: 'l2', title: 'Lesson 2', type: 'pdf',status: true, shortDescription: 'A comprehensive PDF guide for the second lesson.' },
  { id: 'pre', title: 'Pretest', type: 'test', status: false, shortDescription: 'A preliminary test to assess your initial understanding.' },
  { id: 'match', title: 'Matching Game', status: false, type: 'match', shortDescription: 'An interactive game to reinforce learning through matching exercises.' },
  { id: 'flash', title: 'Flashcard', type: 'flash', status: false, shortDescription: 'Interactive flashcards to help memorize key terms and concepts.' },
  { id: 'post', title: 'Post Test', type: 'test', status: false, shortDescription: 'A final test to evaluate your mastery of the subject.' },
  { 
    id: 'l3', 
    title: 'MATATAG - Science 4 Quarter 1 Week 1 - Science Inventions', 
    type: 'link', 
    status: true,
    shortDescription: 'An external resource link for deeper exploration of the topic.',
    content: 'https://youtu.be/MxHmfZKHLJg?si=G4v1OWHwGmotN5u_' // ✅ add actual link here
  },
  { id: 'l4', title: 'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum', type: 'video', status: true, shortDescription: 'A video lesson explaining advanced concepts visually.' },
];


const LESSON_TYPE_ICON_MAP = {
  general: 'information-circle-outline',
  ppt: 'easel-outline',
  pdf: 'document-attach-outline',
  video: 'videocam-outline',
  link: 'link-outline',
  test: 'document-text-outline',
  match: 'game-controller-outline',
  flash: 'copy-outline',
};

const SubjectPage = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const router = useRouter();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'Subject' });
  }, [navigation]);

  const { name = '', grade = '', progress: progressParam } = useLocalSearchParams();
  const subjectName = String(name);
  const subjectGrade = String(grade);
  const progress = Math.max(0, Math.min(100, Number(progressParam ?? 45)));

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
    if (item.type === 'pdf') return 'Chapter1.pdf';
    if (item.type === 'ppt') return 'Sample PPT.pptx';
    if (item.type === 'video') return 'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum720p.mp4';
    return null;
  };

   // check if files exist in documentDirectory
  useEffect(() => {
    const checkFiles = async () => {
      const status = {};
      for (let item of LESSON_CARDS) {
        const fileName = getFileNameForLesson(item);
        if (fileName) {
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;
          const info = await FileSystem.getInfoAsync(fileUri);
          status[item.id] = info.exists;
        } else {
          status[item.id] = false; // non-file lessons
        }
      }
      setDownloadedFiles(status);
    };

    checkFiles();
  }, []);
  
  const subjectIcon = SUBJECT_ICON_MAP[subjectName] || SUBJECT_ICON_MAP.English;

  const renderLessonCard = ({ item }) => {
    const isSelected = selectedIds.has(item.id);
    const iconName = LESSON_TYPE_ICON_MAP[item.type] || 'book-outline';

    // left border green when done === '1'
    const rawDone = item?.status ?? item?.done ?? false;
    const isDone = rawDone === true || rawDone === 'true' || rawDone === 1 || rawDone === '1';
    const leftBorderColor = isDone ? '#16a34a' : theme.cardBorder;

    return (
      <TouchableOpacity
        onPress={async () => {
          if (selectionMode) {
            toggleSelect(item.id);
          } else {
            let fileUri = '';
            if (item.type === 'pdf') {
              fileUri = ('https://github.com/vinzscam/react-native-file-viewer/raw/master/docs/react-native-file-viewer-certificate.pdf'
                //       await ensureLessonFile(
                // require('../../assets/lessons/Chapter1.pdf'),
                // 'Chapter1.pdf'
              );
            } else if (item.type === 'ppt') {
              fileUri = await ensureLessonFile(
                require('../../assets/lessons/Sample PPT.pptx'),
                'Sample PPT.pptx'
              );
            } else if (item.type === 'video') {
              fileUri = await ensureLessonFile(
                require('../../assets/lessons/Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum720p.mp4'),
                'Illustrate Different Angles Grade 4 Q1 LC1 MATATAG Curriculum720p.mp4'
              );
            } else if (item.type === 'link') {
              fileUri = item.content; // pass the external link directly
            }

            router.push({
              pathname: '/content_details_test',
              params: {
                title: item.title,
                shortDescription: item.shortDescription,
                type: item.type,
                status: item.status,
                content: fileUri,
                subjectName: subjectName,
                subjectGrade: subjectGrade,
              },
            });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) setSelectionMode(true);
          toggleSelect(item.id);
        }}
      >
        <View
          style={[
            styles.cardBox,
            {
              borderStyle: 'solid',
              borderWidth: 2,
              borderColor: isSelected ? '#48cae4' : theme.cardBorder,
              borderLeftWidth: 6,
              paddingLeft: 12,
            },
          ]}
        >
          <Ionicons name={iconName} size={28} color={theme.text} style={{ marginRight: 12 }} />
          <View style={styles.textContainer}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>{item.title}</ThemedText>
            {!!subjectGrade && (
              <ThemedText style={[styles.cardSub, { color: theme.text }]}>{subjectGrade}</ThemedText>
            )}
          </View>
          {selectionMode ? (
            isSelected ? (
              <Ionicons name="checkmark-circle" size={35} color="#48cae4" />
            ) : (
              <Ionicons name="ellipse-outline" size={35} color={theme.text} style={{ opacity: 0.6 }} />
            )
          ) : downloadedFiles[item.id] ? (
            <Ionicons name="checkmark-circle-outline" size={35} color="green" />
          ) : (
            <Ionicons name="arrow-down-circle-outline" size={35} color={theme.text} style={{ opacity: 0.6 }} />
          )}
        </View>
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
              <ThemedText style={[styles.meta, styles.gradeText]}>Grade: {subjectGrade}</ThemedText>
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
            data={LESSON_CARDS}
            keyExtractor={(item) => item.id}
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
            <Map stops={LESSON_CARDS.length} cols={5} progress={progress} accentColor={accentColor} />
          </View>
        </ImageBackground>

        {/* Achievement tab */}
        <View style={{ width: screenWidth }}>
          <View style={[styles.tabContent, { alignItems: 'center' }]}>
             <Spacer height={10} />
            <ThemedAchievement
              iconLibrary="Ionicons"
              iconName="trophy"
              iconColor="#f59e0b"
              title={`Bronze Star`}
              subtext="Completed your first lesson"
              cardStyle={{ width: '100%', backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }}
              badgeStyle={{ backgroundColor: 'rgba(253, 186, 116, 0.25)' }}
            />
            <Spacer height={16} />
            <ThemedAchievement
              iconLibrary="Ionicons"
              iconName="ribbon"
              iconColor="#10b981"
              title={`Quiz Whiz`}
              subtext="Scored 90%+ on Post Test"
              cardStyle={{ width: '100%', backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }}
              badgeStyle={{ backgroundColor: 'rgba(110, 231, 183, 0.25)' }}
              showConfetti={false}
            />
          </View>
        </View>
      </Animated.ScrollView>

      <Spacer height={20} />
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
    padding: 16,
    borderRadius: 10,
    marginBottom: 5,
    marginTop: 10,
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
});