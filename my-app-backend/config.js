// config.js
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Load .env from specific path
dotenv.config({ path: path.join(__dirname, '.env') });

// 3. Add debug output
console.log('Loading DB config for:', process.env.DB_USER);

export default {
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' 
  },
  port: process.env.PORT,
  apiUrl: process.env.API_URL,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  port: process.env.PORT,
  environment: process.env.NODE_ENV,
};