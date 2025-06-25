// testConnection.js
import db from './server/db.js';  // Import the default export

async function testConnection() {
  let connection;
  try {
    // Access pool through the db object
    connection = await db.pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS solution');
    console.log('✅ Connection successful! Result:', rows[0].solution);
    
    // Test database version (optional)
    const [version] = await connection.query('SELECT VERSION() AS version');
    console.log('🔍 Database version:', version[0].version);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

testConnection();