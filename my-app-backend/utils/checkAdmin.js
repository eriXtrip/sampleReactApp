// my-app-backend/utils/checkAdmin.js
import pool from '../services/db.js';

/**
 * Checks if a user (by user_id) has the 'admin' role.
 * @param {number} userId - The user ID to check
 * @returns {Promise<boolean>} - True if admin, false otherwise
 */
export const isUserAdmin = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT role_id FROM users WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 && rows[0].role_id === 1;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false; // Fail securely
  }
};