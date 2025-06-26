import * as dotenv from 'dotenv';
dotenv.config({ path: './my-app-backend/.env' }); // Explicit path

import db from './my-app-backend/services/db.js';

async function testConnection() {
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS solution');
    console.log('✅ Connection test passed. Result:', rows[0].solution);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    if (connection) await connection.release();
    process.exit();
  }
}

testConnection();