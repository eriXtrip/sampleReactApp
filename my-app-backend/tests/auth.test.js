import request from 'supertest';
import app from '../app.js';
import pool from '../services/db.js';

describe('Registration Flow', () => {
  let testEmail = `test${Date.now()}@example.com`;
  let verificationCode;

  beforeAll(async () => {
    // Clear test data
    await pool.query('DELETE FROM registration_users WHERE email LIKE ?', ['test%@example.com']);
    await pool.query('DELETE FROM users WHERE email LIKE ?', ['test%@example.com']);
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Step 1: Start Registration', async () => {
    const res = await request(app)
      .post('/api/auth/start-registration')
      .send({
        email: testEmail,
        role: 'pupil',
        firstName: 'Test',
        lastName: 'User',
        gender: 'Male',
        birthDate: '2000-01-01',
        lrn: '123456789012'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Get the generated code
    const [rows] = await pool.query(
      'SELECT verification_code FROM registration_users WHERE email = ?',
      [testEmail]
    );
    verificationCode = rows[0].verification_code;
  });

  test('Step 2: Verify Code', async () => {
    const res = await request(app)
      .post('/api/auth/verify-code')
      .send({
        email: testEmail,
        code: verificationCode
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Step 3: Complete Registration', async () => {
    const res = await request(app)
      .post('/api/auth/complete-registration')
      .send({
        email: testEmail,
        password: 'TestPass123!'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify user exists in final table
    const [users] = await pool.query(
      'SELECT 1 FROM users WHERE email = ?',
      [testEmail]
    );
    expect(users.length).toBe(1);
  });
});