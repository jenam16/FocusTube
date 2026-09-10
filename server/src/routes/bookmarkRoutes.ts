import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getBookmarks,
  getCourseBookmarks,
  addBookmark,
  removeBookmark,
} from '../controllers/bookmarkController.js';

const router = Router();

router.use(authenticate);

router.get('/', getBookmarks);
router.get('/course/:courseId', getCourseBookmarks);
router.post('/', addBookmark);
router.delete('/video/:videoId', removeBookmark);

export default router;
