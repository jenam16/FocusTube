import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Task } from '../models/Task.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';

// Helper to parse YYYY-MM-DD string into UTC midnight Date
export const parseDateToUtcMidnight = (dateStr?: unknown): Date => {
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    const [y, m, d] = dateStr.trim().split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }
  const fallback = new Date();
  fallback.setUTCHours(0, 0, 0, 0);
  return fallback;
};

// Helper to format Date to YYYY-MM-DD
export const formatDateToUtcString = (date: Date): string => {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// GET /api/tasks - list tasks for user with optional date, date range, or status filters
export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { date, from, to, status } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = { user: userId };

    if (date) {
      const targetDate = parseDateToUtcMidnight(date);
      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      filter.date = { $gte: targetDate, $lt: nextDay };
    } else if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) {
        dateFilter.$gte = parseDateToUtcMidnight(from);
      }
      if (to) {
        const toDate = parseDateToUtcMidnight(to);
        toDate.setUTCDate(toDate.getUTCDate() + 1);
        dateFilter.$lt = toDate;
      }
      filter.date = dateFilter;
    }

    if (status === 'completed') {
      filter.completed = true;
    } else if (status === 'pending') {
      filter.completed = false;
    }

    const tasks = await Task.find(filter)
      .populate('course', 'title thumbnail')
      .populate('video', 'title position durationSeconds isAvailable youtubeVideoId')
      .sort({ date: 1, createdAt: 1 })
      .lean();

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

// GET /api/tasks/overdue - get all incomplete tasks where date < today
export const getOverdueTasks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    const tasks = await Task.find({
      user: userId,
      completed: false,
      date: { $lt: todayMidnight },
    })
      .populate('course', 'title thumbnail')
      .populate('video', 'title position durationSeconds isAvailable youtubeVideoId')
      .sort({ date: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch overdue tasks' });
  }
};

// GET /api/tasks/upcoming-summary - date summaries for tomorrow and upcoming 30 days
export const getUpcomingSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const tomorrow = new Date();
    tomorrow.setUTCHours(0, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const futureEnd = new Date(tomorrow);
    futureEnd.setUTCDate(futureEnd.getUTCDate() + 30);

    const tasks = await Task.find({
      user: userId,
      date: { $gte: tomorrow, $lt: futureEnd },
    })
      .sort({ date: 1 })
      .lean();

    // Group tasks by date string
    const map = new Map<string, { totalTasks: number; completedTasks: number }>();
    for (const t of tasks) {
      const dateStr = formatDateToUtcString(t.date);
      if (!map.has(dateStr)) {
        map.set(dateStr, { totalTasks: 0, completedTasks: 0 });
      }
      const entry = map.get(dateStr)!;
      entry.totalTasks++;
      if (t.completed) entry.completedTasks++;
    }

    const summaries = Array.from(map.entries()).map(([date, data]) => ({
      date,
      totalTasks: data.totalTasks,
      completedTasks: data.completedTasks,
      completionPercentage:
        data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0,
    }));

    res.json({
      success: true,
      summaries,
    });
  } catch (error) {
    console.error('Error fetching upcoming summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming summary' });
  }
};

