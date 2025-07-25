// local-database/services/database.js
export async function initializeDatabase(db) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS roles (
            role_id INTEGER PRIMARY KEY,
            role_name TEXT NOT NULL UNIQUE,
            description TEXT
        );
        
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
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
        );

        CREATE TABLE IF NOT EXISTS sessions (
            session_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
        
        INSERT OR IGNORE INTO roles (role_id, role_name, description) VALUES 
            (1, 'admin', 'Administrator'),
            (2, 'teacher', 'Teaching'),
            (3, 'pupil', 'Student');
    `);
}