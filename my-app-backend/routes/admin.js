// my-app-backend/routes/admin.js

import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { 
    getTotalLessonsCount,
    getSubjectSummary,
    getSubjectUsers
} from '../controllers/adminDashboard.js';

const router = express.Router();

router.get('/lessons/count', authenticateToken, getTotalLessonsCount);
router.get('/subjects/summary', authenticateToken, getSubjectSummary);
router.get('/subjects/users', authenticateToken, getSubjectUsers);

export default router;