import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import courseRoutes from './courseRoutes.js';
import progressRoutes from './progressRoutes.js';
import taskRoutes from './taskRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import noteRoutes from './noteRoutes.js';
import bookmarkRoutes from './bookmarkRoutes.js';
import aiRoutes from './aiRoutes.js';

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
router.use('/progress', progressRoutes);
router.use('/tasks', taskRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notes', noteRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/ai', aiRoutes);

export default router;


