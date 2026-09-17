import { Router } from 'express';
import { getAIContext, sendChatMessage } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/context', authenticate, getAIContext);
router.post('/chat', authenticate, sendChatMessage);

export default router;
