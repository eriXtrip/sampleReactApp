// my-app-backend/app.js  
// To start backend server: cd my-app-backend npm run dev 
// To stop backend serve: Ctrl + C

import express from 'express';
import cors from 'cors';
import { 
  startRegistration,
  verifyCode,
  completeRegistration, 
  login,
  logout,
  startPasswordReset,
  verifyResetCode,
  completePasswordReset,
  changePassword
} from './controllers/authController.js';
import config from './config.js';
import os from 'os';

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/auth/start-registration', startRegistration);
app.post('/api/auth/verify-code', verifyCode);
app.post('/api/auth/complete-registration', completeRegistration);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.post('/api/auth/start-password-reset', startPasswordReset);
app.post('/api/auth/verify-reset-code', verifyResetCode);
app.post('/api/auth/complete-password-reset', completePasswordReset);
app.post('/api/auth/change-password', changePassword);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', db: config.db.database });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running:`);
  console.log(`- Local:  http://localhost:${PORT}`);
  console.log(`- Network: http://${getLocalIp()}:${PORT}`);
});

// Updated network interface check using ES Modules
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.values(interfaces)) {
    for (const net of name) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Handle process termination
process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('MySQL pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  pool.end(() => {
    console.log('MySQL pool closed');
    process.exit(0);
  });
});

export default app;