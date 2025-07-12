// local-database/services/userService.js
export class UserService {
  static db = null;

  static setDatabase(db) {
    this.db = db;
  }

  static async syncUser(serverUser, token) {
    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO users (
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
      console.log('User synced to local DB');
    } catch (error) {
      console.error('User sync failed', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      return await this.db.getFirstAsync(`
        SELECT 
          u.*, 
          r.role_name 
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        LIMIT 1
      `);
    } catch (error) {
      console.error('Failed to get user', error);
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
}