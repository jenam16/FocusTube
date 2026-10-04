import { Router } from 'express';
import { getAIContext, sendChatMessage, getVideoSummary } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/context', authenticate, getAIContext);
router.post('/chat', authenticate, sendChatMessage);
router.post('/videos/:videoId/summary', authenticate, getVideoSummary);
router.get('/videos/:videoId/summary', authenticate, getVideoSummary);

export default router;
