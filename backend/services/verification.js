// root/Backend/services/verification.js
import { sendVerificationEmail } from '../utils/email.js';
import { query } from '../utils/db.js';
import config from '../config.js';

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createAndSendVerificationCode = async (userId, email) => {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + config.codeExpirationTime * 60000);

  await query(
    `INSERT INTO verification_codes 
     (user_id, code, expires_at) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE 
     code = VALUES(code), 
     expires_at = VALUES(expires_at), 
     is_used = FALSE`,
    [userId, code, expiresAt]
  );

  await sendVerificationEmail(email, code);
  
  return code;
};

export const verifyCode = async (userId, code) => {
  const result = await query(
    `SELECT code_id FROM verification_codes 
     WHERE user_id = ? AND code = ? AND is_used = FALSE AND expires_at > NOW()`,
    [userId, code]
  );

  if (result.length === 0) {
    throw new Error('Invalid or expired verification code');
  }

  await query(
    'UPDATE verification_codes SET is_used = TRUE WHERE code_id = ?',
    [result[0].code_id]
  );

  return true;
};