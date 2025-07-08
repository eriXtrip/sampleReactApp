// SAMPLEREACTAPP/local-database/services/database.js

import { getDatabase, initDatabase } from './database';

export class UserService {
  static _initialized = false;
  
  static async initialize() {
    if (!this._initialized) {
      await initDatabase();
      this._initialized = true;
    }
  }

  // Sync server user data to SQLite
  static async syncUser(serverUser, token) {
    await this.initialize();
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
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
          ],
          (_, result) => {
            console.log('User synced to local DB');
            resolve(result);
          },
          (_, error) => {
            console.error('User sync failed', error);
            reject(error);
          }
        );
      });
    });
  }

  // Get current user from SQLite
  static async getCurrentUser() {
    await this.initialize();
    const db = await getDatabase();
    
    return new Promise((resolve) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            u.*, 
            r.role_name 
          FROM users u
          JOIN roles r ON u.role_id = r.role_id
          LIMIT 1`,
          [],
          (_, { rows }) => resolve(rows.item(0)),
          (_, error) => {
            console.error('Failed to get user', error);
            resolve(null);
          }
        );
      });
    });
  }

  static async clearUserData() {
    await this.initialize();
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM users',
          [],
          () => {
            console.log('All user data cleared');
            resolve();
          },
          (_, error) => {
            console.error('Failed to clear user data:', error);
            reject(error);
          }
        );
      });
    });
  }
}