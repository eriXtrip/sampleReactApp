import React from 'react';
import { View, Text, Image, StyleSheet, FlatList } from 'react-native';

// Change function declaration to use const and arrow function for cleaner export
const SimpleStarsCard = ({ points = 0, starsPerRow = 5 }) => {
  const totalStars = points;
  
  // Create array of stars
  const starArray = Array.from({ length: totalStars }, (_, i) => ({
    id: i,
    isFilled: true
  }));

  return (
    <View style={styles.container}>
      
      <View style={[styles.starsGrid, { minHeight: Math.ceil(points / starsPerRow) * 55 }]}>
        {totalStars === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={require('../assets/icons/star.png')}
              style={[styles.star, styles.starEmpty]}
            />
            <Text style={styles.emptyText}>No stars yet</Text>
          </View>
        ) : (
          <FlatList
            data={starArray}
            numColumns={starsPerRow}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Image
                source={require('../assets/icons/star.png')}
                style={[styles.star, styles.starFilled]}
              />
            )}
            contentContainerStyle={styles.grid}
            scrollEnabled={false}
          />
        )}
      </View>
      
      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>{points} stars</Text>
      </View>
    </View>
  );
};

// Export as default
export default SimpleStarsCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    paddingVertical: 10,
    margin: 16,
    marginVertical: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3a3a3a',
    marginBottom: 16,
  },
  starsGrid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    width: 37,
    height: 37,
    margin: 8,
  },
  starFilled: {
    tintColor: '#FFD700',
  },
  starEmpty: {
    tintColor: '#838383ff',
    opacity: 0.3,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  pointsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 10,
  },
  pointsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});