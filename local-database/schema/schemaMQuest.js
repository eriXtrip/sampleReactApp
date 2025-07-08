// File: local-database/services/database.js

export const createTables = (db) => {
  db.transaction(tx => {
    // 1. Roles Table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS roles (
        role_id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT NOT NULL UNIQUE,
        description TEXT
      )`,
      [],
      () => console.log('Roles table created'),
      (_, error) => console.error('Error creating roles table', error)
    );

    // 2. Users Table (simplified for mobile)
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,  // Reference to server-side user_id
        role_id INTEGER NOT NULL,
        password_hash TEXT, // Only needed if implementing offline login
        full_name TEXT NOT NULL,
        gender TEXT CHECK(gender IN ('Male', 'Female', 'Prefer not to say')),
        birth_date TEXT,    // SQLite doesn't have DATE type
        lrn TEXT,
        email TEXT NOT NULL UNIQUE,
        teacher_id TEXT,
        token TEXT,        // JWT token for API calls
        last_sync TEXT,     // ISO8601 string (YYYY-MM-DD HH:MM:SS.SSS)
        is_offline BOOLEAN DEFAULT 0,
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
      )`,
      [],
      () => {
        // Insert default roles after table creation
        tx.executeSql(
          `INSERT OR IGNORE INTO roles (role_id, role_name, description) VALUES 
          (1, 'admin', 'Administrator'),
          (2, 'teacher', 'Teaching'),
          (3, 'pupil', 'Student')`
        );
      }
    );
  });
};