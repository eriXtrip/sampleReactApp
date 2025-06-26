// SAMPLEREACTAPP/testRegister.js
import { UserProvider } from './contexts/UserContext.jsx';
import { pool } from './my-app-backend/services/db.js';

async function testRegistration() {
  const userProvider = new UserProvider({ children: null });
  
  try {
    const result = await userProvider.register(
      1, // role
      'Test',
      'Middle',
      'User',
      'Jr',
      'Male',
      '2000-01-01',
      '123456789012',
      null, // teacher_id
      'jedt@example.com',
    );

    if (result.success) {
      console.log('✅ Registration successful! User ID:', result.userId);
      
      const [users] = await pool.query(
        'SELECT * FROM registration_users WHERE user_id = ?', 
        [result.userId]
      );
      
      console.log(users.length > 0 ? '✅ User found in DB' : '❌ User not in DB');
    } else {
      console.log('❌ Registration failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testRegistration();