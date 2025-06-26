import pool from '../services/db.js';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
  try {
    const { email, firstName, middleName, lastName, suffix, gender, birthday, lrn, teacher_id, role, code, password } = req.body;

    // 1. Hash password
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + process.env.APP_SALT,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    // 2. Store in local MySQL
    const [result] = await pool.query(
      `INSERT INTO registration_users 
        (email, first_name, middle_name, last_name, suffix, gender, birth_date, lrn, teacher_id, role_id, code, password) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, firstName, middleName, lastName, suffix, gender, birthday, lrn, teacher_id, role, code, password]
    );

    res.status(201).json({ 
      success: true, 
      userId: result.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
};