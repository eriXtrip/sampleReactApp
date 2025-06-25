// server/db.js
import config from '../config.js';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Database connection
const pool = mysql.createPool(config.db);

// Password hashing utility
const saltRounds = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// User registration
async function registerUser(userData) {
  const {
    email,
    password,
    firstName,
    lastName,
    middleName = null,
    suffix = null,
    gender,
    birthDate,
    lrn = null,
    teacherId = null,
    role
  } = userData;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get role ID
    const [roleRow] = await connection.execute(
      'SELECT role_id FROM roles WHERE role_name = ?',
      [role]
    );

    if (roleRow.length === 0) {
      throw new Error('Invalid role specified');
    }

    const roleId = roleRow[0].role_id;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const [result] = await connection.execute(
      `INSERT INTO users 
      (email, password_hash, first_name, middle_name, last_name, suffix, gender, birth_date, lrn, teacher_id, role_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, middleName, lastName, suffix, gender, birthDate, lrn, teacherId, roleId]
    );

    const userId = result.insertId;

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await connection.execute(
      `INSERT INTO verification_codes 
      (user_id, code, expires_at)
      VALUES (?, ?, ?)`,
      [userId, verificationCode, expiresAt]
    );

    await connection.commit();

    return {
      userId,
      verificationCode
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Verify user with code
async function verifyUser(email, code) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get user
    const [users] = await connection.execute(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const userId = users[0].user_id;

    // Check verification code
    const [codes] = await connection.execute(
      `SELECT code_id FROM verification_codes 
       WHERE user_id = ? AND code = ? AND is_used = FALSE AND expires_at > NOW()`,
      [userId, code]
    );

    if (codes.length === 0) {
      throw new Error('Invalid or expired verification code');
    }

    // Mark user as verified and code as used
    await connection.execute(
      'UPDATE users SET is_verified = TRUE WHERE user_id = ?',
      [userId]
    );

    await connection.execute(
      'UPDATE verification_codes SET is_used = TRUE WHERE code_id = ?',
      [codes[0].code_id]
    );

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Create super admin (to be run once manually)
async function createSuperAdmin(email, password, secretKey) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // First create as regular admin user
    const registrationResult = await registerUser({
      email,
      password,
      firstName: 'Super',
      lastName: 'Admin',
      gender: 'Male',
      birthDate: new Date('1970-01-01'),
      role: 'admin'
    });

    // Then elevate to super admin
    await connection.execute(
      'INSERT INTO super_admins (user_id, secret_key) VALUES (?, ?)',
      [registrationResult.userId, secretKey]
    );

    await connection.commit();

    return registrationResult.userId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default  {
  pool,
  hashPassword,
  verifyPassword,
  registerUser,
  verifyUser,
  createSuperAdmin
};