// my-app-backend/middleware/authHelpers.js

import jwt from 'jsonwebtoken';
import pool from '../services/db.js';

export const verifyAndDecodeToken = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('No authentication token provided');
  }

  // Check revocation
  const [revoked] = await pool.query(
    'SELECT * FROM revoked_tokens WHERE token = ?',
    [token]
  );

  if (revoked.length > 0) {
    throw new Error('Token revoked');
  }

  // Verify JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};
