// notificationListener.js
import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { triggerLocalNotification } from './notificationUtils';
import { waitForDbReady } from '../local-database/services/dbReady';
import { dbMutex } from './databaseMutex';

export function useNotificationListener() {
  const db = useSQLiteContext();

  useEffect(() => {
    if (!db) return;

    let interval;

    waitForDbReady(10000)
      .then(() => {
        console.log('✅ DB ready → starting notification listener');

        interval = setInterval(async () => {
          try {
            await dbMutex.acquire('notifications');
            
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
            
            dbMutex.release('notifications');
          } catch (err) {
            console.error('Notification listener error:', err);
            dbMutex.release('notifications');
          }
        }, 5000);
      })
      .catch((err) => {
        console.error('Notification listener aborted → DB not ready:', err);
      });

    return () => clearInterval(interval);
  }, [db]);
}