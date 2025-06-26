import { sendVerificationEmail } from '../utils/email.js';
import pool from '../services/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const startRegistration = async (req, res) => {
  try {
    const { email, role, firstName, lastName, middleName, suffix, 
            gender, birthday, lrn, teacherId } = req.body;

    // Validate required fields
    if (!email || !role || !firstName || !lastName || !gender || !birthday) {
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
        'SELECT 1 FROM registration_users WHERE verification_code = ?',
        [verificationCode]
      );
    } while (codeExists.length > 0);

    // Store in verification table
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    await pool.query(
      `INSERT INTO registration_users 
      (email, verification_code, verification_expires) 
      VALUES (?, ?, ?)`,
      [email, verificationCode, expiresAt]
    );

    // Send email
    await sendVerificationEmail(email, verificationCode);

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
      `SELECT 1 FROM registration_users 
       WHERE email = ? AND verification_code = ? 
       AND verification_expires > NOW()`,
      [email, code]
    );

    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Mark as verified
    await pool.query(
      `UPDATE registration_users 
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

    console.log("Raw request body:", req.body);
    const {
      email,
      password,
      confirmPassword,
      role,
      firstName,
      lastName,
      middleName,
      suffix,
      gender,
      birthday,
      lrn,
      teacherId
    } = req.body;


    console.log("Destructured fields:", {
      email, password, confirmPassword, role, firstName, 
      lastName, gender, birthday // Log the critical fields
    });
    
    if ( !password || !confirmPassword || !role || 
        !firstName || !lastName || !gender || !birthday) {
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
      `SELECT is_verified FROM registration_users WHERE email = ? AND is_verified = TRUE`,
      [email]
    );

    if (verified.length === 0) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Get initial registration data
    const [regData] = await pool.query(
      `SELECT * FROM registration_users WHERE email = ?`,
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
        email, password_hash, role_id, first_name, middle_name, 
        last_name, suffix, gender, birth_date, lrn, teacher_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        hashedPassword,
        role_id,
        firstName,
        middleName,
        lastName,
        suffix,
        gender,
        birthday,
        finalLrn,
        finalTeacherId
      ]
    );

    // Cleanup: remove from temp table
    await pool.query(`DELETE FROM registration_users WHERE email = ?`, [email]);

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
                u.id, 
                u.email, 
                u.password_hash, 
                u.role_id,
                r.name as role,
                u.first_name,
                u.last_name,
                u.lrn,
                u.teacher_id
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
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
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                lrn: user.lrn,
                teacherId: user.teacher_id
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
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