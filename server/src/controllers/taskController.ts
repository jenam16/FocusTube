import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Task } from '../models/Task.js';

// GET /api/tasks - list tasks for authenticated user
export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const tasks = await Task.find({ user: userId }).sort({ date: -1, createdAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;

    res.json({
      success: true,
      tasks,
      summary: {
        totalTasks,
        completedTasks,
        completionPercentage:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

// POST /api/tasks - create a new task
export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, message: 'Task title is required' });
      return;
    }

    const trimmed = title.trim();
    if (trimmed.length > 200) {
      res.status(400).json({
        success: false,
        message: 'Task title cannot exceed 200 characters',
      });
      return;
    }

    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    const task = await Task.create({
      user: userId,
      title: trimmed,
      completed: false,
      completedAt: null,
      date: todayMidnight,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

// PUT /api/tasks/:taskId - update task title or completion state
export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { taskId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const { title, completed } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        res.status(400).json({ success: false, message: 'Task title cannot be empty' });
        return;
      }
      const trimmed = title.trim();
      if (trimmed.length > 200) {
        res.status(400).json({
          success: false,
          message: 'Task title cannot exceed 200 characters',
        });
        return;
      }
      task.title = trimmed;
    }

    if (completed !== undefined) {
      const isCompleted = Boolean(completed);
      task.completed = isCompleted;
      task.completedAt = isCompleted ? new Date() : null;
    }

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

// DELETE /api/tasks/:taskId - delete a task
export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { taskId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const result = await Task.deleteOne({ _id: taskId, user: userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};
