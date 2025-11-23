// DatabaseBinder.jsx
import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import UserService from '../local-database/services/userService';
import { initializeDatabase } from '../local-database/services/database';
import { markDbInitialized } from '../local-database/services/dbReady';

export default function DatabaseBinder() {
  const db = useSQLiteContext();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!db || !mounted) return;
      console.log('DatabaseBinder: db.path =', db.databasePath);
      try {
        await initializeDatabase(db);       // creates tables if missing
        UserService.setDatabase(db);       // single injection point
        markDbInitialized(); // single injection point
        console.log('DatabaseBinder: DB initialized and UserService set');
      } catch (e) {
        console.error('DatabaseBinder init error', e);
      }
    })();
    return () => { mounted = false; };
  }, [db]);

  return null;
}
