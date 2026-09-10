import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { Video, IVideo } from '../models/Video.js';
import { VideoProgress, IVideoProgress } from '../models/VideoProgress.js';

export interface CourseCompletionStats {
  courseProgressPercentage: number;
  completedVideos: number;
  totalAvailableVideos: number;
  courseCompleted: boolean;
}

/**
 * Helper to calculate course progress percentage and completion statistics.
 * Unavailable videos (isAvailable === false) are excluded from the completion denominator.
 */
export const getCourseCompletionStats = async (
  userId: string | mongoose.Types.ObjectId,
  courseId: string | mongoose.Types.ObjectId
): Promise<CourseCompletionStats> => {
  const allVideos = await Video.find(
    { courseId },
    '_id isAvailable durationSeconds position'
  );

  if (allVideos.length === 0) {
    return {
      courseProgressPercentage: 0,
      completedVideos: 0,
      totalAvailableVideos: 0,
      courseCompleted: false,
    };
  }

  // Unavailable videos are excluded from course completion requirement
  const availableVideos = allVideos.filter((v) => v.isAvailable !== false);
  const totalAvailableVideos = availableVideos.length;

  const progressRecords = await VideoProgress.find(
    { user: userId, course: courseId },
    'video progressPercentage completed'
  );

  const progressMap = new Map<
    string,
    { progressPercentage: number; completed: boolean }
  >();

  for (const record of progressRecords) {
    progressMap.set(record.video.toString(), {
      progressPercentage: record.progressPercentage || 0,
      completed: Boolean(record.completed),
    });
  }

  // Count completed available videos
  let completedVideos = 0;
  for (const v of availableVideos) {
    if (progressMap.get(v._id.toString())?.completed) {
      completedVideos++;
    }
  }

  // Course progress percentage:
  // Simple: based on completed videos out of total available videos.
  // Integer (never decimals). If at least 1 video completed, at least 1%.
  let courseProgressPercentage = 0;
  if (totalAvailableVideos > 0 && completedVideos > 0) {
    courseProgressPercentage = Math.min(
      100,
      Math.max(1, Math.round((completedVideos / totalAvailableVideos) * 100))
    );
  }

  const courseCompleted =
    totalAvailableVideos > 0 && completedVideos === totalAvailableVideos;

  if (courseCompleted) {
    courseProgressPercentage = 100;
  }

  return {
    courseProgressPercentage,
    completedVideos,
    totalAvailableVideos,
    courseCompleted,
  };
};

/**
 * Backward-compatible helper for calculating course progress percentage
 */
export const calculateCourseProgressPercentage = async (
  userId: string | mongoose.Types.ObjectId,
  courseId: string | mongoose.Types.ObjectId
): Promise<number> => {
  const stats = await getCourseCompletionStats(userId, courseId);
  return stats.courseProgressPercentage;
};

/**
 * GET /api/progress/course/:courseId
 * Retrieve progress for all videos in a course for the authenticated user,
 * including completed count, total available count, and overall course completion.
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

    const completionStats = await getCourseCompletionStats(userId, course._id);

    // Keep Course model's progressPercentage in sync
    if (course.progressPercentage !== completionStats.courseProgressPercentage) {
      await Course.updateOne(
        { _id: course._id },
        { $set: { progressPercentage: completionStats.courseProgressPercentage } }
      );
    }

    res.status(200).json({
      courseId: course._id,
      progress: progressRecords,
      ...completionStats,
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({ message: 'Failed to retrieve course progress' });
  }
};

/**
 * GET /api/progress/video/:videoId
 * Retrieve progress & completion state for a single video for the authenticated user
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
        completed: false,
        completedAt: null,
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
 * Upsert video playback progress, validate completion (90% threshold or onEnded),
 * preserve completion immutability and completedAt, and update course-level progress.
 */
