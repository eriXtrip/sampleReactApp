import { StyleSheet, View, Image, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { ASSETS_ICONS } from '../../data/assets_icon';

const SubjectList = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const router = useRouter();
  const db = useSQLiteContext();

  const [expandedSections, setExpandedSections] = useState({});
  const [combinedData, setCombinedData] = useState([]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // 📥 Fetch from SQLite
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get sections
        const sections = await db.getAllAsync(`SELECT * FROM sections`);

        // 2. For each section, get subjects
        const sectionData = await Promise.all(
          sections.map(async (sec) => {
            const subjects = await db.getAllAsync(
              `SELECT s.subject_id, s.subject_name, s.description, s.grade_level
               FROM subjects_in_section sis
               JOIN subjects s ON sis.subject_id = s.subject_id
               WHERE sis.section_belong = ?`,
              [sec.section_id]
            );

            return {
              id: sec.section_id,
              name: sec.section_name,
              adviser: sec.teacher_name,
              school_year: sec.school_year,
              subjects: subjects.map((sub) => ({
                id: sub.subject_id,
                title: sub.subject_name,
                grade: sub.grade_level ? `Grade ${sub.grade_level}` : 'No Grade',
                icon: ASSETS_ICONS[sub.subject_name]?.icon ?? require('../../assets/icons/english_.png'),
                downloaded: false,
                type: 'subject',
              })),
              type: 'section',
            };
          })
        );

        // 3. Get standalone subjects (not in subjects_in_section)
        const standalone = await db.getAllAsync(`
          SELECT * FROM subjects 
          WHERE subject_id NOT IN (SELECT subject_id FROM subjects_in_section)
        `);

        const standaloneData = standalone.map((sub) => ({
          id: sub.subject_id,
          title: sub.subject_name,
          grade: sub.grade_level ? `Grade ${sub.grade_level}` : 'No Grade',
          icon: ASSETS_ICONS[sub.subject_name]?.icon ?? require('../../assets/icons/english_.png'),
          downloaded: false,
          type: 'subject',
        }));

          console.log('sectionData:', sectionData);
          console.log('standaloneData:', standaloneData);

        // 4. Combine everything
        setCombinedData([...sectionData, ...standaloneData]);
      } catch (err) {
        console.error("❌ Error fetching sections/subjects:", err);
      }
    };

    fetchData();

  }, [db]);

  

  const renderSubject = (item) =>{ 
    //console.log("Rendering subject:", item);
      return(
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/subject_page',
              params: { 
                subject_id: item.id,   // ✅ pass subject_id
                name: item.title, 
                grade: item.grade
              },
            })
          }
        >
          <View style={[styles.subjectBox, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
            <Image source={item.icon} style={styles.icon} />
            <View style={styles.textContainer}>
              <ThemedText style={[styles.subjectTitle, { color: theme.text }]}>{item.title}</ThemedText>
              <ThemedText style={[styles.subjectGrade, { color: theme.text }]}>{item.grade}</ThemedText>
            </View>
            {/* <Ionicons
              name={item.downloaded ? 'checkmark-circle-outline' : 'arrow-down-circle-outline'}
              size={40}
              color={item.downloaded ? 'green' : theme.text}
            /> */}
          </View>
        </TouchableOpacity>
      );
  };
  const renderSection = (item) => {
    //console.log("Rendering section:", item);
    return (
      <View>
        <TouchableOpacity
          onPress={() => 
            router.push({ 
              pathname: '/section_page', 
              params: { 
                section_id: item.id,  
                name: item.name, 
                createdBy: item.adviser,
                schoolYear: item.school_year
              },
            })
          }
          style={[styles.subjectBox, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}
        >
          <Image source={require('../../assets/icons/section_.png')} style={styles.icon} />
          <View style={styles.textContainer}>
            <ThemedText style={[styles.subjectTitle, { color: theme.text }]}>{item.name}</ThemedText>
            <ThemedText style={[styles.subjectGrade, { color: theme.text }]}>{`Adviser: ${item.adviser}`}</ThemedText>
          </View>
          <Ionicons
            name="chevron-down-circle-outline"
            size={40}
            color={theme.text}
            onPress={() => toggleSection(item.id)}
          />
        </TouchableOpacity>

        {expandedSections[item.id] && (
          <View style={{ marginLeft: 20, marginTop: 10 }}>
            {item.subjects.map(sub => (
              <View key={`sub-${sub.id}`}>
                {renderSubject(sub)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item }) => {
    return item.type === 'section' ? renderSection(item) : renderSubject(item);
  };
  

  return (
    <ThemedView style={styles.container} safe={true}>
      {combinedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={80} color={theme.tint} />
          <ThemedText style={[styles.emptyText, { color: theme.iconColor }]}>
            No section enrolled yet
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={combinedData}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
};

export default SubjectList;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  listContainer: { paddingBottom: 20 },
  subjectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
  },
  icon: { width: 50, height: 50, marginRight: 16, resizeMode: 'contain' },
  textContainer: { flex: 1 },
  subjectTitle: { fontSize: 25, fontWeight: 'bold' },
  subjectGrade: { fontSize: 14, opacity: 0.6 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    marginTop: 12,
    textAlign: 'center',
  },

});
