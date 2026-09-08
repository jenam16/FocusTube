import { Router } from 'express';
import {
  importCourse,
  getCourses,
  getCourseById,
  getCourseVideos,
  getCourseVideoById,
} from '../controllers/courseController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/import', authenticate, importCourse);
router.get('/', authenticate, getCourses);
router.get('/:id', authenticate, getCourseById);
router.get('/:courseId/videos', authenticate, getCourseVideos);
router.get('/:courseId/videos/:videoId', authenticate, getCourseVideoById);

export default router;
