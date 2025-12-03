import { StyleSheet, FlatList, View  } from 'react-native';
import { useColorScheme } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import Spacer from '../../components/Spacer';
import CardNotif from '../../components/card_notif';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';
import { NOTIF_MAP } from '../../data/notif_map';

const Notification = () => {
  const db = useSQLiteContext(); // ✅ access to db
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme =
    Colors[
      themeColors === 'system'
        ? colorScheme === 'dark'
          ? 'dark'
          : 'light'
        : themeColors
    ];

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const result = await db.getAllAsync(
          `SELECT * FROM notifications ORDER BY created_at DESC`
        );
        //console.log("📩 Notifications from DB:", result);
        setNotifications(result);
      } catch (error) {
        console.error("❌ Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [db]);

  const renderItem = ({ item }) => {
    const map = NOTIF_MAP[item.type] || {
      icon: 'notifications-outline',
      color: '#6c757d',
    };

    return (
      <CardNotif
        color={map.color}
        icon={map.icon}
        title={item.title}
        message={item.message}
        theme={theme}
      />
    );
  };

  return (
    <ThemedView style={styles.container} safe={true}>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={80} color={theme.tint} />
          <ThemedText style={[styles.emptyText, { color: theme.iconColor }]}>
            No notification yet
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.notification_id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Spacer height={90} />
    </ThemedView>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
    paddingTop: 0,
  },
  list: {
    paddingVertical: 20,
  },
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
