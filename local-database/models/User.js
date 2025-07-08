// File: local-database/models/User.js

class User {
  static async syncFromServer(serverUser, token) {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO users (
            server_id, role_id, email, full_name, gender,
            birth_date, lrn, teacher_id, token, last_sync
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            serverUser.user_id,
            serverUser.role_id,
            serverUser.email,
            serverUser.full_name,
            serverUser.gender,
            serverUser.birth_date,
            serverUser.lrn,
            serverUser.teacher_id,
            token
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  static async getCurrent() {
    return new Promise((resolve) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT u.*, r.role_name 
           FROM users u
           JOIN roles r ON u.role_id = r.role_id
           LIMIT 1`,
          [],
          (_, { rows }) => resolve(rows.item(0)),
          (_, error) => resolve(null)
        );
      });
    });
  }
}

export default User;