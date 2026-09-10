import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getCourseProgress,
  getVideoProgress,
  updateVideoProgress,
  getRecentProgress,
} from '../controllers/progressController.js';

const router = Router();

// All progress endpoints require authentication
router.use(authenticate);


// GET /api/progress/recent -> Most recent watched video for Continue Learning
router.get('/recent', getRecentProgress);

// GET /api/progress/course/:courseId -> All video progress for a course
router.get('/course/:courseId', getCourseProgress);

// GET /api/progress/video/:videoId -> Single video progress
router.get('/video/:videoId', getVideoProgress);

// PUT /api/progress/video/:videoId -> Upsert video progress & recalculate course progress
router.put('/video/:videoId', updateVideoProgress);

export default router;
