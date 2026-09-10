import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { VideoProgress } from '../models/VideoProgress.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import { Task } from '../models/Task.js';

// Calculate deterministic streaks from an array of activity dates (sorted DESC)
export const calculateStreaks = (
  activityDates: Date[]
): { currentStreak: number; longestStreak: number } => {
  if (!activityDates || activityDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Normalize all dates to unique YYYY-MM-DD UTC strings
  const dateSet = new Set<string>();
  for (const d of activityDates) {
    if (d && !isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      dateSet.add(`${year}-${month}-${day}`);
    }
  }

  const sortedDays = Array.from(dateSet).sort().reverse();
  if (sortedDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = new Date();
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;

  const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
  const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

  // Current streak check
  let currentStreak = 0;
  let cursorStr: string | null = null;

  if (sortedDays[0] === todayStr) {
    cursorStr = todayStr;
  } else if (sortedDays[0] === yesterdayStr) {
    cursorStr = yesterdayStr;
  }

  if (cursorStr) {
    let checkDate = new Date(`${cursorStr}T00:00:00Z`);
    for (const dayStr of sortedDays) {
      const expectedStr = `${checkDate.getUTCFullYear()}-${String(checkDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDate.getUTCDate()).padStart(2, '0')}`;
      if (dayStr === expectedStr) {
        currentStreak++;
        checkDate = new Date(Date.UTC(checkDate.getUTCFullYear(), checkDate.getUTCMonth(), checkDate.getUTCDate() - 1));
      } else if (dayStr < expectedStr) {
        break;
      }
    }
  }

  // Longest streak check across all sorted days
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  // Iterate chronologically (ascending)
  const ascendingDays = Array.from(sortedDays).reverse();
  for (const dayStr of ascendingDays) {
    const curDate = new Date(`${dayStr}T00:00:00Z`);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = curDate;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return { currentStreak, longestStreak };
};

// GET /api/analytics
export const getAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // 1. Fetch user's courses
    const courses = await Course.find({ user: userId });
    const totalCourses = courses.length;

    // 2. Fetch user's completed and in-progress video records
    const progressRecords = await VideoProgress.find({ user: userId });
    const completedVideosCount = progressRecords.filter((p) => p.completed).length;

    // 3. Find completed courses (all available videos completed)
    let completedCoursesCount = 0;
    const courseStatsList: Array<{
      courseId: string;
      title: string;
      completedVideos: number;
      totalAvailableVideos: number;
      completionPercentage: number;
      completed: boolean;
    }> = [];

    for (const course of courses) {
      const availableVideos = await Video.find({
        course: course._id,
        isAvailable: { $ne: false },
      });
      const totalAvailable = availableVideos.length;

      const courseProgress = progressRecords.filter(
        (p) => p.course.toString() === course._id.toString()
      );
      const completedInCourse = courseProgress.filter((p) => p.completed).length;

      const isCourseCompleted =
        totalAvailable > 0 && completedInCourse >= totalAvailable;

      if (isCourseCompleted) {
        completedCoursesCount++;
      }

      courseStatsList.push({
        courseId: course._id.toString(),
        title: course.title,
        completedVideos: completedInCourse,
        totalAvailableVideos: totalAvailable,
        completionPercentage:
          totalAvailable > 0
            ? Math.round((completedInCourse / totalAvailable) * 100)
            : 0,
        completed: isCourseCompleted,
      });
    }

    // 4. Fetch user tasks
    const tasks = await Task.find({ user: userId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 5. Build activity dates for Streak calculation
    // Collect dates from:
    // - Video completions (completedAt or updatedAt)
    // - Task completions (completedAt or updatedAt)
    const activityDates: Date[] = [];

    for (const p of progressRecords) {
      if (p.completed) {
        activityDates.push(p.completedAt || p.updatedAt || p.createdAt);
      }
    }

    for (const t of tasks) {
      if (t.completed) {
        activityDates.push(t.completedAt || t.updatedAt || t.date);
      }
    }

    const { currentStreak, longestStreak } = calculateStreaks(activityDates);

    // 6. Weekly completion breakdown (past 7 days)
    const now = new Date();
    const past7Days: Array<{
      date: string;
      label: string;
      videosCompleted: number;
      tasksCompleted: number;
    }> = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const label = dayNames[d.getUTCDay()];

      // Count completions on this date
      const videosCompleted = progressRecords.filter((p) => {
        if (!p.completed) return false;
        const compDate = p.completedAt || p.updatedAt;
        if (!compDate) return false;
        const pStr = `${compDate.getUTCFullYear()}-${String(compDate.getUTCMonth() + 1).padStart(2, '0')}-${String(compDate.getUTCDate()).padStart(2, '0')}`;
        return pStr === dateStr;
      }).length;

      const tasksCompleted = tasks.filter((t) => {
        if (!t.completed) return false;
        const tDate = t.completedAt || t.updatedAt || t.date;
        if (!tDate) return false;
        const tStr = `${tDate.getUTCFullYear()}-${String(tDate.getUTCMonth() + 1).padStart(2, '0')}-${String(tDate.getUTCDate()).padStart(2, '0')}`;
        return tStr === dateStr;
      }).length;

      past7Days.push({
        date: dateStr,
        label,
        videosCompleted,
        tasksCompleted,
      });
    }

    // 7. Deterministic Insights
    const insights: string[] = [];

    if (currentStreak > 0) {
      insights.push(
        `You are on a ${currentStreak}-day learning streak! Keep up the momentum.`
      );
    } else {
      insights.push(
        'Complete a lesson or daily task today to start your learning streak!'
      );
    }

    const weeklyVideos = past7Days.reduce((acc, d) => acc + d.videosCompleted, 0);
    const weeklyTasks = past7Days.reduce((acc, d) => acc + d.tasksCompleted, 0);

    if (weeklyVideos > 0) {
      insights.push(`You completed ${weeklyVideos} video lessons in the past 7 days.`);
    }

    if (weeklyTasks > 0) {
      insights.push(`You accomplished ${weeklyTasks} learning tasks this week.`);
    }

    // Top progressing course
    const mostActiveCourse = [...courseStatsList]
      .filter((c) => c.completedVideos > 0)
      .sort((a, b) => b.completedVideos - a.completedVideos)[0];

    if (mostActiveCourse) {
      insights.push(
        `Your most active course is "${mostActiveCourse.title}" with ${mostActiveCourse.completedVideos} lessons completed (${mostActiveCourse.completionPercentage}%).`
      );
    }

    if (completedCoursesCount > 0) {
      insights.push(
        `You have fully completed ${completedCoursesCount} course${completedCoursesCount > 1 ? 's' : ''}! Fantastic achievement.`
      );
    }

    res.json({
      success: true,
      data: {
        completedVideos: completedVideosCount,
        completedCourses: completedCoursesCount,
        totalCourses,
        currentStreak,
        longestStreak,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: taskCompletionRate,
        },
        weeklyActivity: past7Days,
        courseStats: courseStatsList,
        insights,
      },
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate analytics' });
  }
};