export const updateVideoProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { videoId } = req.params;
    const { courseId, watchedSeconds, durationSeconds, isEnded } = req.body;

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

    // Check existing progress to guarantee completion immutability & completedAt preservation
    const existingProgress = await VideoProgress.findOne({
      user: userId,
      course: course._id,
      video: video._id,
    });

    // Completion Rule:
    // 1. If previously marked completed, it stays completed permanently
    // 2. If video reached the end (onEnded)
    // 3. If genuine playback reached 90% of duration (watchedSeconds / durationSeconds >= 0.90)
    //    OR user reached ending part (within 20s of end or >= 85% after skipping/watching)
    const isEndingPart =
      parsedDuration > 0 &&
      (clampedWatched / parsedDuration >= 0.85 ||
        clampedWatched >= Math.max(5, parsedDuration - 20));

    const isNowCompleted =
      Boolean(existingProgress?.completed) ||
      Boolean(isEnded) ||
      (parsedDuration > 0 && clampedWatched / parsedDuration >= 0.90) ||
      isEndingPart;

    const finalProgressPercentage = isNowCompleted ? 100 : progressPercentage;

    // completedAt timestamp: set once upon initial completion, never overwrite on subsequent watches
    let completedAt = existingProgress?.completedAt || null;
    if (isNowCompleted && !completedAt) {
      completedAt = new Date();
    }

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
          progressPercentage: finalProgressPercentage,
          completed: isNowCompleted,
          completedAt,
          lastWatchedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // Recalculate course statistics and update course progress percentage
    const completionStats = await getCourseCompletionStats(userId, course._id);

    await Course.updateOne(
      { _id: course._id },
      { $set: { progressPercentage: completionStats.courseProgressPercentage } }
    );

    res.status(200).json({
      progress: updatedProgress,
      ...completionStats,
    });
  } catch (error) {
    console.error('Update video progress error:', error);
    res.status(500).json({ message: 'Failed to update video progress' });
  }
};

/**
 * GET /api/progress/recent
 * Retrieve the most recently watched video & course for "Continue Learning".
 * If the most recent video is completed, automatically advances to the next incomplete available video.
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
      res.status(200).json({
        recent: null,
        targetVideo: null,
        nextVideo: null,
        courseCompleted: false,
      });
      return;
    }

    const courseId = recent.course._id;

    // Fetch all videos for this course sorted by position ASC
    const allCourseVideos = await Video.find({ courseId }).sort({ position: 1 });
    const availableVideos = allCourseVideos.filter(
      (v) => v.isAvailable !== false
    );

    // Fetch all progress records for this course to evaluate completions
    const courseProgress = await VideoProgress.find({
      user: userId,
      course: courseId,
    });

    const progressByVideoId = new Map<string, IVideoProgress>();
    for (const p of courseProgress) {
      progressByVideoId.set(p.video.toString(), p);
    }

    // Count completed available videos
    const totalAvailable = availableVideos.length;
    let completedAvailableCount = 0;
    for (const v of availableVideos) {
      if (progressByVideoId.get(v._id.toString())?.completed) {
        completedAvailableCount++;
      }
    }

    const courseCompleted =
      totalAvailable > 0 && completedAvailableCount === totalAvailable;

    const recentVideo = recent.video as unknown as IVideo;
    let targetVideo: IVideo = recentVideo;
    let nextVideo: IVideo | null = null;

    // If the recent video is completed, find the next incomplete available video
    if (recent.completed && !courseCompleted) {
      const currentPos = recentVideo.position;
      // Look for the next incomplete available video following current position
      const subsequentIncomplete = availableVideos.find(
        (v) =>
          v.position > currentPos &&
          !progressByVideoId.get(v._id.toString())?.completed
      );

      // If no subsequent incomplete video, wrap to the first incomplete available video
      const anyIncomplete =
        subsequentIncomplete ||
        availableVideos.find(
          (v) => !progressByVideoId.get(v._id.toString())?.completed
        );

      if (anyIncomplete) {
        targetVideo = anyIncomplete;
        nextVideo = anyIncomplete;
      }
    }

    res.status(200).json({
      recent,
      targetVideo,
      nextVideo,
      courseCompleted,
      completedVideos: completedAvailableCount,
      totalAvailableVideos: totalAvailable,
    });
  } catch (error) {
    console.error('Get recent progress error:', error);
    res.status(500).json({ message: 'Failed to retrieve recent progress' });
  }
};

