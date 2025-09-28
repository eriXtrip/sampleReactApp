import React, { useState, useContext } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { LESSONS, LESSON_TYPE_ICON_MAP, SUBJECT_ICON_MAP, LESSON_CARDS } from '../../data/lessonData';

const LessonPage = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const router = useRouter();

  const [expanded, setExpanded] = useState({});
  const [activeLessonId, setActiveLessonId] = useState(LESSONS[0].id);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const renderUpperPart = ({ item }) => {
    if (item.id !== activeLessonId) return null;
    const isExpanded = expanded[item.id] || false;

    return (
      <View style={{ marginBottom: 20 }}>
        {/* Parent Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardContent}>
            <View style={styles.numberBox}>
              <ThemedText style={styles.lessonNumber}>{item.id}</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.lessonTitle}>{item.title}</ThemedText>
              <ThemedText style={styles.quarterText}>Quarter: 1</ThemedText>
            </View>
          </View>
        </View>

        {/* Description + Chevron */}
        <View style={{ marginTop: 10, paddingHorizontal: 10 }}>
          <ThemedText style={[styles.aboutText, { color: theme.text }]}>About this Lesson:</ThemedText>
          <ThemedText style={styles.lessonDescription} numberOfLines={isExpanded ? undefined : 3}>
            {item.description}
          </ThemedText>
          <TouchableOpacity onPress={() => toggleExpand(item.id)} style={{ alignSelf: 'center', marginTop: 8 }}>
            <Ionicons name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Lesson Cards below the upper part */}
        <FlatList
          data={LESSON_CARDS}
          keyExtractor={(card) => card.id}
          renderItem={({ item: card }) => {
            const iconName = LESSON_TYPE_ICON_MAP[card.type] || 'book-outline';
            const rawDone = card?.status ?? card?.done ?? false;
            const isDone = rawDone === true || rawDone === 'true' || rawDone === 1 || rawDone === '1';

            return (
              <TouchableOpacity onPress={() => router.push({ pathname: '/content_details', params: { ...card } })}>
                <View style={[
                  styles.cardBox,
                  {
                    borderStyle: 'solid',
                    borderWidth: 2,
                    borderColor: isDone ? '#48cae4' : theme.cardBorder,
                    borderLeftWidth: 6,
                    paddingLeft: 12,
                  },
                ]}>
                  <Ionicons name={iconName} size={28} color={theme.text} style={{ marginRight: 12 }} />
                  <View style={styles.textContainer}>
                    <ThemedText style={[styles.cardTitle, { color: theme.text }]}>{card.title}</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      <FlatList
        data={LESSONS}
        renderItem={renderUpperPart}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
};

export default LessonPage;

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 0, paddingBottom: 5, paddingHorizontal: 16 },
  listContainer: { paddingBottom: 20, paddingTop: 20 },
  cardContainer: { height: height * 0.20, padding: 15, borderRadius: 15, backgroundColor: '#48cae4', justifyContent: 'center', marginBottom: 15, shadowColor: '#48cae4', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.7, shadowRadius: 15, elevation: 15 },
  cardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  numberBox: { width: 70, height: 70, borderRadius: 15, backgroundColor: '#0d669eff', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginHorizontal: 10 },
  lessonNumber: { fontSize: 40, fontWeight: 'bold', color: '#ffffffff' },
  lessonTitle: { fontSize: 30, fontWeight: '600', flexShrink: 1, color: '#fff', marginLeft: 10 },
  quarterText: { fontSize: 16, color: '#fff', marginTop: 4, marginLeft: 10 },
  aboutText: { fontSize: 20, fontWeight: '600', marginBottom: 5 },
  lessonDescription: { fontSize: 16, color: '#888a94' },

  // Styles from SubjectPage's renderLessonCard
  cardBox: { flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    marginBottom: 5,
    marginTop: 10, },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
});
