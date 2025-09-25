// local-database/services/userService.js
export class UserService {
  static db = null;

  static setDatabase(db) {
    this.db = db;
  }

  static async syncUser(serverUser, token) {
    try {
      // First check if user exists by email
      const existingUser = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [serverUser.email]
      );

      if (existingUser) {
        console.log('User exists, updating fields...');
        await this.db.runAsync(
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
            last_sync = datetime('now')
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
            serverUser.email
          ]
        );
      } else {
        console.log('New user, inserting...');
        await this.db.runAsync(
          `INSERT INTO users (
            server_id, role_id, email, first_name, middle_name, last_name, 
            suffix, gender, birth_date, lrn, teacher_id, token, last_sync
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
            token
          ]
        );
      }
      console.log('User synced successfully');
    } catch (error) {
      console.error('User sync failed', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    if (!this.db) {
      console.warn('Database not initialized');
      return null;
    }

    try {
      const tableExists = await this.db.getFirstAsync(
        `SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'`
      );
      
      if (!tableExists) {
        console.log('Users table does not exist');
        return null;
      }

      return await this.db.getFirstAsync('SELECT * FROM users LIMIT 1');
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  static async clearUserData() {
    if (!this.db) {
      console.warn('Database not initialized - skipping clear');
      return;
    }

    try {
      await this.db.runAsync('DELETE FROM users');
      await this.db.runAsync('DELETE FROM sessions');
    } catch (error) {
      console.error('Failed to clear user data:', error);
      throw error;
    }
  }


  static async hasChanges(existingUser, serverUser) {
    const fieldsToCheck = [
      'server_id', 'first_name', 'last_name', 'role_id', 'lrn', 
      'teacher_id', 'gender', 'birth_date'
    ];
    
    return fieldsToCheck.some(field => 
      existingUser[field] !== serverUser[field] &&
      !(existingUser[field] == null && serverUser[field] == null)
    );
  }

  static async safeClearAndClose() {
    if (!this.db) {
      console.warn("⚠️ safeClearAndClose: DB is null, skipping");
      return;
    }

    try {
      // Try clearing user-related tables
      await this.clearUserData();
      console.log("🧹 User data cleared");
    } catch (err) {
      console.warn("⚠️ Error clearing user data:", err);
    }

    try {
      // Now close the DB
      await this.db.closeAsync();
      console.log("🔒 Database closed");
    } catch (err) {
      console.warn("⚠️ Error closing DB:", err);
    } finally {
      // Always reset the handle
      this.db = null;
    }
  }
}