import React, { useContext, useState, useLayoutEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { ProfileContext } from '../../contexts/ProfileContext';
import { Colors } from '../../constants/Colors';
import ThemedSearch from '../../components/ThemedSearch';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import SearchResultCard from '../../components/SearchResultCard';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SearchPage = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <ThemedSearch
          placeholder="Lessons, Sections, Subjects"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.search, { flex: 1 }]}
          inputStyle={styles.searchInput}
          autoFocus={true}
        />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.helperContainer}>
        {searchQuery.trim().length === 0 ? (
        <ThemedText style={[styles.text, { color: theme.text, textAlign: 'center' }]}>
        {"Enter a topic or keywords\nTip: The more specific, the better!"}
        </ThemedText>
        ) : (
        <View>
        <SearchResultCard type="subject" name="Science G4" createdBy="Ms. Reyes" schoolYear="2024-2025" />
        <SearchResultCard type="section" name="Section A - Grade 4" createdBy="Mr. Gomez" schoolYear="2024-2025" />
        </View>
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
    paddingTop: 20, // Adjust for status bar height
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
});

export default SearchPage;