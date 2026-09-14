import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getTasks,
  getOverdueTasks,
  getUpcomingSummary,
  getHistorySummary,
  createTask,
  updateTask,
  rescheduleTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = Router();

router.use(authenticate);

router.get('/overdue', getOverdueTasks);
router.get('/upcoming-summary', getUpcomingSummary);
router.get('/history-summary', getHistorySummary);
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:taskId', updateTask);
router.patch('/:taskId/reschedule', rescheduleTask);
router.delete('/:taskId', deleteTask);

export default router;

