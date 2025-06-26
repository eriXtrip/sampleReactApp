// services/db.js
import mysql from 'mysql2/promise';
import config from '../config.js';

const pool = mysql.createPool(config.db);

// Test connection
try {
  const connection = await pool.getConnection();
  console.log('✅ MySQL Connection established');
  await connection.query('SELECT 1 + 1 AS test');
  connection.release();
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  console.error('Full config:', config.db);
  process.exit(1);
}

export default pool;