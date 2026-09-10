import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { VideoNote } from '../models/VideoNote.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';

// GET /api/notes/video/:videoId - get notes for a specific video
export const getVideoNotes = async (
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

    // Find video by _id or youtubeVideoId to get canonical video._id
    const video = await Video.findOne({
      $or: [
        ...(mongoose.isValidObjectId(videoId) ? [{ _id: videoId }] : []),
        { youtubeVideoId: videoId },
      ],
    });
    const targetVideoId = video ? video._id : videoId;

    // Find notes for this user and video, ordered by timestamp ASC, createdAt ASC
    const notes = await VideoNote.find({ user: userId, video: targetVideoId }).sort({
      timestampSeconds: 1,
      createdAt: 1,
    });

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error('Error fetching video notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notes' });
  }
};

// Helper to sanitize tags
export const sanitizeTags = (rawTags: unknown): string[] => {
  if (!Array.isArray(rawTags)) return [];
  const set = new Set<string>();
  for (const item of rawTags) {
    if (typeof item === 'string') {
      const cleaned = item.trim().toLowerCase().replace(/^#+/, '');
      if (cleaned.length > 0 && cleaned.length <= 30) {
        set.add(cleaned);
      }
    }
  }
  return Array.from(set).slice(0, 10); // max 10 tags per note
};

// GET /api/notes - paginated, searchable, filterable notes
export const getNotes = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      page = '1',
      limit = '25',
      search = '',
      courseId,
      videoId,
      pinned,
      tag,
      sortBy = 'pinnedFirst',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    // Base filter scoped to authenticated user
    const filter: Record<string, unknown> = { user: userId };

    // Course filter
    if (courseId) {
      if (mongoose.isValidObjectId(courseId)) {
        filter.course = courseId;
      }
    }

    // Video filter
    if (videoId) {
      if (mongoose.isValidObjectId(videoId)) {
        filter.video = videoId;
      }
    }

    // Pinned filter
    if (pinned === 'true' || pinned === '1') {
      filter.isPinned = true;
    }

    // Tag filter
    if (tag && typeof tag === 'string') {
      filter.tags = tag.trim().toLowerCase();
    }

    // Text search in title, content, or tags
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Sort order
    let sortOptions: Record<string, 1 | -1> = { isPinned: -1, updatedAt: -1 };
    switch (sortBy) {
      case 'updated':
        sortOptions = { updatedAt: -1 };
        break;
      case 'created':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'title':
        sortOptions = { title: 1, updatedAt: -1 };
        break;
      case 'pinnedFirst':
      default:
        sortOptions = { isPinned: -1, updatedAt: -1 };
        break;
    }

    // Fetch notes and total count in parallel
    const [notes, total, totalPinned, allUserTags] = await Promise.all([
      VideoNote.find(filter)
        .populate('course', 'title thumbnail playlistId')
        .populate('video', 'title position durationSeconds isAvailable youtubeVideoId')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      VideoNote.countDocuments(filter),
      VideoNote.countDocuments({ user: userId, isPinned: true }),
      VideoNote.distinct('tags', { user: userId }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.json({
      success: true,
      notes,
      total,
      page: pageNum,
      totalPages,
      totalPinned,
      tags: allUserTags || [],
    });
  } catch (error) {
    console.error('Error fetching paginated notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notes' });
  }
};

// GET /api/notes/grouped - legacy grouped notes by Course -> Video (alias)
export const getAllUserNotes = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const notes = await VideoNote.find({ user: userId })
      .populate('course', 'title thumbnail')
      .populate('video', 'title position durationSeconds isAvailable')
      .sort({ timestampSeconds: 1, createdAt: 1 });

    // Group notes by course -> video
    const courseMap = new Map<
      string,
      {
        courseId: string;
        courseTitle: string;
        courseThumbnail?: string;
        videos: Map<
          string,
          {
            videoId: string;
            videoTitle: string;
            position: number;
            durationSeconds: number;
            isAvailable: boolean;
            notes: typeof notes;
          }
        >;
      }
    >();

    for (const note of notes) {
      const courseObj = note.course as unknown as {
        _id: mongoose.Types.ObjectId;
        title?: string;
        thumbnail?: string;
      };
      const videoObj = note.video as unknown as {
        _id: mongoose.Types.ObjectId;
        title?: string;
        position?: number;
        durationSeconds?: number;
        isAvailable?: boolean;
      };

      if (!courseObj?._id || !videoObj?._id) continue;

      const cId = courseObj._id.toString();
      const vId = videoObj._id.toString();

      if (!courseMap.has(cId)) {
        courseMap.set(cId, {
          courseId: cId,
          courseTitle: courseObj.title || 'Untitled Course',
          courseThumbnail: courseObj.thumbnail,
          videos: new Map(),
        });
      }

      const courseGroup = courseMap.get(cId)!;
      if (!courseGroup.videos.has(vId)) {
        courseGroup.videos.set(vId, {
          videoId: vId,
          videoTitle: videoObj.title || 'Untitled Video',
          position: videoObj.position || 0,
          durationSeconds: videoObj.durationSeconds || 0,
          isAvailable: videoObj.isAvailable !== false,
          notes: [],
        });
      }

      courseGroup.videos.get(vId)!.notes.push(note);
    }

    // Convert map to structured array
    const groupedCourses = Array.from(courseMap.values()).map((c) => ({
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      courseThumbnail: c.courseThumbnail,
      totalNotes: Array.from(c.videos.values()).reduce(
        (sum, v) => sum + v.notes.length,
        0
      ),
      videos: Array.from(c.videos.values())
        .sort((a, b) => a.position - b.position)
        .map((v) => ({
          videoId: v.videoId,
          videoTitle: v.videoTitle,
          position: v.position,
          durationSeconds: v.durationSeconds,
          isAvailable: v.isAvailable,
          notesCount: v.notes.length,
          notes: v.notes,
        })),
    }));

    res.json({
      success: true,
      totalNotes: notes.length,
      courses: groupedCourses,
    });
  } catch (error) {
    console.error('Error fetching all user notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user notes' });
  }
};

