// local-database/services/database.js
import { markDbInitialized } from './syncUp.js';

export async function initializeDatabase(db) {
  await db.execAsync(`
    -- roles (static, matches MySQL)
    CREATE TABLE IF NOT EXISTS roles (
      role_id INTEGER PRIMARY KEY,
      role_name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    -- users (subset of MySQL users)
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      server_id INTEGER UNIQUE,          -- maps to MySQL users.user_id
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
      FOREIGN KEY (role_id) REFERENCES roles(role_id)
    );

    -- sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- sections (full mirror)
    CREATE TABLE IF NOT EXISTS sections (
      section_id INTEGER PRIMARY KEY,
      server_section_id INTEGER UNIQUE,  -- maps to MySQL sections.section_id
      teacher_id INTEGER,
      teacher_name TEXT NOT NULL,       -- derived from teacher's full name on server (first + last)
      section_name TEXT NOT NULL,
      school_name TEXT,
      school_year TEXT NOT NULL
    );

    -- subjects (minimal: only what's needed for navigation)
    CREATE TABLE IF NOT EXISTS subjects (
      subject_id INTEGER PRIMARY KEY,
      server_subject_id INTEGER UNIQUE,  -- maps to MySQL subjects.subject_id
      subject_name TEXT NOT NULL,
      grade_level INTEGER NOT NULL,
      description TEXT,
      is_public BOOLEAN
    );

    -- Junction: subjects_in_section
    CREATE TABLE IF NOT EXISTS subjects_in_section (
      section_belong INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      assigned_at TEXT,
      PRIMARY KEY (section_belong, subject_id),
      FOREIGN KEY (section_belong) REFERENCES sections(section_id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
    );

    -- Lessons (linked to subjects)
    CREATE TABLE IF NOT EXISTS lessons (
      lesson_id INTEGER PRIMARY KEY,
      server_lesson_id INTEGER UNIQUE,   -- maps to MySQL lessons.lesson_id
      lesson_number INTEGER NOT NULL,  -- order within subject
      lesson_title TEXT NOT NULL,
      description TEXT,
      subject_belong INTEGER NOT NULL,   -- local subject_id
      quarter INTEGER NOT NULL CHECK (quarter IN (1,2,3,4)),
      status BOOLEAN DEFAULT FALSE,
      progress REAL DEFAULT 0,          -- 0 to 100
      last_accessed TEXT,               -- ISO timestamp
      completed_at TEXT,                -- ISO timestamp when marked complete
      is_synced BOOLEAN DEFAULT FALSE,
      synced_at TEXT,
      is_downloaded BOOLEAN DEFAULT FALSE,
      no_of_contents INTEGER DEFAULT 0,
      FOREIGN KEY (subject_belong) REFERENCES subjects(subject_id)
    );

    -- Subject Contents (only metadata + download status)
    CREATE TABLE IF NOT EXISTS subject_contents (
      content_id INTEGER PRIMARY KEY,
      server_content_id INTEGER UNIQUE,  -- maps to MySQL subject_contents.content_id
      lesson_belong INTEGER NOT NULL,    -- local lesson_id
      content_type TEXT NOT NULL,        -- 'ppt', 'pdf', 'game', 'url', 'other', 'game_match', 'game_flash', 'quiz', 'game_speak', 'game_comp', 'game_img', 'general'
      test_id INTEGER,                   -- local test_id (if tied to content)
      url TEXT,                          -- remote URL to fetch content
      title TEXT NOT NULL,
      description TEXT,
      file_name TEXT,
      downloaded DEFAULT FALSE,          -- download flag
      downloaded_at TEXT,                -- ISO timestamp when downloaded locally
      done BOOLEAN DEFAULT FALSE,          -- whether user marked as done
      last_accessed TEXT,               -- ISO timestamp
      started_at TEXT,                -- ISO timestamp when first accessed
      completed_at TEXT,                -- ISO timestamp when marked complete
      duration INTEGER,                  -- in minutes (if applicable)
      is_synced BOOLEAN DEFAULT FALSE,
      synced_at TEXT,
      FOREIGN KEY (lesson_belong) REFERENCES lessons(lesson_id)
    );

    -- Game Types (static, small)
    CREATE TABLE IF NOT EXISTS game_types (
      game_type_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );

    -- Games (metadata only; actual game = JSON from url)
    CREATE TABLE IF NOT EXISTS games (
      game_id INTEGER PRIMARY KEY,
      server_game_id INTEGER UNIQUE,     -- maps to MySQL games.game_id
      subject_id INTEGER NOT NULL,       -- local subject_id
      content_id INTEGER,                -- local content_id (if tied to content)
      game_type_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
      FOREIGN KEY (content_id) REFERENCES subject_contents(content_id),
      FOREIGN KEY (game_type_id) REFERENCES game_types(game_type_id)
    );

    -- Pupil Test Scores (for progress tracking)
    CREATE TABLE IF NOT EXISTS pupil_test_scores (
      score_id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_score_id INTEGER UNIQUE,    -- maps to MySQL pupil_test_scores.score_id
      pupil_id INTEGER NOT NULL,         -- local user_id
      test_id INTEGER NOT NULL,          -- server test_id (no local test table)
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      grade INTEGER NOT NULL,
      attempt_number INTEGER DEFAULT 1,
      taken_at TEXT,
      is_synced BOOLEAN DEFAULT FALSE,
      synced_at TEXT,
      FOREIGN KEY (pupil_id) REFERENCES users(user_id)
    );

    -- Pupil Answers (only choice selection)
    CREATE TABLE IF NOT EXISTS pupil_answers (
      answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_answer_id INTEGER UNIQUE,   -- maps to MySQL pupil_answers.answer_id
      pupil_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,      -- server question_id
      choice_id INTEGER,        -- server choice_id
      is_synced BOOLEAN DEFAULT FALSE,
      synced_at TEXT,
      FOREIGN KEY (pupil_id) REFERENCES users(user_id)
    );

    -- Achievements (only earned ones)
    CREATE TABLE IF NOT EXISTS pupil_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_achievement_id INTEGER, -- maps to MySQL achievements.achievement_id
      server_badge_id INTEGER,       -- maps to MySQL achievements.badge_id
      pupil_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      earned_at TEXT,
      subject_content_id INTEGER,                -- local content_id (if tied to content)
      is_synced BOOLEAN DEFAULT FALSE,
      synced_at TEXT,
      FOREIGN KEY (pupil_id) REFERENCES users(user_id),
      FOREIGN KEY (subject_content_id) REFERENCES subject_contents(content_id),
      UNIQUE (pupil_id, server_achievement_id)
    );

    -- User-specific notifications (offline support)
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

    -- Classmates (users in the same sections)
    CREATE TABLE IF NOT EXISTS classmates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,         -- local user_id
      classmate_name TEXT NOT NULL,          -- full name
      section_id INTEGER NOT NULL,       -- local section_id
      FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
      UNIQUE (user_id, section_id)
    );

    -- Pre-populate roles (must match MySQL)
    INSERT OR IGNORE INTO roles (role_id, role_name, description) VALUES 
      (1, 'admin', 'Administrator'),
      (2, 'teacher', 'Teaching'),
      (3, 'pupil', 'Student');

  `);
  markDbInitialized();
}