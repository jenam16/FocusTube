import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createCircle,
  getMyCircles,
  getJoinInfo,
  joinCircle,
  getCircleDetails,
  getCircleMembers,
  updateProgress,
  getDiscussions,
  createDoubt,
  replyDoubt,
  resolveDoubt,
  regenerateInviteCode,
  leaveCircle,
  deleteCircle,
} from '../controllers/studyCircleController.js';

const router = Router();

// Preview invitation (allow checking circle name/host/capacity before joining)
router.get('/join-info/:inviteCode', authenticate, getJoinInfo);

// Circle creation, listing & joining
router.post('/', authenticate, createCircle);
router.get('/', authenticate, getMyCircles);
router.post('/join', authenticate, joinCircle);

// Circle details & member progress
router.get('/:circleId', authenticate, getCircleDetails);
router.get('/:circleId/members', authenticate, getCircleMembers);
router.patch('/:circleId/progress', authenticate, updateProgress);

// Circle discussions & doubts
router.get('/:circleId/discussions', authenticate, getDiscussions);
router.post('/:circleId/discussions', authenticate, createDoubt);
router.post('/:circleId/discussions/:doubtId/replies', authenticate, replyDoubt);
router.patch('/:circleId/discussions/:doubtId/resolve', authenticate, resolveDoubt);

// Host invitation regeneration
router.post('/:circleId/regenerate-invite', authenticate, regenerateInviteCode);

// Leaving & Deletion
router.post('/:circleId/leave', authenticate, leaveCircle);
router.delete('/:circleId', authenticate, deleteCircle);

export default router;
