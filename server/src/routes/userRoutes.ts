import { Router } from 'express';
import { syncUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/sync', authenticate, syncUser);

export default router;
