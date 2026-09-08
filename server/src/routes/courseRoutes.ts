import { Router } from 'express';
import {
  importCourse,
  getCourses,
  getCourseById,
} from '../controllers/courseController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/import', authenticate, importCourse);
router.get('/', authenticate, getCourses);
router.get('/:id', authenticate, getCourseById);

export default router;
