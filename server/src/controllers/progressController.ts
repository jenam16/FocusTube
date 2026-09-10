import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import { VideoProgress } from '../models/VideoProgress.js';

/**
 * Helper to calculate course progress percentage based on all course videos
 */
export const calculateCourseProgressPercentage = async (
  userId: string | mongoose.Types.ObjectId,
  courseId: string | mongoose.Types.ObjectId
): Promise<number> => {
  const allVideos = await Video.find({ courseId }, '_id');
  if (allVideos.length === 0) return 0;

  const progressRecords = await VideoProgress.find(
    { user: userId, course: courseId },
    'video progressPercentage'
  );

  const progressMap = new Map<string, number>();
  for (const record of progressRecords) {
    progressMap.set(record.video.toString(), record.progressPercentage || 0);
  }

  const totalSum = allVideos.reduce((acc, v) => {
    return acc + (progressMap.get(v._id.toString()) || 0);
  }, 0);

  return Math.min(100, Math.max(0, Math.round(totalSum / allVideos.length)));
};

/**
 * GET /api/progress/course/:courseId
 * Retrieve progress for all videos in a course for the authenticated user
 */
export const getCourseProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const course = await Course.findOne({ _id: courseId, userId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const progressRecords = await VideoProgress.find({
      user: userId,
      course: course._id,
    }).sort({ updatedAt: -1 });

    const courseProgressPercentage = await calculateCourseProgressPercentage(
      userId,
      course._id
    );

    // Keep Course model's progressPercentage in sync
    if (course.progressPercentage !== courseProgressPercentage) {
      await Course.updateOne(
        { _id: course._id },
        { $set: { progressPercentage: courseProgressPercentage } }
      );
    }

    res.status(200).json({
      courseId: course._id,
      progress: progressRecords,
      courseProgressPercentage,
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({ message: 'Failed to retrieve course progress' });
  }
};

/**
 * GET /api/progress/video/:videoId
 * Retrieve progress for a single video for the authenticated user
 */
export const getVideoProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { videoId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const videoQuery = mongoose.Types.ObjectId.isValid(videoId)
      ? { $or: [{ _id: videoId }, { youtubeVideoId: videoId }] }
      : { youtubeVideoId: videoId };

    const video = await Video.findOne(videoQuery);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Verify course belongs to this user
    const course = await Course.findOne({ _id: video.courseId, userId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const progress = await VideoProgress.findOne({
      user: userId,
      video: video._id,
    });

    if (!progress) {
      res.status(200).json({
        videoId: video._id,
        courseId: video.courseId,
        watchedSeconds: 0,
        durationSeconds: video.durationSeconds || 0,
        progressPercentage: 0,
        lastWatchedAt: null,
      });
      return;
    }

    res.status(200).json({
      progress,
    });
  } catch (error) {
    console.error('Get video progress error:', error);
    res.status(500).json({ message: 'Failed to retrieve video progress' });
  }
};

/**
 * PUT /api/progress/video/:videoId
 * Upsert video playback progress and update course-level progress
 */
export const updateVideoProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { videoId } = req.params;
    const { courseId, watchedSeconds, durationSeconds } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ message: 'Valid courseId is required' });
      return;
    }

    const course = await Course.findOne({ _id: courseId, userId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const videoQuery = mongoose.Types.ObjectId.isValid(videoId)
      ? {
          $or: [{ _id: videoId }, { youtubeVideoId: videoId }],
          courseId: course._id,
        }
      : { youtubeVideoId: videoId, courseId: course._id };

    const video = await Video.findOne(videoQuery);
    if (!video) {
      res.status(404).json({ message: 'Video not found in this course' });
      return;
    }

    const parsedWatched = Math.max(0, Number(watchedSeconds) || 0);
    const parsedDuration = Math.max(
      0,
      Number(durationSeconds) || video.durationSeconds || 0
    );

    // Clamp watchedSeconds to durationSeconds
    const clampedWatched =
      parsedDuration > 0
        ? Math.min(parsedWatched, parsedDuration)
        : parsedWatched;

    const progressPercentage =
      parsedDuration > 0
        ? Math.min(100, Math.max(0, Math.round((clampedWatched / parsedDuration) * 100)))
        : 0;

    const updatedProgress = await VideoProgress.findOneAndUpdate(
      {
        user: userId,
        course: course._id,
        video: video._id,
      },
      {
        $set: {
          watchedSeconds: Math.round(clampedWatched * 10) / 10,
          durationSeconds: Math.round(parsedDuration * 10) / 10,
          progressPercentage,
          lastWatchedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // Recalculate course progress
    const courseProgressPercentage = await calculateCourseProgressPercentage(
      userId,
      course._id
    );

    await Course.updateOne(
      { _id: course._id },
      { $set: { progressPercentage: courseProgressPercentage } }
    );

    res.status(200).json({
      progress: updatedProgress,
      courseProgressPercentage,
    });
  } catch (error) {
    console.error('Update video progress error:', error);
    res.status(500).json({ message: 'Failed to update video progress' });
  }
};

/**
 * GET /api/progress/recent
 * Retrieve the most recently watched video & course for "Continue Learning"
 */
export const getRecentProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const recent = await VideoProgress.findOne({ user: userId })
      .sort({ lastWatchedAt: -1 })
      .populate({
        path: 'course',
        select:
          'title description thumbnail channelName totalVideos totalDurationSeconds progressPercentage playlistId',
      })
      .populate({
        path: 'video',
        select:
          'title thumbnail durationSeconds position youtubeVideoId isAvailable',
      });

    if (!recent || !recent.course || !recent.video) {
      res.status(200).json({ recent: null });
      return;
    }

    res.status(200).json({ recent });
  } catch (error) {
    console.error('Get recent progress error:', error);
    res.status(500).json({ message: 'Failed to retrieve recent progress' });
  }
};
