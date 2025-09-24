// my-app-backend/app.js  
// To start backend server: cd my-app-backend npm run dev 
// To stop backend serve: Ctrl + C

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  startRegistration,
  verifyCode,
  completeRegistration, 
  login,
  admin_confirm_login,
  logout,
  startPasswordReset,
  verifyResetCode,
  completePasswordReset,
  changePassword,
  secureFunction,
  vulnerableFunction,
} from './controllers/authController.js';
import {
  uploadFile,
  deleteFile,
  shareFile,
  generateDownloadLink,
  getFileMetadata,
} from './controllers/driveController.js';
import { 
  getPublicSubjects,
  getSectionsForSearch,
} from './controllers/search.js';
import config from './config.js';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = config.port;

// Setup file upload handling (limit to 10MB)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, 'Uploads');
import fsPromises from 'fs/promises';
fsPromises.mkdir(uploadDir, { recursive: true }).catch(err => {
  console.error('Failed to create uploads directory:', err);
});

const upload = multer({
  dest: 'Uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes (Auth)
app.post('/api/auth/start-registration', startRegistration);
app.post('/api/auth/verify-code', verifyCode);
app.post('/api/auth/complete-registration', completeRegistration);
app.post('/api/auth/login', login);
app.post('/api/auth/admin_confirm_login', admin_confirm_login);
app.post('/api/auth/logout', logout);
app.post('/api/auth/start-password-reset', startPasswordReset);
app.post('/api/auth/verify-reset-code', verifyResetCode);
app.post('/api/auth/complete-password-reset', completePasswordReset);
app.post('/api/auth/change-password', changePassword);
app.post('/api/auth/secure-function', secureFunction);
app.post('/api/auth/vulnerable-function', vulnerableFunction);


// Routes (Google Drive)
app.post('/api/drive/upload', upload.single('file'), uploadFile);
app.delete('/api/drive/delete/:id', deleteFile);
app.get('/api/drive/share/:id', shareFile);
app.get('/api/drive/download/:id', generateDownloadLink);
app.get('/api/drive/metadata/:id', getFileMetadata);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', db: config.db.database });
});

// Routes (Search / Public Content)
app.get('/api/search/subjects', getPublicSubjects);
app.get('/api/search/sections', getSectionsForSearch);

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