// POST /api/notes - create note
export const createNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      courseId,
      videoId,
      title,
      content,
      timestampSeconds,
      isPinned,
      tags,
    } = req.body;

    if (!courseId || !videoId) {
      res.status(400).json({
        success: false,
        message: 'courseId and videoId are required',
      });
      return;
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Note content cannot be empty',
      });
      return;
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 5000) {
      res.status(400).json({
        success: false,
        message: 'Note content cannot exceed 5000 characters',
      });
      return;
    }

    const trimmedTitle = typeof title === 'string' ? title.trim().slice(0, 200) : '';
    const cleanTags = sanitizeTags(tags);

    // Validate course exists (check _id or playlistId)
    const course = mongoose.isValidObjectId(courseId)
      ? await Course.findById(courseId)
      : await Course.findOne({ playlistId: courseId });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Validate video exists and belongs to course (Note: Video model field is courseId!)
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
        message: 'Video not found or does not belong to the specified course',
      });
      return;
    }

    // Validate timestampSeconds if provided
    let parsedTimestamp: number | null = null;
    if (timestampSeconds !== undefined && timestampSeconds !== null) {
      const parsed = Number(timestampSeconds);
      if (isNaN(parsed) || parsed < 0) {
        res.status(400).json({
          success: false,
          message: 'timestampSeconds must be a non-negative number',
        });
        return;
      }
      if (video.durationSeconds > 0 && parsed > video.durationSeconds + 10) {
        res.status(400).json({
          success: false,
          message: 'timestampSeconds cannot exceed video duration',
        });
        return;
      }
      parsedTimestamp = Math.floor(parsed);
    }

    const note = await VideoNote.create({
      user: userId,
      course: course._id,
      video: video._id,
      title: trimmedTitle,
      content: trimmedContent,
      timestampSeconds: parsedTimestamp,
      isPinned: Boolean(isPinned),
      tags: cleanTags,
    });

    const populatedNote = await VideoNote.findById(note._id)
      .populate('course', 'title thumbnail playlistId')
      .populate('video', 'title position durationSeconds isAvailable youtubeVideoId');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: populatedNote || note,
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, message: 'Failed to create note' });
  }
};

// PUT /api/notes/:noteId - update note
export const updateNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    const { noteId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const note = await VideoNote.findOne({ _id: noteId, user: userId });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    const { title, content, timestampSeconds, isPinned, tags } = req.body;

    if (title !== undefined) {
      note.title = typeof title === 'string' ? title.trim().slice(0, 200) : '';
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        res.status(400).json({
          success: false,
          message: 'Note content cannot be empty',
        });
        return;
      }
      const trimmed = content.trim();
      if (trimmed.length > 5000) {
        res.status(400).json({
          success: false,
          message: 'Note content cannot exceed 5000 characters',
        });
        return;
      }
      note.content = trimmed;
    }

    if (isPinned !== undefined) {
      note.isPinned = Boolean(isPinned);
    }

    if (tags !== undefined) {
      note.tags = sanitizeTags(tags);
    }

    if (timestampSeconds !== undefined) {
      if (timestampSeconds === null) {
        note.timestampSeconds = null;
      } else {
        const parsed = Number(timestampSeconds);
        if (isNaN(parsed) || parsed < 0) {
          res.status(400).json({
            success: false,
            message: 'timestampSeconds must be a non-negative number',
          });
          return;
        }
        note.timestampSeconds = Math.floor(parsed);
      }
    }

    await note.save();

    const populatedNote = await VideoNote.findById(note._id)
      .populate('course', 'title thumbnail playlistId')
      .populate('video', 'title position durationSeconds isAvailable youtubeVideoId');

    res.json({
      success: true,
      message: 'Note updated successfully',
      note: populatedNote || note,
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Failed to update note' });
  }
};

// PATCH /api/notes/:noteId/pin - toggle pin status
export const togglePinNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    const { noteId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const note = await VideoNote.findOne({ _id: noteId, user: userId });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    note.isPinned = !note.isPinned;
    await note.save();

    const populatedNote = await VideoNote.findById(note._id)
      .populate('course', 'title thumbnail playlistId')
      .populate('video', 'title position durationSeconds isAvailable youtubeVideoId');

    res.json({
      success: true,
      message: note.isPinned ? 'Note pinned' : 'Note unpinned',
      note: populatedNote || note,
      isPinned: note.isPinned,
    });
  } catch (error) {
    console.error('Error toggling note pin:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle pin' });
  }
};

// DELETE /api/notes/:noteId - delete note
export const deleteNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    const { noteId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const result = await VideoNote.deleteOne({ _id: noteId, user: userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};
