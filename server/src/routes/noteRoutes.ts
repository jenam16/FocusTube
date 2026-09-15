import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotes,
  getVideoNotes,
  getAllUserNotes,
  createNote,
  createScreenshotNote,
  updateNote,
  togglePinNote,
  deleteNote,
} from '../controllers/noteController.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotes);
router.get('/grouped', getAllUserNotes);
router.get('/video/:videoId', getVideoNotes);
router.post('/', createNote);
router.post('/screenshot', createScreenshotNote);
router.put('/:noteId', updateNote);
router.patch('/:noteId/pin', togglePinNote);
router.delete('/:noteId', deleteNote);

export default router;

