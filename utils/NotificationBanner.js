// utils/NotificationBanner.js
import React from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { useNotifications } from './NotificationContext';

export const NotificationBanner = () => {
  const { notifications } = useNotifications();
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((n) => (
        <View key={n.id} style={styles.banner}>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.message}>{n.message}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  banner: {
    backgroundColor: '#1486DE',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: { color: '#fff', fontWeight: 'bold' },
  message: { color: '#fff' },
});
