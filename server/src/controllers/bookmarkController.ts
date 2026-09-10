import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { VideoBookmark } from '../models/VideoBookmark.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';

// GET /api/bookmarks - list all bookmarks of user
export const getBookmarks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const bookmarks = await VideoBookmark.find({ user: userId })
      .populate('course', 'title thumbnail')
      .populate('video', 'title position durationSeconds isAvailable')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookmarks,
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks' });
  }
};

// GET /api/bookmarks/course/:courseId - get videoIds bookmarked in this course
export const getCourseBookmarks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    const { courseId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const targetCourse = mongoose.isValidObjectId(courseId)
      ? await Course.findById(courseId)
      : await Course.findOne({ playlistId: courseId });

    const targetCourseId = targetCourse ? targetCourse._id : courseId;

    const bookmarks = await VideoBookmark.find({
      user: userId,
      course: targetCourseId,
    }).select('video');

    const bookmarkedVideoIds = bookmarks.map((b) => b.video.toString());

    res.json({
      success: true,
      bookmarkedVideoIds,
    });
  } catch (error) {
    console.error('Error fetching course bookmarks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course bookmarks' });
  }
};

// POST /api/bookmarks - add bookmark
export const addBookmark = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { courseId, videoId } = req.body;
    if (!courseId || !videoId) {
      res.status(400).json({
        success: false,
        message: 'courseId and videoId are required',
      });
      return;
    }

    // Verify course exists (check _id or playlistId)
    const course = mongoose.isValidObjectId(courseId)
      ? await Course.findById(courseId)
      : await Course.findOne({ playlistId: courseId });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Verify video exists and belongs to course (Note: Video model field is courseId!)
    const video = await Video.findOne({
      $or: [
        ...(mongoose.isValidObjectId(videoId) ? [{ _id: videoId }] : []),
        { youtubeVideoId: videoId },
      ],
      courseId: course._id,
    });

    if (!video) {
      res.status(404).json({
        success: false,
        message: 'Video not found or does not belong to specified course',
      });
      return;
    }

    // Check if already bookmarked
    const existing = await VideoBookmark.findOne({
      user: userId,
      video: video._id,
    });

    if (existing) {
      res.json({
        success: true,
        message: 'Video already bookmarked',
        bookmark: existing,
      });
      return;
    }

    const bookmark = await VideoBookmark.create({
      user: userId,
      course: course._id,
      video: video._id,
    });

    res.status(201).json({
      success: true,
      message: 'Video bookmarked successfully',
      bookmark,
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ success: false, message: 'Failed to add bookmark' });
  }
};

// DELETE /api/bookmarks/video/:videoId - remove bookmark
export const removeBookmark = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    const { videoId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const video = await Video.findOne({
      $or: [
        ...(mongoose.isValidObjectId(videoId) ? [{ _id: videoId }] : []),
        { youtubeVideoId: videoId },
      ],
    });
    const targetVideoId = video ? video._id : videoId;

    const result = await VideoBookmark.deleteOne({
      user: userId,
      video: targetVideoId,
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Bookmark not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ success: false, message: 'Failed to remove bookmark' });
  }
};
