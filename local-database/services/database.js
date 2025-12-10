// local-database/services/database.js
import { markDbInitialized } from './dbReady.js';
import { safeExec, enableWAL } from '../../utils/dbHelpers.js';

export async function initializeDatabase(db) {
  if (!db) {
    throw new Error("Database instance is required");
  }

  try {
    console.log("🚀 Starting SQLite database initialization...");
    
    // Enable WAL BEFORE creating tables
    await enableWAL(db);
    
    console.log("📋 Creating roles table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS roles (
        role_id INTEGER PRIMARY KEY,
        role_name TEXT NOT NULL UNIQUE,
        description TEXT
      );
    `);
    
    console.log("👥 Creating users table...");
    await safeExec(db, `
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
        avatar_id INTEGER,
        avatar TEXT,
        avatar_url TEXT,
        avatar_file_name TEXT,
        avatar_thumbnail TEXT,
        pupil_points INTEGER,
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
      );
    `);
    
    console.log("�� Creating sessions table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    console.log("📍 Creating sections table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS sections (
        section_id INTEGER PRIMARY KEY,
        server_section_id INTEGER UNIQUE,
        teacher_id INTEGER,
        teacher_name TEXT NOT NULL,
        section_name TEXT NOT NULL,
        school_name TEXT,
        school_year TEXT NOT NULL
      );
    `);
    
    console.log("📚 Creating subjects table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS subjects (
        subject_id INTEGER PRIMARY KEY,
        server_subject_id INTEGER UNIQUE,
        subject_name TEXT NOT NULL,
        grade_level INTEGER NOT NULL,
        description TEXT,
        is_public BOOLEAN
      );
    `);
    
    console.log("🔗 Creating subjects_in_section table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS subjects_in_section (
        section_belong INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        assigned_at TEXT,
        PRIMARY KEY (section_belong, subject_id),
        FOREIGN KEY (section_belong) REFERENCES sections(section_id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
      );
    `);
    
    console.log("📖 Creating lessons table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS lessons (
        lesson_id INTEGER PRIMARY KEY,
        server_lesson_id INTEGER UNIQUE,
        lesson_number INTEGER NOT NULL,
        lesson_title TEXT NOT NULL,
        description TEXT,
        subject_belong INTEGER NOT NULL,
        quarter INTEGER NOT NULL CHECK (quarter IN (1,2,3,4)),
        status BOOLEAN DEFAULT FALSE,
        progress REAL DEFAULT 0,
        last_accessed TEXT,
        completed_at TEXT,
        is_synced BOOLEAN DEFAULT FALSE,
        synced_at TEXT,
        is_downloaded BOOLEAN DEFAULT FALSE,
        no_of_contents INTEGER DEFAULT 0,
        FOREIGN KEY (subject_belong) REFERENCES subjects(subject_id)
      );
    `);
    
    console.log("📄 Creating subject_contents table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS subject_contents (
        content_id INTEGER PRIMARY KEY,
        server_content_id INTEGER UNIQUE,
        lesson_belong INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        test_id INTEGER,
        url TEXT,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT,
        downloaded DEFAULT FALSE,
        downloaded_at TEXT,
        done BOOLEAN DEFAULT FALSE,
        last_accessed TEXT,
        started_at TEXT,
        completed_at TEXT,
        duration INTEGER,
        is_synced BOOLEAN DEFAULT FALSE,
        synced_at TEXT,
        FOREIGN KEY (lesson_belong) REFERENCES lessons(lesson_id)
      );
    `);
    
    console.log("🎮 Creating game_types table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS game_types (
        game_type_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );
    `);
    
    console.log("🕹️ Creating games table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS games (
        game_id INTEGER PRIMARY KEY,
        server_game_id INTEGER UNIQUE,
        subject_id INTEGER NOT NULL,
        content_id INTEGER,
        game_type_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
        FOREIGN KEY (content_id) REFERENCES subject_contents(content_id),
        FOREIGN KEY (game_type_id) REFERENCES game_types(game_type_id)
      );
    `);
    
    console.log("📊 Creating pupil_test_scores table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS pupil_test_scores (
        score_id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_score_id INTEGER UNIQUE,
        pupil_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        max_score INTEGER NOT NULL,
        grade INTEGER NOT NULL,
        attempt_number INTEGER DEFAULT 1,
        taken_at TEXT,
        is_synced BOOLEAN DEFAULT FALSE,
        synced_at TEXT,
        FOREIGN KEY (pupil_id) REFERENCES users(user_id)
      );
    `);
    
    console.log("✍️ Creating pupil_answers table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS pupil_answers (
        answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_answer_id INTEGER UNIQUE,
        pupil_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        choice_id INTEGER,
        is_synced BOOLEAN DEFAULT FALSE,
        synced_at TEXT,
        FOREIGN KEY (pupil_id) REFERENCES users(user_id)
      );
    `);
    
    console.log("🏆 Creating pupil_achievements table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS pupil_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_achievement_id INTEGER,
        server_badge_id INTEGER,
        pupil_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        earned_at TEXT,
        subject_content_id INTEGER,
        is_synced BOOLEAN DEFAULT FALSE,
        synced_at TEXT,
        FOREIGN KEY (pupil_id) REFERENCES users(user_id),
        FOREIGN KEY (subject_content_id) REFERENCES subject_contents(content_id),
        UNIQUE (pupil_id, server_achievement_id)
      );
    `);
    
    console.log("🔔 Creating notifications table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_notification_id INTEGER UNIQUE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT TRUE,
        created_at TEXT NOT NULL,
        read_at TEXT,
        is_synced BOOLEAN DEFAULT FALSE,
        synced_at TEXT
      );
    `);
    
    console.log("👫 Creating classmates table...");
    await safeExec(db, `
      CREATE TABLE IF NOT EXISTS classmates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        avatar TEXT,
        classmate_name TEXT NOT NULL,
        section_id INTEGER NOT NULL,
        FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
        UNIQUE (user_id, section_id)
      );
    `);
    
    console.log("🔐 Inserting default roles...");
    await safeExec(db, `
      INSERT OR IGNORE INTO roles (role_id, role_name, description) VALUES 
        (1, 'admin', 'Administrator'),
        (2, 'teacher', 'Teaching'),
        (3, 'pupil', 'Student');
    `);
    
    console.log("✅ All tables created successfully");
    markDbInitialized();
    console.log("🎉 Database initialization complete");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}
