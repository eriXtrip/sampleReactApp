import React, { useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const SUBJECTS = [
  { id: '1', icon: require('../../assets/icons/math_.png'), title: 'Mathematics', grade: 'Grade 4' },
  { id: '2', icon: require('../../assets/icons/saturn_.png'), title: 'Science', grade: 'Grade 4' },
  { id: '3', icon: require('../../assets/icons/english_.png'), title: 'English', grade: 'Grade 4' },
  { id: '4', icon: require('../../assets/icons/filipino_.png'), title: 'Filipino', grade: 'Grade 4' },
];

const CLASSMATES = [
  { id: '1', name: 'Alice Santos' },
  { id: '2', name: 'Ben Cruz' },
  { id: '3', name: 'Carlos Dela Cruz' },
  { id: '4', name: 'Diana Lim' },
  { id: '5', name: 'Evan Reyes' },
  { id: '6', name: 'Fiona Garcia' },
  { id: '7', name: 'Gio Tan' },
  { id: '8', name: 'Hana Lee' },
];

const SectionPage = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'Section' });
  }, [navigation]);

  const { name = '', createdBy = '', schoolYear = '' } = useLocalSearchParams();

  const accentColor = '#9d4edd'; // same accent used for sections in subject_detail
  const iconName = 'layers';

  const bannerHeight = Math.round(Dimensions.get('window').height * 0.2);

  const [activeTab, setActiveTab] = useState(0); // 0 = Subjects, 1 = Classmates
  const scrollRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;

  // Animated scroll value used to lift the details view up as the list scrolls
  const scrollY = useRef(new Animated.Value(0)).current;

  // initial overlap (already applied as negative margin in the original layout)
  const initialOverlap = Math.round(bannerHeight * 0.18);
  // how much of the banner should remain visible when collapsed (peek)
  const bannerPeek = 32;
  // the maximum additional upward shift we allow (beyond initialOverlap)
  const maxShift = Math.max(0, bannerHeight - bannerPeek - initialOverlap);

  // translateY for the details view (clamped)
  const detailsTranslateY = scrollY.interpolate({
    inputRange: [0, maxShift],
    outputRange: [0, -maxShift],
    extrapolate: 'clamp',
  });

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

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity>
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

  // shared onScroll handler for both lists so details move when either list scrolls
  const animatedOnScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return (
    <ThemedView style={styles.container} safe={true}>
      {/* Accent banner with centered icon */}
      <View style={[styles.banner, { backgroundColor: accentColor, height: bannerHeight, zIndex: 0 }]}>
        <Ionicons name={iconName} size={56} color="#fff" />
      </View>

      <Spacer height={12} />

      {/* Details (Animated) - will translate up over the banner as the list scrolls */}
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
        {/* Subjects tab */}
        <Animated.View style={ {width: screenWidth}}>
          <View style={styles.tabContent}>
            <Animated.FlatList
              data={SUBJECTS}
              keyExtractor={(item) => item.id}
              renderItem={renderSubjectItem}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              // attach animated scroll so details move
              onScroll={animatedOnScroll}
              scrollEventThrottle={16}
              nestedScrollEnabled
            />
          </View>
        </Animated.View>

        {/* Classmates tab */}
        <View style={{ width: screenWidth }}>
          <View style={styles.tabContent}>
            <Animated.FlatList
              data={CLASSMATES}
              keyExtractor={(item) => item.id}
              renderItem={renderClassmateItem}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              onScroll={animatedOnScroll}
              scrollEventThrottle={16}
              nestedScrollEnabled
            />
          </View>
        </View>
      </Animated.ScrollView>

      <Spacer height={20} />
    </ThemedView>
  );
};

export default SectionPage;

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
    marginBottom: -1, // visually connect to bottom border
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Subject card styles copied to match dashboard/subjectlist.jsx
  subjectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
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
  // Classmates list styles
  classmateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});
