// services/db.js
import mysql from 'mysql2/promise';
import config from '../config.js';

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Enhanced connection test
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('SELECT 1 + 1 AS test');
    console.log('✅ MySQL connection established successfully');
    await connection.ping();
    console.log('✅ MySQL server is responsive');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('Connection config:', {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user
      // Don't log password!
    });
    throw err; // Rethrow to prevent app from starting
  } finally {
    if (connection) connection.release();
  }
}

// Test immediately and every 5 minutes
testConnection().catch(() => process.exit(1));
setInterval(testConnection, 300000); // 5 minute keepalive

export default pool;