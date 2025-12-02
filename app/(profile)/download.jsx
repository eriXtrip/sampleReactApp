import React, { useContext } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import { useDownloadQueue  } from '../../contexts/DownloadContext';
import { triggerLocalNotification } from '../../utils/notificationUtils';

const DownloadPage = () => {
  const colorScheme = useColorScheme();
  const { queue: downloads, removeDownload, updateDownload } = useDownloadQueue();

  const theme = Colors[colorScheme === 'light' ? 'light' : 'dark'];

  const removeItem = (id) => {
    removeDownload(id);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#4caf50';
      case 'downloading': return '#2196f3';
      case 'paused': return '#ff9800';
      default: return '#999';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: "#fff", borderColor: theme.cardBorder }]}
    >
      <View style={styles.itemLeft}>
        <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.itemSub}>Status: {item.status}</ThemedText>

        <View style={[styles.progressContainer, { backgroundColor: theme.iconBackground }]}>
          <View style={[styles.progressBar, { width: `${item.progress ?? 0}%`, backgroundColor: getStatusColor(item.status) }]} />
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

      {downloads === null ? (
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
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginHorizontal: 24 },
  list: { padding: 12, paddingBottom: 40 },
  item: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  itemLeft: { flex: 1, paddingRight: 8 },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  itemSub: { fontSize: 13, color: '#666', marginTop: 4 },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, marginRight: 0 },
  progressContainer: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  progressBar: { height: '100%', borderRadius: 4 },
});

export default DownloadPage;
