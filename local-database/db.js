// local-database/db.js
import * as SQLite from 'expo-sqlite';
import { initializeDatabase } from './services/database';

let dbInstance = null;

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('mquest.db');
    await initializeDatabase(dbInstance);
  }
  return dbInstance;
}
