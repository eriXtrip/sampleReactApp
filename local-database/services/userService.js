// local-database/services/userService.js
export default class UserService {
  static db = null;

  // Initialize the database once in app startup
  static setDatabase(db) {
    this.db = db;
  }

  // Sync user with server
  static async syncUser(serverUser, token, dbInstance = null) {
    const activeDb = dbInstance || this.db;

    if (!activeDb) {
      console.warn('❌ syncUser: Database not initialized');
      return;
    }

    try {
      const existingUser = await activeDb.getFirstAsync(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [serverUser.email]
      );

      if (existingUser) {
        console.log('User exists, updating fields...');
        // Update existing user
        await activeDb.runAsync(
          `UPDATE users SET
            server_id = ?,
            role_id = ?,
            first_name = ?,
            middle_name = ?,
            last_name = ?,
            suffix = ?,
            gender = ?,
            birth_date = ?,
            lrn = ?,
            teacher_id = ?,
            token = ?,
            last_sync = datetime('now'),
            avatar_id = ?,
            avatar = ?,
            avatar_url = ?,
            avatar_file_name = ?,
            avatar_thumbnail = ?
          WHERE email = ?`,
          [
            serverUser.server_id,
            serverUser.role_id,
            serverUser.first_name,
            serverUser.middle_name || null,
            serverUser.last_name,
            serverUser.suffix || null,
            serverUser.gender || null,
            serverUser.birth_date || null,
            serverUser.lrn || null,
            serverUser.teacher_id || null,
            token,
            serverUser.avatar?.id || null,
            serverUser.avatar?.avatar || null,
            serverUser.avatar_url || null,
            serverUser.avatar.avatar_file_name || null,
            serverUser.avatar?.thumbnail || null,
            serverUser.email
          ]
        );

        } else {

        // Insert new user
        await activeDb.runAsync(
          `INSERT INTO users (
            server_id, role_id, email, first_name, middle_name, last_name, 
            suffix, gender, birth_date, lrn, teacher_id, token, last_sync,
            avatar_id, avatar, avatar_url, avatar_file_name, avatar_thumbnail
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?)`,
          [
            serverUser.server_id,
            serverUser.role_id,
            serverUser.email,
            serverUser.first_name,
            serverUser.middle_name || null,
            serverUser.last_name,
            serverUser.suffix || null,
            serverUser.gender || null,
            serverUser.birth_date || null,
            serverUser.lrn || null,
            serverUser.teacher_id || null,
            token,
            serverUser.avatar?.id || null,
            serverUser.avatar?.avatar || null,
            serverUser.avatar_url || null,           // ← Local file path
            serverUser.avatar_file_name || null,     // ← Original avatar_file_name
            serverUser.avatar?.thumbnail || null,
          ]
        );
      }
      console.log('✅ User synced successfully');
    } catch (error) {
      console.error('❌ User sync failed', error);
      throw error;
    }
  }

  // Get current user
  static async getCurrentUser(dbInstance = null) {
    const activeDb = dbInstance || this.db;
    if (!activeDb) {
      console.warn('❌ getCurrentUser: Database not initialized');
      return null;
    }

    try {
      const tableExists = await activeDb.getFirstAsync(
        `SELECT name FROM sqlite_master 
         WHERE type='table' AND name='users'`
      );

      if (!tableExists) {
        console.log('ℹ️ Users table does not exist');
        return null;
      }

      return await activeDb.getFirstAsync('SELECT * FROM users LIMIT 1');
    } catch (error) {
      console.error('❌ Failed to get user:', error);
      return null;
    }
  }

  // Clear user + session data
  static async clearUserData(dbInstance = null) {
    const activeDb = dbInstance || this.db;
    if (!activeDb) return;

    const tables = ['users', 'sessions'];
    for (const table of tables) {
      try {
        await activeDb.runAsync(`DELETE FROM ${table}`);
      } catch (e) {
        console.debug(`(debug) Skip clear ${table}: ${e.message}`);
      }
    }
  }

  // Compare changes
  static hasChanges(existingUser, serverUser) {
    const fieldsToCheck = [
      'server_id', 'first_name', 'last_name', 'role_id',
      'lrn', 'teacher_id', 'gender', 'birth_date'
    ];
    
    return fieldsToCheck.some(
      field =>
        existingUser[field] !== serverUser[field] &&
        !(existingUser[field] == null && serverUser[field] == null)
    );
  }

  // Clear ALL user-related data
  static async clearAllUserData(dbInstance = null) {
    const activeDb = dbInstance || this.db;
    if (!activeDb) {
      console.warn('❌ clearAllUserData: DB not ready for full clear');
      return;
    }

    try {
      await this.clearUserData(activeDb);

      const tablesToClear = [
        'sections', 'subjects', 'lessons', 'subject_contents',
        'games', 'notifications', 'pupil_test_scores', 'pupil_achievements'
      ];

      for (const table of tablesToClear) {
        try {
          await activeDb.runAsync(`DELETE FROM ${table}`);
        } catch (e) {
          console.warn(`⚠️ Skip clear ${table}:`, e.message);
        }
      }

      console.log('🧹 All user-related data cleared');
    } catch (err) {
      console.warn('⚠️ Full clear failed (non-fatal):', err.message);
    }
  }

  // Debug DB snapshot
  static async display_sqliteDatabase(dbInstance = null) {
    const activeDb = dbInstance || this.db;
    if (!activeDb) {
      console.warn('❌ display_sqliteDatabase: Database not initialized');
      return;
    }

    // 🔍 LOG THE DATABASE FILE PATH
    console.log('\n🔍 === SQLITE DATABASE IN USE ===');
    console.log('📁 Database file:', activeDb.databasePath || 'unknown (no path)');
    console.log('==================================\n');

    const tables = [
      // 'roles',
      // 'users',
      // 'sections',
      // 'subjects',
      // 'subjects_in_section',
      'lessons',
      'subject_contents',
      // 'games',
      // 'game_types',
      //'notifications'
      //'pupil_test_scores',
      //'pupil_achievements',
      // 'classmates'
    ];

    for (const table of tables) {
      try {
        const exists = await activeDb.getFirstAsync(
          `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
          [table]
        );

        if (!exists) {
          console.log(`\n📋 Table '${table}': ❌ Not found`);
          continue;
        }

        const rows = await activeDb.getAllAsync(`SELECT * FROM ${table}`);
        console.log(`\n📋 Table '${table}' (${rows.length} rows):`);

        if (rows.length === 0) {
          console.log('  (empty)');
        } else {
          rows.forEach((row, i) => {
            console.log(`  ${i + 1}.`, JSON.stringify(row, null, 2));
          });
        }
      } catch (error) {
        console.warn(`⚠️ Error reading table '${table}':`, error.message);
      }
    }

    console.log('\n✅ === END SNAPSHOT ===\n');
  }
}
