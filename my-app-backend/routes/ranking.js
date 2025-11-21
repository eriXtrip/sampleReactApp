// my-app-backend/routes/ranking.js
import express from 'express';
import { getOverallRanking } from '../controllers/ranking.js';

const router = express.Router();

router.get('/overall', getOverallRanking);

export default router;
