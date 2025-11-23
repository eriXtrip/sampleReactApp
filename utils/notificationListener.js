// notificationListener.js
import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { triggerLocalNotification } from './notificationUtils';
import { waitForDbReady } from '../local-database/services/dbReady';

export function useNotificationListener() {
  const db = useSQLiteContext();

  useEffect(() => {
    if (!db) return;

    let interval;

    // Wait for DB once at startup
    waitForDbReady(10000) // 10s timeout
      .then(() => {
        console.log('✅ DB ready → starting notification listener');

        interval = setInterval(async () => {
          try {
            // Fetch all unread notifications
            const notifications = await db.getAllAsync(
              `SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at`
            );

            for (const n of notifications) {
              await triggerLocalNotification(n.title, n.message);

              await db.runAsync(
                `UPDATE notifications SET is_read = 1 WHERE notification_id = ?`,
                [n.notification_id]
              );
            }
          } catch (err) {
            console.error('Notification listener error:', err);
          }
        }, 5000);
      })
      .catch((err) => {
        console.error('Notification listener aborted → DB not ready:', err);
      });

    return () => clearInterval(interval);
  }, [db]);
}
