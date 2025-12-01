import React, { useContext, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ASSETS_ICONS } from '../../data/assets_icon';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const SectionPage = () => {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const navigation = useNavigation();
  const { section_id = '', name = '', createdBy = '', schoolYear = '' } = useLocalSearchParams();

  const iconName = ASSETS_ICONS.Section?.icon ? 'section' : 'layers';
  const accentColor = ASSETS_ICONS.Section?.color || '#9d4edd';

  const bannerHeight = Math.round(Dimensions.get('window').height * 0.2);
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;

  const scrollY = useRef(new Animated.Value(0)).current;
  const initialOverlap = Math.round(bannerHeight * 0.18);
  const bannerPeek = 32;
  const maxShift = Math.max(0, bannerHeight - bannerPeek - initialOverlap);

  const detailsTranslateY = scrollY.interpolate({
    inputRange: [0, maxShift],
    outputRange: [0, -maxShift],
    extrapolate: 'clamp',
  });

  const [subjects, setSubjects] = useState([]);
  const [classmates, setClassmates] = useState([]);

  // Fetch subjects and classmates from SQLite
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Query subjects
        const subjectsResult = await db.getAllAsync(`
          SELECT s.subject_id, s.subject_name, s.grade_level
          FROM subjects_in_section sis
          JOIN subjects s ON sis.subject_id = s.subject_id
          WHERE sis.section_belong = ?
        `, [section_id]);

        // Map subjects with icons and grade
        const mappedSubjects = subjectsResult.map(subject => ({
          id: subject.subject_id.toString(),
          icon: ASSETS_ICONS[subject.subject_name]?.icon || require('../../assets/icons/default_.png'),
          title: subject.subject_name,
          grade: subject.grade_level ? `Grade ${subject.grade_level}` : 'Grade 4',
        }));
        setSubjects(mappedSubjects);

        console.log("recieved section_id:", section_id);

        // Query classmates
        const classmatesResult = await db.getAllAsync(`
          SELECT id, classmate_name
          FROM classmates
          WHERE section_id = ?
        `, [section_id]);

        // Map classmates
        const mappedClassmates = classmatesResult.map(classmate => ({
          id: classmate.id.toString(),
          name: classmate.classmate_name,
        }));
        setClassmates(mappedClassmates);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (section_id) {
      fetchData();
    }
  }, [section_id, db]);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: '',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate('subjectlist')}>
          <Ionicons name="chevron-back" size={30} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('subject_page', {
          subject_id: item.id,   // ✅ pass subject_id
          name: item.title, 
          grade: item.grade
        })
      }
    >
      <View style={[styles.subjectBox, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
        <Image source={item.icon} style={styles.icon} />
        <View style={styles.textContainer}>
          <ThemedText style={[styles.subjectTitle, { color: theme.text }]}>{item.title}</ThemedText>
          <ThemedText style={[styles.subjectGrade, { color: theme.text }]}>{item.grade}</ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={28} color={theme.text} />
      </View>
    </TouchableOpacity>
  );

  const renderClassmateItem = ({ item }) => (
    <View style={[styles.classmateRow, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
      <Ionicons name="person-circle-outline" size={42} color={theme.text} style={{ marginRight: 12 }} />
      <ThemedText style={{ fontSize: 16 }}>{item.name}</ThemedText>
    </View>
  );

  const animatedOnScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return (
    <ThemedView style={styles.container} safe={true}>
      <View style={[styles.banner, { backgroundColor: accentColor, height: bannerHeight, zIndex: 0 }]}>
        {iconName === 'section' ? (
          <Image source={ASSETS_ICONS.Section.icon} style={styles.bannerIcon} />
        ) : (
          <Ionicons name={iconName} size={56} color="#fff" />
        )}
      </View>

      <Spacer height={12} />

      <Animated.View
        style={[
          styles.details,
          {
            marginTop: -initialOverlap,
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
          <ThemedText style={styles.title}>{String(name)}</ThemedText>
        </View>
        <Spacer height={8} />
        <ThemedText style={styles.meta}>School Yr: {String(schoolYear)}</ThemedText>
        <ThemedText style={styles.meta}>Adviser: {String(createdBy)}</ThemedText>
      </Animated.View>

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
          <ThemedText style={[styles.navText, { color: theme.text }]}>Subjects</ThemedText>
          <View style={[styles.navIndicator, { backgroundColor: activeTab === 0 ? accentColor : 'transparent' }]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onTabPress(1)}>
          <ThemedText style={[styles.navText, { color: theme.text }]}>Classmates</ThemedText>
          <View style={[styles.navIndicator, { backgroundColor: activeTab === 1 ? accentColor : 'transparent' }]} />
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
        <Animated.View style={{ width: screenWidth }}>
          <View style={styles.tabContent}>
            <Animated.FlatList
              data={subjects}
              keyExtractor={(item) => item.id}
              renderItem={renderSubjectItem}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              onScroll={animatedOnScroll}
              scrollEventThrottle={16}
              nestedScrollEnabled
            />
          </View>
        </Animated.View>

        <View style={{ width: screenWidth }}>
          <View style={styles.tabContent}>
            <Animated.FlatList
              data={classmates}
              keyExtractor={(item) => item.id}
              renderItem={renderClassmateItem}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={{ paddingBottom: 10, marginTop: 10 }}
              showsVerticalScrollIndicator={false}
              onScroll={animatedOnScroll}
              scrollEventThrottle={16}
              nestedScrollEnabled
            />
          </View>
        </View>
      </Animated.ScrollView>
    </ThemedView>
  );
};

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
  bannerIcon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
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
    marginTop: 2,
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
    paddingHorizontal: 19,
    paddingBottom: 0,
  },
  subjectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 5,
    borderWidth: 2,
    marginTop: 10,
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 16,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  subjectGrade: {
    fontSize: 14,
    opacity: 0.6,
  },
  classmateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});

export default SectionPage;