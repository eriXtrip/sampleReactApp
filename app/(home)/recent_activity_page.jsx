import React, { useContext, useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { useColorScheme } from 'react-native';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedActivity from '../../components/ThemedActivity';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const RECENT_ACTIVITIES = [
  { id: 'ra-1', title: 'Lesson 1 English', status: 'Recent', time: '2h ago' },
  { id: 'ra-2', title: 'Quiz Science', status: 'Completed', time: '1d ago' },
  { id: 'ra-3', title: 'Assignment Math', status: 'Due Tomorrow', time: '5h ago' },
  { id: 'ra-4', title: 'Watched: Ecosystems', status: 'Viewed', time: '3h ago' },
  { id: 'ra-5', title: 'Flashcards: Vocab A', status: 'Completed', time: '2d ago' },
  { id: 'ra-6', title: 'Practice: Fractions', status: 'In Progress', time: '20m ago' },
  { id: 'ra-7', title: 'Pretest: Geography', status: 'Completed', time: '4d ago' },
  { id: 'ra-8', title: 'Reading: Chapter 3', status: 'Recent', time: '30m ago' },
];

const RecentActivityPage = () => {
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
        <Spacer height={8} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {RECENT_ACTIVITIES.map((a) => (
            <View key={a.id} style={[styles.itemWrap, { width: '48%' }]}>
              <ThemedActivity
                title={a.title}
                status={a.status}
                time={a.time}
                cardStyle={{
                  width: '100%',
                  backgroundColor: theme.navBackground,
                  borderColor: theme.cardBorder,
                }}
                titleStyle={{ color: theme.text }}
                statusStyle={{ color: theme.text, opacity: 0.9 }}
                timeStyle={{ color: theme.text, opacity: 0.7 }}
              />
            </View>
          ))}
        </View>

        <Spacer height={12} />
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
    paddingBottom: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  itemWrap: {
    marginBottom: 12,
  },
});
