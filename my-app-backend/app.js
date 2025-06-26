// my-app-backend/app.js
import express from 'express';
import cors from 'cors';
import { register } from './controllers/authController.js';
import config from './config.js';
import os from 'os';

const app = express();
const PORT = config.port || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/auth/register', register);

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