// GET /api/tasks/history-summary - date summaries for past dates (paginated by dates)
export const getHistorySummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = 15; // 15 past dates per page

    // Find distinct past dates for this user
    const pastTasks = await Task.find({
      user: userId,
      date: { $lt: todayMidnight },
    })
      .sort({ date: -1 })
      .lean();

    // Group by date
    const map = new Map<string, { totalTasks: number; completedTasks: number }>();
    for (const t of pastTasks) {
      const dateStr = formatDateToUtcString(t.date);
      if (!map.has(dateStr)) {
        map.set(dateStr, { totalTasks: 0, completedTasks: 0 });
      }
      const entry = map.get(dateStr)!;
      entry.totalTasks++;
      if (t.completed) entry.completedTasks++;
    }

    const allDateSummaries = Array.from(map.entries()).map(([date, data]) => ({
      date,
      totalTasks: data.totalTasks,
      completedTasks: data.completedTasks,
      completionPercentage:
        data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0,
    }));

    const totalDates = allDateSummaries.length;
    const totalPages = Math.ceil(totalDates / limit) || 1;
    const paginatedSummaries = allDateSummaries.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      summaries: paginatedSummaries,
      totalDates,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching history summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history summary' });
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

    const { title, date, courseId, videoId, priority, description } = req.body;
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

    const plannedDate = parseDateToUtcMidnight(date);

    // Validate course and video if provided
    let validatedCourseId: mongoose.Types.ObjectId | null = null;
    let validatedVideoId: mongoose.Types.ObjectId | null = null;

    if (courseId) {
      if (!mongoose.isValidObjectId(courseId)) {
        res.status(400).json({ success: false, message: 'Invalid courseId' });
        return;
      }
      const course = await Course.findOne({ _id: courseId, user: userId });
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      validatedCourseId = course._id;

      if (videoId) {
        if (!mongoose.isValidObjectId(videoId)) {
          res.status(400).json({ success: false, message: 'Invalid videoId' });
          return;
        }
        const video = await Video.findOne({ _id: videoId, courseId: course._id });
        if (!video) {
          res.status(404).json({
            success: false,
            message: 'Video not found or does not belong to specified course',
          });
          return;
        }
        validatedVideoId = video._id;
      }
    }

    const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
    const trimmedDesc = typeof description === 'string' ? description.trim().slice(0, 1000) : '';

    const task = await Task.create({
      user: userId,
      title: trimmed,
      description: trimmedDesc,
      course: validatedCourseId,
      video: validatedVideoId,
      priority: validPriority,
      completed: false,
      completedAt: null,
      date: plannedDate,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('course', 'title thumbnail')
      .populate('video', 'title position durationSeconds isAvailable youtubeVideoId');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask || task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

// PUT /api/tasks/:taskId - update task
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

    const { title, completed, date, priority, description, courseId, videoId } = req.body;

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

    if (date !== undefined) {
      task.date = parseDateToUtcMidnight(date);
    }

    if (priority !== undefined) {
      if (['low', 'medium', 'high'].includes(priority)) {
        task.priority = priority;
      }
    }

    if (description !== undefined) {
      task.description = typeof description === 'string' ? description.trim().slice(0, 1000) : '';
    }

    if (courseId !== undefined) {
      if (!courseId) {
        task.course = null;
        task.video = null;
      } else {
        if (!mongoose.isValidObjectId(courseId)) {
          res.status(400).json({ success: false, message: 'Invalid courseId' });
          return;
        }
        const course = await Course.findOne({ _id: courseId, user: userId });
        if (!course) {
          res.status(404).json({ success: false, message: 'Course not found' });
          return;
        }
        task.course = course._id;
      }
    }

    if (videoId !== undefined) {
      if (!videoId) {
        task.video = null;
      } else if (task.course) {
        if (!mongoose.isValidObjectId(videoId)) {
          res.status(400).json({ success: false, message: 'Invalid videoId' });
          return;
        }
        const video = await Video.findOne({ _id: videoId, courseId: task.course });
        if (!video) {
          res.status(404).json({
            success: false,
            message: 'Video not found or does not belong to specified course',
          });
          return;
        }
        task.video = video._id;
      }
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('course', 'title thumbnail')
      .populate('video', 'title position durationSeconds isAvailable youtubeVideoId');

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: populatedTask || task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

// PATCH /api/tasks/:taskId/reschedule - quick reschedule endpoint
export const rescheduleTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { taskId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { date } = req.body;
    if (!date) {
      res.status(400).json({ success: false, message: 'New date is required' });
      return;
    }

    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    task.date = parseDateToUtcMidnight(date);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('course', 'title thumbnail')
      .populate('video', 'title position durationSeconds isAvailable youtubeVideoId');

    res.json({
      success: true,
      message: 'Task rescheduled successfully',
      task: populatedTask || task,
    });
  } catch (error) {
    console.error('Error rescheduling task:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule task' });
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

