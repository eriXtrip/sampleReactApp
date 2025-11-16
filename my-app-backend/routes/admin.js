// my-app-backend/routes/admin.js

import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { 
  getTotalLessonsCount, 
  getSubjectSummary, 
  getSubjectUsers, 
  getSubjectLessonsAndContents,
  getTeachersWithSections
 } from '../controllers/adminDashboard.js';
import { uploadLesson } from '../controllers/AdminUpload.js';
import { upload } from '../middleware/upload.js'; // ✅ Import Multer instance

const router = express.Router();

// Dashboard routes
router.get('/lessons/count', authenticateToken, getTotalLessonsCount);
router.get('/subjects/summary', authenticateToken, getSubjectSummary);
router.get('/subjects/users', authenticateToken, getSubjectUsers);
router.get('/subjects/lessons', authenticateToken, getSubjectLessonsAndContents);
router.get('/teachers/sections', authenticateToken, getTeachersWithSections);


// Lesson upload route
router.post(
  '/lessons/upload',
  authenticateToken,
  upload.fields([
    { name: 'fileInput', maxCount: 1 },   // PDF/PPT
    { name: 'videoInput', maxCount: 1 },   // Video
    { name: 'imagequiz_images[]', maxCount: 50 } //image quiz images
  ]),
  uploadLesson
);

export default router;
