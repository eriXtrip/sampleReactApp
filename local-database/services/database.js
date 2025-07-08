// SAMPLEREACTAPP/local-database/services/database.js
import * as SQLite from 'expo-sqlite';

let dbInstance = null;

const initializeSQLite = () => {
  try {
    // Open or create the database
    const db = SQLite.openDatabase('mquest.db');
    console.log('Database opened successfully');
    return db;
  } catch (error) {
    console.error('Failed to open database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!dbInstance) {
    try {
      dbInstance = initializeSQLite();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Fallback to in-memory database for development
      dbInstance = {
        transaction: (cb) => cb({
          executeSql: (sql, params, success, error) => {
            console.warn('Using mock database - no persistence');
            success?.();
          }
        })
      };
    }
  }
  return dbInstance;
};

// Initialize database tables
export const initDatabase = async () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS roles (
          role_id INTEGER PRIMARY KEY,
          role_name TEXT NOT NULL UNIQUE,
          description TEXT
        )`,
        [],
        () => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS users (
              user_id INTEGER PRIMARY KEY AUTOINCREMENT,
              server_id INTEGER UNIQUE,
              role_id INTEGER NOT NULL,
              email TEXT NOT NULL UNIQUE,
              first_name TEXT NOT NULL,
              middle_name TEXT,
              last_name TEXT NOT NULL,
              suffix TEXT,
              gender TEXT,
              birth_date TEXT,
              lrn TEXT,
              teacher_id TEXT,
              token TEXT,
              last_sync TEXT,
              FOREIGN KEY (role_id) REFERENCES roles(role_id)
            )`,
            [],
            () => {
              tx.executeSql(
                `INSERT OR IGNORE INTO roles (role_id, role_name, description) VALUES 
                (1, 'admin', 'Administrator'),
                (2, 'teacher', 'Teaching'),
                (3, 'pupil', 'Student')`,
                [],
                () => resolve(),
                (_, error) => reject(error)
              );
            },
            (_, error) => reject(error)
          );
        },
        (_, error) => reject(error)
      );
    });
  });
};