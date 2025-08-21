import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';

const DownloadPage = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  // try to use theme from ProfileContext if available at runtime; fallback to light
  let theme = Colors.light;
  try {
    // dynamic require to avoid runtime crash if context not present in this file
    const { useContext } = require('react');
    const { ProfileContext } = require('../../contexts/ProfileContext');
    const { themeColors } = useContext(ProfileContext) || {};
    theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors] || Colors.light;
  } catch (e) {
    theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'] || Colors.light;
  }

  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState([]);

  // Replace this loader with your real download-queue source (context, async storage, api)
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      // simulate async load
      await new Promise((r) => setTimeout(r, 400));
      // example structure: [{ id, title, status, progress }]
      // setDownloads([]); // <- empty queue example
      setDownloads([
        // sample items (remove or replace in real app)
        { id: '1', title: 'General', status: 'paused', progress: 48 },
        { id: '2', title: 'Topic 1', status: 'downloading', progress: 12 },
        { id: '3', title: 'Lesson 2', status: 'queued', progress: 0 },
        { id: '4', title: 'Pretest', status: 'completed', progress: 100 },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load download queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const removeItem = (id) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };


  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme.navBackground, borderColor: theme.cardBorder }]}
    >
      <View style={styles.itemLeft}>
        <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.itemSub}>Status: {item.status}</ThemedText>

        {/* Progress bar container */}
        <View style={[styles.progressContainer, { backgroundColor: theme.iconBackground }]}>
          <View style={[styles.progressBar, { width: `${item.progress ?? 0}%`, backgroundColor: theme.iconColorFocused }]} />
        </View>
      </View>

      <View style={styles.itemRight}>
        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={20} color="#d00" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );


  return (
    <ThemedView style={styles.container} safe={true}>

      <Spacer height={12} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      ) : downloads.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="sad-outline" size={64} color="#999" />
          <Spacer height={12} />
          <ThemedText style={styles.emptyTitle}>No Downloads</ThemedText>
          <Spacer height={6} />
          <ThemedText style={styles.emptySubtitle}>There are no items in your download queue.</ThemedText>
          <Spacer height={20} />
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <Spacer height={8} />}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  iconButton: { 
    padding: 1,
    size: 24,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600',
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20,
  },
  emptyTitle: { fontSize: 18, 
    fontWeight: '700', 
    marginTop: 6 ,
  },
  emptySubtitle: { fontSize: 14, 
    color: '#666', 
    textAlign: 'center', 
    marginHorizontal: 24,
  },

  list: { padding: 12, 
    paddingBottom: 40,
 },
  item: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemLeft: { 
    flex: 1, 
    paddingRight: 8 
 },
  itemTitle: { 
    fontSize: 15, 
    fontWeight: '600',
  },
  itemSub: { 
    fontSize: 13, 
    color: '#666', 
    marginTop: 4,
 },
  itemRight: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  iconBtn: { 
    padding: 6, 
    marginRight: 0,
 },
  progressContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});

export default DownloadPage;