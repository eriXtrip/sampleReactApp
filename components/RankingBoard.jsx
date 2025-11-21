import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRanking } from '../contexts/RankingContext'; // make sure to import your context
import { Ionicons } from '@expo/vector-icons'; 

const medalColors = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export default function RankingBoard() {
  const db = useSQLiteContext();
  const { ranking, error } = useRanking(); // get ranking & error from context
  const [currentUserId, setCurrentUserId] = useState(null);

  // Log ranking whenever it changes
  useEffect(() => {
    console.log('Received ranking:', ranking, 'Error:', error);
  }, [ranking, error]);

  // Load current user from SQLite
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const result = await db.getAllAsync(`
          SELECT server_id 
          FROM users 
          LIMIT 1
        `);

        if (result.length > 0) {
          setCurrentUserId(result[0].server_id);
        }
      } catch (err) {
        console.error('Failed to load current user:', err);
      }
    };

    loadCurrentUser();
  }, [db]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#989898ff" style={{ marginBottom: 10 }} />
        <Text style={styles.errorTitle}>RANKING NOT AVAILABLE</Text>
        <Text style={styles.errorSubtitle}>Please connect to the internet</Text>
      </View>
    );
  }

  const top3 = ranking.slice(0, 3);
  const others = ranking.slice(3);

  // Filter OTHER RANKS to show 3 rows around current user
  const currentIndex = others.findIndex(item => item.pupil_id === currentUserId);
  let visibleOthers = [];

  if (currentIndex !== -1) {
    if (currentIndex > 0) visibleOthers.push(others[currentIndex - 1]);
    visibleOthers.push(others[currentIndex]);
    if (currentIndex < others.length - 1) visibleOthers.push(others[currentIndex + 1]);
  }

  return (
    <View style={styles.container}>
      {/* TOP 3 PODIUM */}
      <View style={styles.topContainer}>
        <Text style={styles.title}>Ranking</Text>

        {top3.map((item) => {
          const podiumStyle =
            item.rank_position === 1
              ? styles.rank1
              : item.rank_position === 2
              ? styles.rank2
              : styles.rank3;

          const isCurrentUser = item.pupil_id === currentUserId;

          return (
            <View
              key={item.rank_position}
              style={[
                styles.topCard,
                podiumStyle,
                isCurrentUser && {
                  borderWidth: 2,
                  borderColor: medalColors[item.rank_position],
                  shadowColor: medalColors[item.rank_position],
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                  elevation: 5,
                },
              ]}
            >
              <Text style={[styles.topNumber, { color: medalColors[item.rank_position] }]}>
                {item.rank_position}
              </Text>
              <Image source={{ uri: item.avatar_thumbnail }} style={styles.topAvatar} />
              <Text style={styles.topName}>{item.last_name}</Text>
              <Text style={[styles.topRank, { color: medalColors[item.rank_position] }]}>
                Rank {item.rank_position}
              </Text>
            </View>
          );
        })}
      </View>

      {/* OTHER RANKS */}
      <View style={styles.othersContainer}>
        {visibleOthers.map((item) => {
          const isCurrentUser = item.pupil_id === currentUserId;

          return (
            <View
              key={item.rank_position}
              style={[
                styles.otherRow,
                isCurrentUser && {
                  borderWidth: 2,
                  borderColor: '#007AFF',
                  shadowColor: '#007AFF',
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                },
              ]}
            >
              <View
                style={[
                  styles.otherRankBadge,
                  { backgroundColor: medalColors[item.rank_position] || '#bbbbbb' },
                ]}
              >
                <Text style={styles.otherRankText}>{item.rank_position}</Text>
              </View>
              <Image source={{ uri: item.avatar_thumbnail }} style={styles.otherAvatar} />
              <Text style={styles.otherName}>{item.last_name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, padding: 16 },
  topContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 16,
    elevation: 3,
    height: 300,
    position: 'relative',
  },
  title: {
    position: 'absolute',
    top: 10,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    color: '#3a3a3aff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
    marginBottom: 10,
  },
  topCard: {
    width: 95,
    height: 160,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    position: 'absolute',
  },
  topNumber: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  rank1: { top: 50, left: '55%', marginLeft: -50, borderRadius: 16 },
  rank2: { top: 90, left: '5%', borderRadius: 16 },
  rank3: { top: 125, right: '4%', borderRadius: 16 },
  topAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 4 },
  topName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  topRank: { fontSize: 12, fontWeight: '700' },
  othersContainer: { marginTop: 10 },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 6,
  },
  otherRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  otherRankText: { color: '#fff', fontWeight: '700' },
  otherAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  otherName: { fontSize: 14, fontWeight: '600' },

  // Error / Offline styles
  errorContainer: {
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
  },
  errorTitle: { fontSize: 18, fontWeight: '900', marginBottom: 6, color: '#4e4e4eff' },
  errorSubtitle: { fontSize: 14, fontWeight: '600', color: '#333' },
});
