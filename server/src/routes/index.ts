import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import courseRoutes from './courseRoutes.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);

export default router;
