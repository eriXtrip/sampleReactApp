// root/backend/routes/auth.js
import express from 'express';
import { pool } from '../server/db.js';
import { createAndSendVerificationCode } from '../../backend/services/verification.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Step 1: Register user (without password)
router.post('/', async (req, res) => {
  const {
    role,
    firstName,
    lastName,
    middleName = null,
    suffix = null,
    gender,
    birthDate,
    lrn = null,
    teacherId = null,
    email
  } = req.body;

  if (!role || !firstName || !lastName || !gender || !birthDate || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const connection = await pool.getConnection();
  try {
    // Get role ID
    const [roleRows] = await connection.execute(
      'SELECT role_id FROM roles WHERE role_name = ?',
      [role]
    );

    if (roleRows.length === 0) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const roleId = roleRows[0].role_id;

    // Insert partial user
    const [result] = await connection.execute(
      `INSERT INTO users 
      (email, first_name, middle_name, last_name, suffix, gender, birth_date, lrn, teacher_id, role_id, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [email, firstName, middleName, lastName, suffix, gender, birthDate, lrn, teacherId, roleId]
    );

    const userId = result.insertId;

    // Send verification code
    await createAndSendVerificationCode(userId, email);

    res.json({ message: 'Verification code sent', userId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    connection.release();
  }
});

// Step 2: Set password after code verification
router.post('/set-password', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const [result] = await pool.execute(
      `UPDATE users 
       SET password_hash = ?, is_verified = TRUE 
       WHERE email = ? AND is_verified = FALSE`,
      [hashedPassword, email]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'User not found or already verified' });
    }

    res.json({ message: 'Password set successfully' });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

export default router;