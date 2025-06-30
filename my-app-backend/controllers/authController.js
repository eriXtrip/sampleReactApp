// SAMPLEREACTAPP/my-app-backend/controllers/authController.js
import { sendVerificationEmail } from '../utils/email.js';
import pool from '../services/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const startRegistration = async (req, res) => {
  try {
    const { email, role, fullName, gender,
             birthday, lrn, teacherId } = req.body;

    // Validate required fields
    if (!email || !role || !fullName || !gender || !birthday) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Role-specific validation
    if (role === 'pupil' && !lrn) {
      return res.status(400).json({ error: 'LRN is required for pupils' });
    }
    if (role === 'teacher' && !teacherId) {
      return res.status(400).json({ error: 'Teacher ID is required' });
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
      `INSERT INTO users_verification_code 
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
  try {
    const {
      email,
      password,
      confirmPassword,
      role,
      fullName,
      gender,
      birthday,
      lrn,
      teacherId
    } = req.body;
    
    if ( !password || !confirmPassword || !role || 
        !fullName || !gender || !birthday) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate password match and length
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email is verified in temporary table
    const [verified] = await pool.query(
      `SELECT is_verified FROM users_verification_code WHERE email = ? AND is_verified = TRUE`,
      [email]
    );

    if (verified.length === 0) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Get initial registration data
    const [regData] = await pool.query(
      `SELECT * FROM users_verification_code WHERE email = ?`,
      [email]
    );

    if (!regData || regData.length === 0) {
      return res.status(404).json({ error: 'Registration data not found' });
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set lrn or teacher_id based on role
    let finalLrn = null;
    let finalTeacherId = null;

    if (normalizedRole === 'pupil') {
      finalLrn = lrn || null;
    } else if (normalizedRole === 'teacher') {
      finalTeacherId = teacherId || null;
    }

    // Insert into users table
    await pool.query(
      `INSERT INTO users (
        email, password_hash, role_id, full_name, gender, birth_date, lrn, teacher_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        hashedPassword,
        role_id,
        fullName,
        gender,
        birthday,
        finalLrn,
        finalTeacherId
      ]
    );

    // Cleanup: remove from temp table
    await pool.query(`DELETE FROM users_verification_code WHERE email = ?`, [email]);

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Registration completed successfully'
    });

  } catch (error) {
    console.log('Registration completion error:', error);
    res.status(500).json({ error: 'Registration completion failed' });
  }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const [users] = await pool.query(
            `SELECT 
                u.email, 
                u.password_hash 
            FROM users u
            WHERE u.email = ?;`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'No account found' });
        }

        const user = users[0];

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data without sensitive information
        res.json({
            success: true,
            token,
            user: {
                email: user.email,
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again. backend' });
    }
};



// Add this to your authController.js
export const logout = async (req, res) => {
  try {
    // Option 1: Simple response (client-side token deletion)
    // This works if you're using stateless JWT (no server-side session)
    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });

    // Option 2: Token invalidation (if using token blacklist)
    /*
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Add token to blacklist (requires Redis or database table)
      await pool.query(
        'INSERT INTO revoked_tokens (token, expires_at) VALUES (?, ?)',
        [token, new Date(req.user.exp * 1000)] // Use token expiration
      );
    }
    res.status(200).json({ success: true });
    */

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      'SELECT email, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with that email' });
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
      `INSERT INTO users_verification_code (email, verification_code, verification_expires, type)
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
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, email]
    );

    // Optionally delete all password reset codes for this email
    await pool.query('DELETE FROM users_verification_code WHERE email = ?', [email]);

    res.status(200).json({ success: true, message: 'Password reset successful' });

  } catch (error) {
    console.error('completePasswordReset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
