import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, Animated  } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import ThemedSearch from '../../components/ThemedSearch';
import ThemedAchievement from '../../components/ThemedAchievement';
import ThemedActivity from '../../components/ThemedActivity';
import { ProfileContext } from '../../contexts/ProfileContext';
import { useContext } from 'react';


const Home = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current; // starts fully visible

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
  }, []);

  const recentActivities = [
    { id: 1, title: 'Lesson 1 English', status: 'Recent', time: '2h ago' },
    { id: 2, title: 'Quiz Science', status: 'Completed', time: '1d ago' },
    { id: 3, title: 'Assignment Math', status: 'Due Tomorrow', time: '5h ago' },
    
  ];

  const subjects = [
    { name: 'English', progress: 75 },
    { name: 'Filipino', progress: 60 },
    { name: 'Science', progress: 45 },
    { name: 'Math', progress: 80 },
  ];

  const achievements = [
    {
      id: '1',
      iconName: 'trophy',
      iconColor: '#FFD700',
      title: 'Top Performer',
      subtext: "You're in the top 5%!",
      bgColor: '#FFF9E6',
      borderColor: '#FFD700',
    },
    {
      id: '2',
      iconName: 'alarm',
      iconColor: '#90be6d',
      title: 'Early Bird',
      subtext: 'Logged in before 7AM!',
      bgColor: '#ECFDF5',
      borderColor: '#90be6d',
    },
    {
      id: '3',
      iconName: 'ribbon',
      iconColor: '#ffb703',
      title: 'Badge Unlocked',
      subtext: 'Fast Learner unlocked!',
      bgColor: '#FFF6E5',
      borderColor: '#ffb703',
    },
    {
      id: '4',
      iconName: 'school',
      iconColor: '#7cb9e8',
      title: 'Subject Enrolled',
      subtext: 'You joined Science G4',
      bgColor: '#E6F4FF',
      borderColor: '#7cb9e8',
    },
    {
      id: '5',
      iconName: 'checkmark-done-circle',
      iconColor: '#9d4edd',
      title: 'Task Completed',
      subtext: 'Assignment turned in!',
      bgColor: '#F3E8FF',
      borderColor: '#9d4edd',
    },
  ];


  return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
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
          
          <TouchableOpacity>
            <Image 
              source={{ uri: `https://api.dicebear.com/9.x/bottts-neutral/png?seed=Aidan` }}
              style={styles.avatar}
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
            backgroundColor: achievements[currentIndex].bgColor, // match current card
            borderRadius: 18,
          }}
        >
          <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
            <ThemedAchievement
              iconLibrary="Ionicons"
              iconName={achievements[currentIndex].iconName}
              iconColor={achievements[currentIndex].iconColor}
              title={achievements[currentIndex].title}
              subtext={achievements[currentIndex].subtext}
              showConfetti={achievements[currentIndex].title === 'Top Performer'}
              cardStyle={{
                backgroundColor: achievements[currentIndex].bgColor,
                borderColor: achievements[currentIndex].borderColor,
                width: '100%',
              }}
              badgeStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              }}
            />
          </Animated.View>
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
          {recentActivities.map((activity) => (
            <ThemedActivity
              key={activity.id}
              title={activity.title}
              status={activity.status}
              time={activity.time}
            />
          ))}
        </ScrollView>

        <Spacer height={30} />

        {/* Subjects Progress */}
        <ThemedText style={styles.sectionTitle}>📖 Your Subjects</ThemedText>
        
        {subjects.map((subject, index) => (
          <View key={index} style={styles.subjectContainer}>
            <View style={styles.subjectHeader}>
              <ThemedText style={styles.subjectName}>{subject.name}</ThemedText>
              <ThemedText style={styles.progressText}>{subject.progress}%</ThemedText>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${subject.progress}%`,
                    backgroundColor: theme.tint, // Fallback color
                  }
                ]}
              />
            </View>
          </View>
        ))}
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
    paddingBottom: 10,
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