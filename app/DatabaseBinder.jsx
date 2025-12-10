// components/DatabaseBinder.jsx or wherever it is
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { initializeDatabase } from '../local-database/services/database';
import UserService from '../local-database/services/userService';

export default function DatabaseBinder() {
  const db = useSQLiteContext();

  useEffect(() => {
    if (db) {
      initializeDatabase(db);
      UserService.setDatabase(db);
      console.log('DatabaseBinder: DB initialized and UserService set');
    }
  }, [db]);

  return null;
}