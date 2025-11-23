// SAMPLEREACTAPP/my-app-backend/controllers/authController.js
import { sendVerificationEmail } from '../utils/email.js';
import { verifyAndDecodeToken } from '../middleware/authHelpers.js';
import pool from '../services/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { console } from 'inspector';
import { logActivity } from "../utils/logActivity.js";

export const startRegistration = async (req, res) => {
  try {
    const { email, role, firstName, lastName, middleName, suffix, 
            gender, birthday, lrn, teacherId } = req.body;

    // Validate required fields
    if (!email || !role || !firstName || !lastName || !gender || !birthday) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Role-specific validation
    if (role === 'Pupil' && !lrn) {
      return res.status(400).json({ error: 'LRN is required for pupils' });
    }
    if (role === 'Teacher' && !teacherId) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    // Map role to role_id
    const roleMap = {
      'admin': 1,
      'teacher': 2,
      'pupil': 3
    };

    const normalizedRole = role.toLowerCase(); // Make sure it's lowercase
    const role_id = roleMap[normalizedRole];

    if (!role_id) {
      return res.status(400).json({ error: 'Invalid user role' });
    }

    // Check email if exists in users table
    try {
      const [existingUser] = await pool.query(
        `SELECT 1 FROM users 
        WHERE email = ? 
        AND role_id = ?`,
        [email, role_id]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Please use another email.' });
      }
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }


    // Generate unique verification code
    let verificationCode;
    let codeExists;
    do {
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      [codeExists] = await pool.query(
        'SELECT 1 FROM users_verification_code WHERE verification_code = ?',
        [verificationCode]
      );
    } while (codeExists.length > 0);

    // Store in verification table
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    await pool.query(
      `REPLACE INTO users_verification_code 
      (email, verification_code, verification_expires, type) 
      VALUES (?, ?, ?, 'registration')`,
      [email, verificationCode, expiresAt]
    );

    // Send email
    await sendVerificationEmail(
      email, 
      verificationCode,
      'Email Verification Request',
      'Your email verification code. Use the code below to proceed:'
    );

    res.status(200).json({ 
      success: true,
      message: 'Verification code sent',
      nextStep: '/verify-code'
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Check verification code
    const [result] = await pool.query(
      `SELECT 1 FROM users_verification_code 
       WHERE email = ? AND verification_code = ? 
       AND verification_expires > NOW() AND is_verified = 0`,
      [email, code]
    );

    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Mark as verified
    await pool.query(
      `UPDATE users_verification_code 
       SET is_verified = TRUE 
       WHERE email = ?`,
      [email]
    );

    res.status(200).json({ 
      success: true,
      message: 'Code verified',
      nextStep: '/create-password'
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const completeRegistration = async (req, res) => {
  const connection = await pool.getConnection(); // Get a connection for transaction
  try {
    await connection.beginTransaction(); // Start transaction

    console.log("Raw request body:", req.body);
    const {
      email: rawEmail,
      password: rawPassword,
      confirmPassword: rawConfirmPassword,
      role: rawRole,
      firstName: rawFirstName,
      lastName: rawLastName,
      middleName: rawMiddleName,
      suffix: rawSuffix,
      gender: rawGender,
      birthday: rawBirthday,
      lrn: rawLrn,
      teacherId: rawTeacherId
    } = req.body;

    const email = rawEmail?.trim();
    const password = rawPassword?.trim();
    const confirmPassword = rawConfirmPassword?.trim();
    const role = rawRole?.trim();
    const firstName = rawFirstName?.trim();
    const lastName = rawLastName?.trim();
    const middleName = rawMiddleName?.trim();
    const suffix = rawSuffix?.trim();
    const gender = rawGender?.trim();
    const birthday = rawBirthday?.trim();
    let lrn = rawLrn?.trim();
    let teacherId = rawTeacherId?.trim();

    if (!password || !confirmPassword || !role || !firstName || !lastName || !gender || !birthday) {
      await connection.rollback();
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (password !== confirmPassword) {
      await connection.rollback();
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (password.length < 8) {
      await connection.rollback();
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const [verified] = await connection.query(
      `SELECT is_verified FROM users_verification_code WHERE email = ? AND is_verified = TRUE`,
      [email]
    );
    if (verified.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'Email not verified' });
    }

    const roleMap = { 'admin': 1, 'teacher': 2, 'pupil': 3 };
    const role_id = roleMap[role.toLowerCase()];
    if (!role_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid user role' });
    }

    // 🔹 Atomic ID generation using transaction + row lock
    if (role_id === 2 && teacherId === '0000000000') {
      const [latest] = await connection.query(
        `SELECT teacher_id FROM users WHERE role_id = 2 ORDER BY teacher_id DESC LIMIT 1 FOR UPDATE`
      );
      const lastId = latest.length ? parseInt(latest[0].teacher_id, 10) : 0;
      teacherId = String(lastId + 1).padStart(10, '0');
    }

    if (role_id === 3 && lrn === '000000000000') {
      const [latest] = await connection.query(
        `SELECT lrn FROM users WHERE role_id = 3 ORDER BY lrn DESC LIMIT 1 FOR UPDATE`
      );
      const lastLrn = latest.length ? parseInt(latest[0].lrn, 10) : 0;
      lrn = String(lastLrn + 1).padStart(12, '0');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      `INSERT INTO users (
        email, password_hash, role_id, first_name, middle_name, 
        last_name, suffix, gender, birth_date, lrn, teacher_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, role_id, firstName, middleName, lastName, suffix, gender, birthday, lrn, teacherId]
    );

    await connection.query(`DELETE FROM users_verification_code WHERE email = ?`, [email]);

    await connection.commit(); // Commit transaction

    const newUserId = result.insertId;
    await logActivity(newUserId, "New User");

    res.status(201).json({ success: true, message: 'Registration completed successfully' });

  } catch (error) {
    await connection.rollback(); // Rollback on any error
    console.error('Registration completion error:', error);
    res.status(500).json({ error: 'Registration completion failed' });
  } finally {
    connection.release(); // Release connection back to pool
  }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        console.log('Querying database for user...');
        const [users] = await pool.query(
            `SELECT 
                u.user_id, 
                u.role_id,
                u.first_name,
                u.middle_name,
                u.last_name,
                u.suffix,
                u.gender,
                u.birth_date,
                u.email, 
                u.password_hash, 
                u.lrn,
                u.teacher_id,
                u.avatar_id,
                a.avatar AS avatar_path,
                a.file_name AS avatar_filename,
                a.url AS avatar_url,
                a.thumbnail AS avatar_thumbnail
            FROM users u
            LEFT JOIN avatar a ON u.avatar_id = a.id
            WHERE u.email = ?`,
            [email]
        );

        console.log('Database query results:', {
            userCount: Array.isArray(users) ? users.length : 0,
            firstUser: Array.isArray(users) && users[0] ? {
                id: users[0].user_id,
                email: users[0].email,
                role_id: users[0].role_id
            } : null
        });

        // Check if users array is valid and not empty
        if (!!!users || users.length === 0) {
            return res.status(401).json({ error: 'No account found. Please create an account with your email' });
        }

        const user = users[0];

        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Login failed. Please check your credentials.' });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Added token expiration
        );

        // ✅ Call the utils to log activity
        if (user.role_id !== 1){
          await logActivity(user.user_id, "User logged in");
        }
        

        // Return user data without sensitive information
        res.json({
            success: true,
            token,
            user: {
                id: user.user_id,
                email: user.email,
                firstName: user.first_name,
                middleName: user.middle_name,
                lastName: user.last_name,
                suffix: user.suffix,
                role: user.role_id, // Consistent with client expectation
                birthday: user.birth_date,
                gender: user.gender,
                lrn: user.lrn,
                teacherId: user.teacher_id,
                avatar: {
                    id: user.avatar_id,
                    fileName: user.avatar_filename,
                    url: user.avatar_url,
                    avatar: user.avatar_path,
                    thumbnail: user.avatar_thumbnail
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'ECONNREFUSED') {
            return res.status(500).json({ error: 'Database connection failed' });
        }
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

export const admin_confirm_login = async (req, res) => {
  try {
    const { userId, secret_key } = req.body;

    console.log("received admin login:", userId, secret_key);

    if (!userId || !secret_key) {
      return res.status(400).json({ error: "User ID and secret key are required" });
    }

    // ✅ Step 1: Get hashed secret_key from DB
    const [rows] = await pool.query(
      `SELECT a.admin_id, a.secret_key 
       FROM admins a 
       WHERE a.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Admin not found" });
    }

    const user = rows[0];

    // ✅ Step 2: Compare input secret_key with stored hash
    const passwordValid = await bcrypt.compare(secret_key, user.secret_key);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid secret key" });
    }

    // ✅ Step 3: Log activity
    await logActivity(userId, "Admin logged in");

    return res.json({ success: true, message: "Admin confirmed" });
  } catch (error) {
    console.error("Admin confirm error:", error);
    res.status(500).json({ error: "Server error confirming admin login" });
  }
};


// Token revocation middleware
export const checkTokenRevocation = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const [revoked] = await pool.query(
            'SELECT 1 FROM revoked_tokens WHERE token = ?',
            [token]
        );
        
        if (revoked.length > 0) {
            return res.status(401).json({ error: 'Token revoked' });
        }
        
        next();
    } catch (error) {
        console.error('Token revocation check failed:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Token verification middleware
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { email } = req.body;

    // Check revocation
    const [revoked] = await pool.query(
      'SELECT * FROM revoked_tokens WHERE token = ?',
      [token]
    );
    
    if (revoked.length > 0) {
      return res.status(401).json({ valid: false });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: decoded.email === email });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
};

// New logout endpoint
export const logout = async (req, res) => {
    try {
        const { user_id } = req.body; // ✅ receive user_id from request body
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(400).json({ error: "No token provided" });
        }

        if (!user_id) {
            return res.status(400).json({ error: "No user_id provided" });
        }

        // Optionally still verify token, but not required if you trust user_id
        // try {
        //     jwt.verify(token, process.env.JWT_SECRET);
        // } catch (err) {
        //     return res.status(401).json({ error: "Invalid token" });
        // }

        // Insert the token into revoked_tokens
        await pool.query(
            "INSERT INTO revoked_tokens (token, revoked_at) VALUES (?, CURRENT_TIMESTAMP)",
            [token]
        );

        // ✅ Log the logout activity using provided user_id
        await logActivity(user_id, "User logged out");

        res.json({ success: true });
    } catch (error) {
        console.error("Logout failed:", error);
        res.status(500).json({ error: "Logout failed" });
    }
};


export const startPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const [users] = await pool.query(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found. Pls register with your email' });
    }

    // Generate unique 6-digit verification code
    let verificationCode;
    let codeExists;
    do {
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      [codeExists] = await pool.query(
        'SELECT 1 FROM users_verification_code WHERE verification_code = ?',
        [verificationCode]
      );
    } while (codeExists.length > 0);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Insert code into password_reset table
    await pool.query(
      `REPLACE INTO users_verification_code (email, verification_code, verification_expires, type)
       VALUES (?, ?, ?, 'password_reset')`,
      [email, verificationCode, expiresAt]
    );

    // Send verification code to email
    await sendVerificationEmail(
      email,
      verificationCode,
      'Password Reset Request',
      'You recently requested to reset your password. Use the code below to proceed:'
    );


    res.status(200).json({ success: true, message: 'Verification code sent' });

  } catch (error) {
    console.error('startPasswordReset error:', error);
    res.status(500).json({ error: 'Failed to initiate password reset' });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const [records] = await pool.query(
      `SELECT * FROM users_verification_code
       WHERE email = ? AND verification_code = ? AND verification_expires > NOW()`,
      [email, code]
    );

    if (records.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    res.status(200).json({ success: true, message: 'Code verified' });

  } catch (error) {
    console.error('verifyResetCode error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
};

export const completePasswordReset = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and new password are required" });
    }

    // Step 1: Fetch current hashed password + user_id from database
    const [rows] = await pool.query(
      "SELECT user_id, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { user_id, password_hash: currentHash } = rows[0];

    // Step 2: Compare new password with old one
    const isSame = await bcrypt.compare(password, currentHash);
    if (isSame) {
      return res
        .status(400)
        .json({ error: "You are currently using this password." });
    }

    // Step 3: Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    // Step 4: Clean up verification codes (optional)
    await pool.query("DELETE FROM users_verification_code WHERE email = ?", [
      email,
    ]);

    // ✅ Log the reset activity with correct user_id
    await logActivity(user_id, "User reset password");

    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("completePasswordReset error:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
};



export const changePassword = async (req, res) => {
  try {
    const { server_id, currentPassword, newPassword } = req.body;
    console.log('ChangePassword data:', { server_id, currentPassword, newPassword });

    const decoded = await verifyAndDecodeToken(req);
    console.log('swt: ', decoded);

    if (!server_id || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Server ID, current password, and new password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE user_id = ?', [server_id]);
    if (!users.length) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashedPassword, server_id]);

    // ✅ Log the reset activity with correct user_id
    await logActivity(server_id, "User change password");

    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(401).json({ error: error.message || 'Failed to change password' });
  }
};

/* parameterized queries with ? placeholders and pool.query([...]) 
it will not be interpreted as SQL query, but treated as a literal string */

// Insecure - vulnerable to SQL injection
export const vulnerableFunction = async (req, res) => {
  const { email } = req.body;
  try {
    const query = `SELECT * FROM users WHERE email = '${email}'`;
    console.log("🔍 Final query:", query);

    const [rows] = await pool.query(query);

    if (rows.length > 0) {
      return res.json({ success: true, users: rows });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ SQL error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
 // This will convert the query into: SELECT * FROM users WHERE email = ' OR '1'='1 -- ' and return all users, bypassing security.

// Secure - parameterized query
export const secureFunction = async (req, res) => {
  const { email } = req.body;

  try {
    // SAFE: using placeholders for user input
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      return res.json({ success: true, user: rows[0] });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }

  } catch (error) {
    console.error('Secure login error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

//  Query that separates user input from the SQL logic Example: ' OR '1'='1 -- ' will be treated as a literal string, not SQL.