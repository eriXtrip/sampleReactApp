// local-database/services/userService.js
export class UserService {
  static db = null;

  static setDatabase(db) {
    this.db = db;
  }

  static async syncUser(serverUser, token) {
    try {
      // First check if user exists
      const existingUser = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [serverUser.email]
      );

      if (existingUser) {
        console.log('User exists, updating fields...');
        // Only update changed fields
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
            serverUser.user_id,
            serverUser.role_id,
            serverUser.first_name,
            serverUser.middle_name || null,
            serverUser.last_name,
            serverUser.suffix || null,
            serverUser.gender,
            serverUser.birth_date,
            serverUser.lrn || null,
            serverUser.teacher_id || null,
            token,
            serverUser.email  // WHERE condition
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
            serverUser.user_id,
            serverUser.role_id,
            serverUser.email,
            serverUser.first_name,
            serverUser.middle_name || null,
            serverUser.last_name,
            serverUser.suffix || null,
            serverUser.gender,
            serverUser.birth_date,
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
      // First verify table exists
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
    try {
      await this.db.runAsync('DELETE FROM users');
      console.log('All user data cleared');
    } catch (error) {
      console.error('Failed to clear user data:', error);
      throw error;
    }
  }

  // New method to check for specific field changes
  static async hasChanges(existingUser, serverUser) {
    const fieldsToCheck = [
      'first_name', 'last_name', 'role_id', 'lrn', 
      'teacher_id', 'gender', 'birth_date'
    ];
    
    return fieldsToCheck.some(field => 
      existingUser[field] !== serverUser[field] &&
      !(existingUser[field] == null && serverUser[field] == null)
    );
  }
}