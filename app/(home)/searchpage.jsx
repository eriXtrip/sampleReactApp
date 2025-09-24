// SAMPLEREACTAPP/app/(dashboard)/search.jsx

import React, { useContext, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { ProfileContext } from '../../contexts/ProfileContext';
import { SearchContext } from '../../contexts/SearchContext';
import { UserContext } from '../../contexts/UserContext';
import { Colors } from '../../constants/Colors';
import ThemedSearch from '../../components/ThemedSearch';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import SearchResultCard from '../../components/SearchResultCard';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SearchPage = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const { user } = useContext(UserContext); // ✅ get logged-in user
  const { 
    subjects, 
    sections, 
    loading, 
    error, 
    fetchPublicSubjects, 
    fetchAvailableSections 
  } = useContext(SearchContext);
  
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' or 'sections'

  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchPublicSubjects(user.server_id);
      fetchAvailableSections(user.server_id); // ✅ pass user ID
    }
  }, [user?.server_id, fetchPublicSubjects, fetchAvailableSections, user]);

  // Combine search term matching for both subjects and sections
  const filteredData = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return activeTab === 'subjects' ? subjects : sections;
    }

    if (activeTab === 'subjects') {
      return subjects.filter(subject => {
        const subjectNameMatch = subject.subject_name.toLowerCase().includes(query);
        const teacherName = `${subject.created_by_first || ''} ${subject.created_by_last || ''}`.toLowerCase();
        const teacherMatch = teacherName.includes(query);

        return subjectNameMatch || teacherMatch;
      });
    } else {
      return sections.filter(section => {
        const sectionNameMatch = section.section_name.toLowerCase().includes(query);
        const teacherMatch = section.teacher.toLowerCase().includes(query);

        return sectionNameMatch || teacherMatch;
      });
    }
  }, [activeTab, searchQuery, subjects, sections]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const renderItem = ({ item }) => {
    if (activeTab === 'subjects') {
      return (
        <SearchResultCard
          key={item.subject_id}
          type="subject"
          name={item.subject_name}
          createdBy={item.created_by_first ? `${item.created_by_first} ${item.created_by_last}` : 'Admin'}
          schoolYear={item.created_at ? item.created_at.split('-')[0] : 'N/A'}
          requiresEnrollmentKey={false}
          onPress={() =>
            router.push({
              pathname: '/subject_detail',
              params: {
                subjectId: item.subject_id,
                name: item.subject_name,
                description: item.description,
                schoolYear: item.created_at ? item.created_at.split('-')[0] : 'N/A',
                createdBy: item.created_by_first ? `${item.created_by_first} ${item.created_by_last}` : 'Admin',
              },
            })
          }
        />
      );
    } else {
      return (
        <SearchResultCard
          key={item.section_id}
          type="section"
          name={item.section_name}
          createdBy={item.teacher}
          schoolYear={item.school_year}
          requiresEnrollmentKey={false}
          onPress={() =>
            router.push({
              pathname: '/subject_detail',
              params: {
                type: 'section',
                sectionId: item.section_id,
                name: item.section_name,
                createdBy: item.teacher,
                schoolYear: item.school_year,
                enrollment_key: item.enrollment_key,
              },
            })
          }
        />
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <ThemedSearch
          placeholder="Search subjects or sections..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.search, { flex: 1 }]}
          inputStyle={styles.searchInput}
          autoFocus={true}
        />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'subjects' && {backgroundColor: '#48cae4',}]}
          onPress={() => setActiveTab('subjects')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'subjects' && styles.activeTabText]}>
            Subjects
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sections' && {backgroundColor: '#9d4edd'}]}
          onPress={() => setActiveTab('sections')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'sections' && styles.activeTabText]}>
            Sections
          </ThemedText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 0, marginTop: 8, flex: 1 }}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.title} />
              <ThemedText style={{ marginTop: 10, color: theme.text }}>
                Loading {activeTab}...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
            </View>
          ) : searchQuery.trim().length === 0 && filteredData.length === 0 ? (
            <View style={[styles.helperContainer, { alignItems: 'center' }]}>
              <ThemedText style={[styles.text, { color: theme.text, textAlign: 'center' }]}>
                {activeTab === 'subjects'
                  ? "No public subjects available."
                  : "No sections available for enrollment."}
              </ThemedText>
            </View>
          ) : filteredData.length === 0 ? (
            <View style={styles.centered}>
              <ThemedText style={{ color: theme.text }}>
                No matching {activeTab} found.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={item => 
                activeTab === 'subjects' 
                  ? String(item.subject_id) 
                  : String(item.section_id)
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    height: 60,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
    borderRadius: 999,
  },
  searchInput: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#d5d7d82a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#ffffffff',
  },
  text: {
    fontSize: 18,
  },
  helperContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchPage;