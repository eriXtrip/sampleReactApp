// notificationListener.js
import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { triggerLocalNotification } from './notificationUtils';

export function useNotificationListener() {
  const db = useSQLiteContext();

  useEffect(() => {
    if (!db) return;

    const interval = setInterval(async () => {
      try {
        // Fetch all unread notifications as an array
        const notifications = await db.getAllAsync(
          `SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at`
        );

        // Iterate over the array
        for (const n of notifications) {
          await triggerLocalNotification(n.title, n.message);

          // Mark as read in SQLite (use runAsync for expo-sqlite)
          await db.runAsync(
            `UPDATE notifications SET is_read = 1 WHERE notification_id = ?`,
            [n.notification_id]
          );
        }
      } catch (err) {
        console.error('Notification listener error:', err);
      }
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [db]);
}
