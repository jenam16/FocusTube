import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import {
  youtubeService,
  extractPlaylistId,
  YouTubeError,
} from '../services/youtubeService.js';

export const importCourse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { playlistUrl } = req.body;
    if (!playlistUrl || typeof playlistUrl !== 'string') {
      res
        .status(400)
        .json({ message: 'Please provide a valid YouTube playlist URL or ID.' });
      return;
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      res.status(400).json({
        message:
          'Invalid YouTube playlist URL or ID. Please check the URL and try again.',
      });
      return;
    }

    // 1. Check if playlist was already imported by this user
    const existingCourse = await Course.findOne({ userId, playlistId });
    if (existingCourse) {
      const videos = await Video.find({ courseId: existingCourse._id }).sort({
        position: 1,
      });

      res.status(200).json({
        course: existingCourse,
        videos,
        message: 'Course already exists in your library',
        isExisting: true,
      });
      return;
    }

    // 2. Fetch metadata & videos from YouTube Data API
    const playlistData = await youtubeService.fetchPlaylistData(playlistId);

    // 3. Create Course document
    const course = await Course.create({
      userId,
      playlistId: playlistData.playlistId,
      title: playlistData.title,
      description: playlistData.description,
      thumbnail: playlistData.thumbnail,
      channelName: playlistData.channelName,
      totalVideos: playlistData.totalVideos,
      totalDurationSeconds: playlistData.totalDurationSeconds,
    });

    // 4. Create Video documents
    const videoDocs = playlistData.videos.map((v) => ({
      courseId: course._id,
      youtubeVideoId: v.youtubeVideoId,
      title: v.title,
      thumbnail: v.thumbnail,
      durationSeconds: v.durationSeconds,
      position: v.position,
      isAvailable: v.isAvailable,
    }));

    const createdVideos =
      videoDocs.length > 0 ? await Video.insertMany(videoDocs) : [];

    res.status(201).json({
      course,
      videos: createdVideos,
      message: 'Course imported successfully',
      isExisting: false,
    });
  } catch (error) {
    if (error instanceof YouTubeError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error('Course import error:', error);
    res
      .status(500)
      .json({ message: 'Internal server error while importing playlist' });
  }
};

export const getCourses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const courses = await Course.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Failed to retrieve courses' });
  }
};

export const getCourseById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const course = await Course.findOne({ _id: id, userId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const videos = await Video.find({ courseId: course._id }).sort({
      position: 1,
    });

    res.status(200).json({ course, videos });
  } catch (error) {
    console.error('Get course by id error:', error);
    res.status(500).json({ message: 'Failed to retrieve course details' });
  }
};
