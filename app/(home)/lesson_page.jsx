import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { LESSON_TYPE_ICON_MAP } from '../../data/lessonData';

const LessonPage = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const router = useRouter();

  const { id = '', title = '', Quarter = '', description = '' } = useLocalSearchParams();
  //console.log('Lesson Params:', { id, title, Quarter, description });

  const db = useSQLiteContext();

  const [expanded, setExpanded] = useState(false);
  const [lessonContents, setLessonContents] = useState([]);

  useEffect(() => {
    const fetchLessonContents = async () => {
      try {
        if (!id) return;

        const contents = await db.getAllAsync(
          `SELECT content_id, title, content_type, done, description
           FROM subject_contents
           WHERE lesson_belong = ?`,
          [id]
        );

        //console.log('Fetched lesson contents:', contents);
        setLessonContents(contents);
      } catch (err) {
        console.error("❌ Error fetching lesson contents:", err);
      }
    };

    fetchLessonContents();
  }, [db, id]);

  const toggleExpand = () => setExpanded(prev => !prev);

  const renderLessonContent = ({ item }) => {
    const iconName = LESSON_TYPE_ICON_MAP[item.content_type] || 'book-outline';
    const isDone = item.done === 1 || item.done === true || item.done === 'true';

    //console.log('Rendering content item:', item);

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/content_details', params: { id: item.content_id, title: item.title, shortdescription: item.description, type: item.content_type, status: isDone} })}
      >
        <View style={[styles.cardBox, { borderColor: isDone ? '#48cae4' : theme.cardBorder }]}>
          <Ionicons name={iconName} size={28} color={theme.text} style={{ marginRight: 12 }} />
          <View style={styles.textContainer}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>{item.title}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      <FlatList
        data={lessonContents}
        keyExtractor={(item) => String(item.content_id)}
        renderItem={renderLessonContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Parent Card */}
            <View style={styles.cardContainer}>
              <View style={styles.cardContent}>
                <View style={styles.numberBox}>
                  <ThemedText style={styles.lessonNumber}>{id}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.lessonTitle}>{title}</ThemedText>
                  <ThemedText style={styles.quarterText}>Quarter: {Quarter}</ThemedText>
                </View>
              </View>
            </View>

            {/* Description + Chevron */}
            <View style={{ marginTop: 10, paddingHorizontal: 10 }}>
              <ThemedText style={[styles.aboutText, { color: theme.text }]}>About this Lesson:</ThemedText>
              <ThemedText style={styles.lessonDescription} numberOfLines={expanded ? undefined : 3}>
                {description}
              </ThemedText>
              <TouchableOpacity onPress={toggleExpand} style={{ alignSelf: 'center', marginTop: 8 }}>
                <Ionicons name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
          </>
        }
      />
    </ThemedView>
  );
};

export default LessonPage;

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, paddingBottom: 5, paddingHorizontal: 16 },
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
    marginTop: 10,
    borderColor: '#ccc',
    borderWidth: 2,
    borderLeftWidth: 6,
    borderRadius: 10,
   },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
});
