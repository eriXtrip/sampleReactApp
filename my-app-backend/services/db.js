// services/db.js
import mysql from 'mysql2/promise';
import config from '../config.js';

const pool = mysql.createPool(config.db);

// Test connection
try {
  const connection = await pool.getConnection();
  console.log('✅ MySQL Connection established');
  connection.release();
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  console.log('Current configuration:', config.db);
  process.exit(1);
}

export default pool;