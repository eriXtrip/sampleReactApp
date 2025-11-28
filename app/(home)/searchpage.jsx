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

  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchPublicSubjects(user.server_id);
      fetchAvailableSections(user.server_id); // ✅ pass user ID
    }
  }, [user?.server_id, fetchPublicSubjects, fetchAvailableSections, user]);

  // Filter sections based on search query
  const filteredSections = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return sections;
    }

    return sections.filter(section => {
      const sectionNameMatch = section.section_name.toLowerCase().includes(query);
      const teacherMatch = section.teacher.toLowerCase().includes(query);
      const schoolYearMatch = section.school_year.toLowerCase().includes(query);

      return sectionNameMatch || teacherMatch || schoolYearMatch;
    });
  }, [searchQuery, sections]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const renderItem = ({ item }) => {
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
            pathname: '/self_enroll_page',
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
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <ThemedSearch
          placeholder="Search sections..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.search, { flex: 1 }]}
          inputStyle={styles.searchInput}
          autoFocus={true}
        />
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
                Loading sections...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
            </View>
          ) : searchQuery.trim().length === 0 && filteredSections.length === 0 ? (
            <View style={[styles.helperContainer, { alignItems: 'center' }]}>
              <ThemedText style={[styles.text, { color: theme.text, textAlign: 'center' }]}>
                No sections available for enrollment.
              </ThemedText>
            </View>
          ) : filteredSections.length === 0 ? (
            <View style={styles.centered}>
              <ThemedText style={{ color: theme.text }}>
                No matching sections found.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredSections}
              renderItem={renderItem}
              keyExtractor={item => String(item.section_id)}
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