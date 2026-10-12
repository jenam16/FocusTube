import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import {
  StudyCircle,
  IStudyCircle,
  ISnapshotVideo,
  IPlaylistSnapshot,
} from '../models/StudyCircle.js';
import {
  StudyCircleMembership,
  IStudyCircleMembership,
} from '../models/StudyCircleMembership.js';
import {
  StudyCircleDiscussion,
  IStudyCircleDiscussion,
} from '../models/StudyCircleDiscussion.js';
import {
  generateInviteCode,
  hashInviteCode,
  calculateCircleProgress,
} from '../utils/studyCircle.js';
import { emitToCircle } from '../services/socketService.js';
import { VideoProgress } from '../models/VideoProgress.js';
import { getCourseCompletionStats } from './progressController.js';

import { syncMemberProgressWithCourse } from '../utils/studyCircleSync.js';
export { syncMemberProgressWithCourse };

// ==========================================
// 1. Create a Study Circle
// ==========================================
export const createCircle = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { name, description } = req.body;
    const rawCourseId = req.body.courseId || req.body.sourceCourseId;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Circle name is required (max 100 characters)' });
      return;
    }

    if (name.trim().length > 100) {
      res.status(400).json({ message: 'Circle name must be 100 characters or fewer' });
      return;
    }

    if (!rawCourseId || typeof rawCourseId !== 'string' || !rawCourseId.trim()) {
      res.status(400).json({ message: 'Source playlist/course is required' });
      return;
    }

    const courseId = rawCourseId.trim();
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ message: 'Invalid source course ID format' });
      return;
    }

    // Verify course exists and belongs to the authenticated user
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: 'Selected course not found' });
      return;
    }

    if (course.userId.toString() !== userId.toString()) {
      res.status(403).json({ message: 'You can only create a study circle from your own courses' });
      return;
    }

    // Fetch ordered available videos for fixed snapshot
    const videos = await Video.find({
      courseId: course._id,
      isAvailable: { $ne: false },
    }).sort({ position: 1 });

    if (videos.length === 0) {
      res.status(400).json({ message: 'Selected course contains no playable video lessons' });
      return;
    }

    // Construct immutable playlist snapshot
    const snapshotVideos: ISnapshotVideo[] = videos.map((v) => ({
      videoId: v._id.toString(),
      youtubeVideoId: v.youtubeVideoId,
      title: v.title,
      thumbnail: v.thumbnail || '',
      durationSeconds: v.durationSeconds || 0,
      position: v.position,
    }));

    const playlistSnapshot: IPlaylistSnapshot = {
      sourceCourseId: course._id,
      playlistId: course.playlistId,
      title: course.title,
      description: course.description || '',
      thumbnail: course.thumbnail || '',
      channelName: course.channelName || '',
      totalVideos: snapshotVideos.length,
      totalDurationSeconds:
        course.totalDurationSeconds ||
        snapshotVideos.reduce((acc, v) => acc + v.durationSeconds, 0),
      videos: snapshotVideos,
    };

    // Generate secure unpredictable invite code & SHA-256 hash
    const { rawCode, codeHash } = generateInviteCode();

    // Create Circle
    const circle = await StudyCircle.create({
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      hostId: userId,
      sourceCourseId: course._id,
      memberCount: 1,
      inviteCodeHash: codeHash,
      playlistSnapshot,
    });

    // Create Host Membership
    const hostMembership = await StudyCircleMembership.create({
      circleId: circle._id,
      userId,
      role: 'host',
      currentVideoId: snapshotVideos[0]?.videoId || '',
      positionSeconds: 0,
      completedVideoIds: [],
      completedVideosCount: 0,
      progressPercentage: 0,
      lastActiveAt: new Date(),
    });

    // Reconcile host's existing FocusTube course progress into hostMembership
    const syncedHostMembership = await syncMemberProgressWithCourse(
      userId,
      circle,
      hostMembership
    );

    const inviteUrl = `${config.frontendUrl}/study-circles/join/${rawCode}`;

    res.status(201).json({
      success: true,
      circle,
      inviteCode: rawCode,
      inviteUrl,
      myMembership: syncedHostMembership,
    });
  } catch (error) {
    console.error('Error creating study circle:', error);
    res.status(500).json({ message: 'Failed to create study circle' });
  }
};

// ==========================================
// 2. List Circles Current User Belongs To
// ==========================================
export const getMyCircles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const memberships = await StudyCircleMembership.find({ userId })
      .populate({
        path: 'circleId',
        populate: { path: 'hostId', select: 'name email avatar' },
      })
      .sort({ updatedAt: -1 });

    // Reconcile requesting user's progress across all their circles
    for (const m of memberships) {
      if (m.circleId) {
        const c = m.circleId as unknown as IStudyCircle;
        await syncMemberProgressWithCourse(userId, c, m);
      }
    }

    // Query this user's personal courses once for efficient lookup
    const userCourses = await Course.find({ userId }).select('_id playlistId');
    const userPlaylistIds = new Set(userCourses.map((c) => c.playlistId));
    const userCourseByPlaylistId = new Map(
      userCourses.map((c) => [c.playlistId, c._id.toString()])
    );

    // Fetch source course playlistIds for all circles to handle snapshots that may not have stored playlistId
    const sourceCourseIds = memberships
      .map((m) => (m.circleId as unknown as IStudyCircle)?.sourceCourseId)
      .filter((id) => Boolean(id));

    const sourceCourses =
      sourceCourseIds.length > 0
        ? await Course.find({ _id: { $in: sourceCourseIds } }).select('_id playlistId')
        : [];

    const sourceCoursePlaylistMap = new Map<string, string>();
    for (const sc of sourceCourses) {
      if (sc.playlistId) {
        sourceCoursePlaylistMap.set(sc._id.toString(), sc.playlistId);
      }
    }

    const circles = memberships
      .filter((m) => m.circleId !== null)
      .map((m) => {
        const c = m.circleId as unknown as IStudyCircle;
        const isHost =
          m.role === 'host' ||
          (c.hostId &&
            ((c.hostId as any)._id?.toString() === userId.toString() ||
              (c.hostId as any).toString() === userId.toString()));

        let isAddedToCourses = Boolean(isHost);
        let personalCourseId: string | null = isHost
          ? c.sourceCourseId?.toString() || null
          : null;

        if (!isHost) {
          const candidateIds = [
            c.playlistSnapshot?.playlistId,
            c.sourceCourseId ? sourceCoursePlaylistMap.get(c.sourceCourseId.toString()) : undefined,
            c.sourceCourseId ? `circle_snapshot_${c.sourceCourseId}` : undefined,
            `circle_snapshot_${c._id}`,
          ].filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

          const matchedPlaylistId = candidateIds.find((id) => userPlaylistIds.has(id));
          if (matchedPlaylistId) {
            isAddedToCourses = true;
            personalCourseId = userCourseByPlaylistId.get(matchedPlaylistId) || null;
          }
        }

        return {
          _id: c._id,
          name: c.name,
          description: c.description,
          host: c.hostId,
          isHost,
          role: m.role,
          memberCount: c.memberCount,
          maxMembers: 5,
          courseTitle: c.playlistSnapshot?.title || '',
          courseThumbnail: c.playlistSnapshot?.thumbnail || '',
          totalVideos: c.playlistSnapshot?.totalVideos || 0,
          myProgressPercentage: m.progressPercentage,
          myCompletedVideosCount: m.completedVideosCount,
          isAddedToCourses,
          personalCourseId,
          lastActiveAt: m.lastActiveAt,
          createdAt: c.createdAt,
        };
      });

    res.json({ success: true, circles });
  } catch (error) {
    console.error('Error fetching study circles:', error);
    res.status(500).json({ message: 'Failed to fetch study circles' });
  }
};

// ==========================================
// 3. Preview Invitation (Check capacity & info)
// ==========================================
export const getJoinInfo = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { inviteCode } = req.params;
    if (!inviteCode) {
      res.status(400).json({ message: 'Invitation code required' });
      return;
    }

    const codeHash = hashInviteCode(inviteCode);
    const circle = await StudyCircle.findOne({ inviteCodeHash: codeHash }).populate(
      'hostId',
      'name avatar'
    );

    if (!circle) {
      res.status(404).json({ message: 'Invalid or expired invitation' });
      return;
    }

    let isAlreadyMember = false;
    if (req.user?._id) {
      isAlreadyMember = !!(await StudyCircleMembership.exists({
        circleId: circle._id,
        userId: req.user._id,
      }));
    }

    const host = circle.hostId as any;

    res.json({
      success: true,
      circle: {
        _id: circle._id,
        name: circle.name,
        description: circle.description,
        hostName: host?.name || 'Study Circle Host',
        hostAvatar: host?.avatar || null,
        courseTitle: circle.playlistSnapshot.title,
        courseThumbnail: circle.playlistSnapshot.thumbnail,
        totalVideos: circle.playlistSnapshot.totalVideos,
        memberCount: circle.memberCount,
        maxMembers: 5,
        isFull: circle.memberCount >= 5,
        isAlreadyMember,
      },
    });
  } catch (error) {
    console.error('Error previewing invitation:', error);
    res.status(500).json({ message: 'Failed to preview invitation' });
  }
};

// ==========================================
// 4. Join a Circle (Concurrency-safe 5-member limit)
// ==========================================
export const joinCircle = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { inviteCode } = req.body;
    if (!inviteCode || typeof inviteCode !== 'string') {
      res.status(400).json({ message: 'Invitation code required' });
      return;
    }

    const codeHash = hashInviteCode(inviteCode);
    const circle = await StudyCircle.findOne({ inviteCodeHash: codeHash });

    if (!circle) {
      res.status(404).json({ message: 'Invalid or expired invitation' });
      return;
    }

    // Check if already a member
    const existingMembership = await StudyCircleMembership.findOne({
      circleId: circle._id,
      userId,
    });

    if (existingMembership) {
      res.status(409).json({
        message: 'You are already a member of this study circle',
        circleId: circle._id,
      });
      return;
    }

    // Atomic capacity increment: guarantees memberCount < 5 under concurrent joins
    const updatedCircle = await StudyCircle.findOneAndUpdate(
      {
        _id: circle._id,
        memberCount: { $lt: 5 },
      },
      {
        $inc: { memberCount: 1 },
      },
      { new: true }
    );

    if (!updatedCircle) {
      res.status(409).json({ message: 'Circle is full (maximum 5 members reached)' });
      return;
    }

    try {
      // Create independent membership for this new member
      const initialVideoId =
        circle.playlistSnapshot.videos[0]?.videoId || '';

      const membership = await StudyCircleMembership.create({
        circleId: circle._id,
        userId,
        role: 'member',
        currentVideoId: initialVideoId,
        positionSeconds: 0,
        completedVideoIds: [],
        completedVideosCount: 0,
        progressPercentage: 0,
        lastActiveAt: new Date(),
      });

      // Reconcile new member's existing FocusTube course progress (if any in their account)
      const syncedMembership = await syncMemberProgressWithCourse(
        userId,
        circle,
        membership
      );

      // Notify other room subscribers in realtime
      emitToCircle(circle._id.toString(), 'circle:member:joined', {
        member: {
          userId: userId.toString(),
          name: req.user?.name,
          avatar: req.user?.avatar,
          role: 'member',
          progressPercentage: syncedMembership.progressPercentage,
          completedVideosCount: syncedMembership.completedVideosCount,
          lastActiveAt: new Date(),
        },
        memberCount: updatedCircle.memberCount,
      });

      res.status(201).json({
        success: true,
        circleId: circle._id,
        membership: syncedMembership,
      });
    } catch (createErr) {
      // Rollback atomic memberCount increment if membership creation fails
      await StudyCircle.updateOne(
        { _id: circle._id },
        { $inc: { memberCount: -1 } }
      );
      throw createErr;
    }
  } catch (error) {
    console.error('Error joining study circle:', error);
    res.status(500).json({ message: 'Failed to join study circle' });
  }
};

// ==========================================
// 5. Fetch Authorized Circle Details & Snapshot
// ==========================================
export const getCircleDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify membership authorization
    const membership = await StudyCircleMembership.findOne({
      circleId,
      userId,
    });

    if (!membership) {
      res.status(403).json({ message: 'You must be a member of this circle to view its details' });
      return;
    }

    const circle = await StudyCircle.findById(circleId).populate(
      'hostId',
      'name avatar email'
    );

    if (!circle) {
      res.status(404).json({ message: 'Study circle not found' });
      return;
    }

    // Reconcile requesting user's membership with their course progress
    const syncedMembership = await syncMemberProgressWithCourse(
      userId,
      circle,
      membership
    );

    const hostIdStr =
      (circle.hostId as any)?._id?.toString() ||
      circle.hostId?.toString();

    const isHost =
      syncedMembership.role === 'host' ||
      (Boolean(hostIdStr) && hostIdStr === userId.toString());

    let isAddedToCourses = Boolean(isHost);
    let personalCourseId: string | null = isHost
      ? circle.sourceCourseId ? circle.sourceCourseId.toString() : null
      : null;

    if (!isHost) {
      const sourceCourse = circle.sourceCourseId
        ? await Course.findById(circle.sourceCourseId).select('playlistId')
        : null;

      const candidatePlaylistIds = [
        circle.playlistSnapshot?.playlistId,
        sourceCourse?.playlistId,
        circle.sourceCourseId ? `circle_snapshot_${circle.sourceCourseId}` : undefined,
        `circle_snapshot_${circle._id}`,
      ].filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

      const personalCourse = await Course.findOne({
        userId,
        playlistId: { $in: candidatePlaylistIds },
      }).select('_id playlistId');

      if (personalCourse) {
        isAddedToCourses = true;
        personalCourseId = personalCourse._id.toString();

        if (!circle.playlistSnapshot?.playlistId && personalCourse.playlistId) {
          await StudyCircle.updateOne(
            { _id: circle._id },
            { $set: { 'playlistSnapshot.playlistId': personalCourse.playlistId } }
          );
        }
      }
    }

    res.json({
      success: true,
      circle,
      myMembership: syncedMembership,
      isHost,
      isAddedToCourses,
      personalCourseId,
    });
  } catch (error) {
    console.error('Error fetching circle details:', error);
    res.status(500).json({ message: 'Failed to fetch circle details' });
  }
};

// ==========================================
// 6. Fetch Circle Members & Shared Progress
// ==========================================
export const getCircleMembers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify requesting user is an active member
    const isMember = await StudyCircleMembership.exists({ circleId, userId });
    if (!isMember) {
      res.status(403).json({ message: 'Access denied: circle membership required' });
      return;
    }

    const circle = await StudyCircle.findById(circleId);
    if (!circle) {
      res.status(404).json({ message: 'Study circle not found' });
      return;
    }

    const memberships = await StudyCircleMembership.find({ circleId })
      .populate('userId', 'name avatar')
      .sort({ role: 1, joinedAt: 1 });

    // Sync each member's progress independently
    for (const m of memberships) {
      const memberUserId = (m.userId as any)?._id || m.userId;
      if (memberUserId) {
        await syncMemberProgressWithCourse(memberUserId, circle, m);
      }
    }

    const members = memberships.map((m) => {
      const u = m.userId as any;
      return {
        _id: m._id,
        userId: u?._id?.toString() || '',
        name: u?.name || 'Fellow Learner',
        avatar: u?.avatar || null,
        role: m.role,
        currentVideoId: m.currentVideoId,
        positionSeconds: m.positionSeconds,
        completedVideosCount: m.completedVideosCount,
        progressPercentage: m.progressPercentage,
        lastActiveAt: m.lastActiveAt,
        joinedAt: m.joinedAt,
      };
    });

    res.json({ success: true, members });
  } catch (error) {
    console.error('Error fetching circle members:', error);
    res.status(500).json({ message: 'Failed to fetch circle members' });
  }
};

// ==========================================
// 7. Save Member's Independent Playback & Progress
// ==========================================
export const updateProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;
    const { videoId, positionSeconds, completed } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify member
    const membership = await StudyCircleMembership.findOne({ circleId, userId });
    if (!membership) {
      res.status(403).json({ message: 'Access denied: not a member of this circle' });
      return;
    }

    // Verify circle snapshot contains this videoId
    const circle = await StudyCircle.findById(circleId);
    if (!circle) {
      res.status(404).json({ message: 'Study circle not found' });
      return;
    }

    const snapshot = circle.playlistSnapshot;
    const validVideo = snapshot.videos.find(
      (v) => v.videoId === videoId || v.youtubeVideoId === videoId
    );

    if (!validVideo) {
      res.status(400).json({ message: 'Invalid video for this study circle snapshot' });
      return;
    }

    const targetVideoId = validVideo.videoId;
    membership.currentVideoId = targetVideoId;
    if (typeof positionSeconds === 'number' && positionSeconds >= 0) {
      membership.positionSeconds = Math.round(positionSeconds);
    }

    if (completed === true && !membership.completedVideoIds.includes(targetVideoId)) {
      membership.completedVideoIds.push(targetVideoId);
    } else if (completed === false && membership.completedVideoIds.includes(targetVideoId)) {
      membership.completedVideoIds = membership.completedVideoIds.filter(
        (id) => id !== targetVideoId
      );
    }

    membership.completedVideosCount = membership.completedVideoIds.length;
    membership.progressPercentage = calculateCircleProgress(
      membership.completedVideosCount,
      snapshot.videos.length
    );
    membership.lastActiveAt = new Date();

    await membership.save();

    // -----------------------------------------------------------------
    // Two-Way Sync: Update FocusTube VideoProgress & Course progress
    // -----------------------------------------------------------------
    try {
      const sourceCourse = circle.sourceCourseId
        ? await Course.findById(circle.sourceCourseId)
        : null;

      const effectivePlaylistId =
        circle.playlistSnapshot?.playlistId || sourceCourse?.playlistId;

      const targetCourses: mongoose.Types.ObjectId[] = [];
      if (sourceCourse && sourceCourse.userId.toString() === userId.toString()) {
        targetCourses.push(sourceCourse._id);
      } else if (effectivePlaylistId) {
        const userCopies = await Course.find({
          userId,
          playlistId: effectivePlaylistId,
        }).select('_id');
        for (const uc of userCopies) {
          targetCourses.push(uc._id);
        }
      }

      // If user has no Course document yet (joined someone else's circle without importing),
      // track VideoProgress under sourceCourseId for this user
      if (targetCourses.length === 0 && circle.sourceCourseId) {
        targetCourses.push(circle.sourceCourseId);
      }

      for (const courseId of targetCourses) {
        // Find corresponding Video in this course
        let courseVideo = await Video.findOne({
          courseId,
          youtubeVideoId: validVideo.youtubeVideoId,
        });

        if (!courseVideo) {
          courseVideo = await Video.findById(validVideo.videoId);
        }

        if (courseVideo) {
          const duration =
            courseVideo.durationSeconds || validVideo.durationSeconds || 0;
          const watched =
            typeof positionSeconds === 'number' && positionSeconds >= 0
              ? Math.min(positionSeconds, duration > 0 ? duration : positionSeconds)
              : 0;

          if (completed === true) {
            const existing = await VideoProgress.findOne({
              user: userId,
              course: courseId,
              video: courseVideo._id,
            });

            await VideoProgress.findOneAndUpdate(
              {
                user: userId,
                course: courseId,
                video: courseVideo._id,
              },
              {
                $set: {
                  watchedSeconds: watched > 0 ? watched : duration,
                  durationSeconds: duration,
                  progressPercentage: 100,
                  completed: true,
                  completedAt: existing?.completedAt || new Date(),
                  lastWatchedAt: new Date(),
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } else if (completed === false) {
            await VideoProgress.findOneAndUpdate(
              {
                user: userId,
                course: courseId,
                video: courseVideo._id,
              },
              {
                $set: {
                  completed: false,
                  completedAt: null,
                  progressPercentage:
                    duration > 0
                      ? Math.min(99, Math.round((watched / duration) * 100))
                      : 0,
                  lastWatchedAt: new Date(),
                },
              }
            );
          } else if (typeof positionSeconds === 'number' && positionSeconds >= 0) {
            // Update playback position
            const pct =
              duration > 0
                ? Math.min(99, Math.max(0, Math.round((watched / duration) * 100)))
                : 0;

            await VideoProgress.findOneAndUpdate(
              {
                user: userId,
                course: courseId,
                video: courseVideo._id,
              },
              {
                $set: {
                  watchedSeconds: Math.round(watched * 10) / 10,
                  durationSeconds: duration,
                  progressPercentage: pct,
                  lastWatchedAt: new Date(),
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }

          // If this user owns this Course, recalculate course completion stats and update Course.progressPercentage
          const isCourseOwner = await Course.exists({ _id: courseId, userId });
          if (isCourseOwner) {
            const stats = await getCourseCompletionStats(userId, courseId);
            await Course.updateOne(
              { _id: courseId },
              { $set: { progressPercentage: stats.courseProgressPercentage } }
            );
          }
        }
      }
    } catch (syncErr) {
      console.warn('[StudyCircle] Background course progress sync warning:', syncErr);
    }

    // Broadcast updated progress to circle room in realtime
    emitToCircle(circleId, 'circle:progress:updated', {
      userId: userId.toString(),
      currentVideoId: membership.currentVideoId,
      positionSeconds: membership.positionSeconds,
      completedVideosCount: membership.completedVideosCount,
      progressPercentage: membership.progressPercentage,
      lastActiveAt: membership.lastActiveAt,
    });

    res.json({
      success: true,
      membership,
    });
  } catch (error) {
    console.error('Error updating circle progress:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
};

// ==========================================
// 8. Retrieve Doubts and Discussion Threads
// ==========================================
export const getDiscussions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify membership authorization
    const isMember = await StudyCircleMembership.exists({ circleId, userId });
    if (!isMember) {
      res.status(403).json({ message: 'Access denied: circle membership required' });
      return;
    }

    // Fetch discussions with author info
    const allDiscussions = await StudyCircleDiscussion.find({ circleId })
      .populate('authorId', 'name avatar')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: 1 })
      .lean();

    // Group replies into their parent root doubts
    const rootDoubts: any[] = [];
    const repliesMap = new Map<string, any[]>();

    for (const item of allDiscussions) {
      if (item.parentId) {
        const parentKey = item.parentId.toString();
        if (!repliesMap.has(parentKey)) {
          repliesMap.set(parentKey, []);
        }
        repliesMap.get(parentKey)!.push(item);
      } else {
        rootDoubts.push(item);
      }
    }

    // Attach sorted replies
    const formatted = rootDoubts.map((doubt) => ({
      ...doubt,
      replies: repliesMap.get(doubt._id.toString()) || [],
    }));

    res.json({ success: true, discussions: formatted });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Failed to fetch discussions' });
  }
};

// ==========================================
// 9. Create a Root Doubt
// ==========================================
export const createDoubt = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;
    const { title, body, videoId, videoTitle, timestampSeconds } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!body || typeof body !== 'string' || !body.trim()) {
      res.status(400).json({ message: 'Doubt description / body is required' });
      return;
    }

    if (body.trim().length > 2000) {
      res.status(400).json({ message: 'Doubt body must be 2000 characters or fewer' });
      return;
    }

    // Verify membership
    const isMember = await StudyCircleMembership.exists({ circleId, userId });
    if (!isMember) {
      res.status(403).json({ message: 'Access denied: not a member of this circle' });
      return;
    }

    // Verify circle snapshot
    const circle = await StudyCircle.findById(circleId);
    if (!circle) {
      res.status(404).json({ message: 'Study circle not found' });
      return;
    }

    let validVideoId: string | undefined = undefined;
    let validVideoTitle: string | undefined = undefined;

    if (videoId) {
      const match = circle.playlistSnapshot.videos.find((v) => v.videoId === videoId);
      if (match) {
        validVideoId = match.videoId;
        validVideoTitle = match.title;
      }
    }

    const discussion = await StudyCircleDiscussion.create({
      circleId,
      authorId: userId,
      title: title && typeof title === 'string' ? title.trim().slice(0, 150) : undefined,
      body: body.trim(),
      videoId: validVideoId,
      videoTitle: validVideoTitle || (typeof videoTitle === 'string' ? videoTitle.trim() : undefined),
      timestampSeconds:
        typeof timestampSeconds === 'number' && timestampSeconds >= 0
          ? Math.round(timestampSeconds)
          : undefined,
      parentId: null,
      isResolved: false,
    });

    const populated = await StudyCircleDiscussion.findById(discussion._id)
      .populate('authorId', 'name avatar')
      .lean();

    const formatted = { ...populated, replies: [] };

    // Broadcast to circle
    emitToCircle(circleId, 'circle:doubt:created', { discussion: formatted });

    res.status(201).json({ success: true, discussion: formatted });
  } catch (error) {
    console.error('Error creating doubt:', error);
    res.status(500).json({ message: 'Failed to post doubt' });
  }
};

// ==========================================
// 10. Reply to a Doubt
// ==========================================
export const replyDoubt = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId, doubtId } = req.params;
    const { body } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!body || typeof body !== 'string' || !body.trim()) {
      res.status(400).json({ message: 'Reply content is required' });
      return;
    }

    if (body.trim().length > 2000) {
      res.status(400).json({ message: 'Reply must be 2000 characters or fewer' });
      return;
    }

    // Verify membership
    const isMember = await StudyCircleMembership.exists({ circleId, userId });
    if (!isMember) {
      res.status(403).json({ message: 'Access denied: not a member of this circle' });
      return;
    }

    // Verify parent doubt exists and belongs strictly to this circle
    const parentDoubt = await StudyCircleDiscussion.findById(doubtId);
    if (!parentDoubt || parentDoubt.circleId.toString() !== circleId) {
      res.status(404).json({ message: 'Root doubt not found in this circle' });
      return;
    }

    // Ensure replying to a root doubt, not a nested reply
    const rootId = parentDoubt.parentId ? parentDoubt.parentId : parentDoubt._id;

    const reply = await StudyCircleDiscussion.create({
      circleId,
      authorId: userId,
      body: body.trim(),
      parentId: rootId,
      isResolved: false,
    });

    const populated = await StudyCircleDiscussion.findById(reply._id)
      .populate('authorId', 'name avatar')
      .lean();

    // Broadcast to circle
    emitToCircle(circleId, 'circle:doubt:replied', {
      rootDoubtId: rootId.toString(),
      reply: populated,
    });

    res.status(201).json({ success: true, reply: populated });
  } catch (error) {
    console.error('Error replying to doubt:', error);
    res.status(500).json({ message: 'Failed to post reply' });
  }
};

// ==========================================
// 11. Resolve or Reopen a Doubt
// ==========================================
export const resolveDoubt = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId, doubtId } = req.params;
    const { isResolved } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const membership = await StudyCircleMembership.findOne({ circleId, userId });
    if (!membership) {
      res.status(403).json({ message: 'Access denied: not a member of this circle' });
      return;
    }

    const doubt = await StudyCircleDiscussion.findById(doubtId);
    if (!doubt || doubt.circleId.toString() !== circleId) {
      res.status(404).json({ message: 'Doubt not found in this circle' });
      return;
    }

    // Authorization rule: Host of the circle OR the author of the doubt
    const isHost = membership.role === 'host';
    const isAuthor = doubt.authorId.toString() === userId.toString();

    if (!isHost && !isAuthor) {
      res.status(403).json({
        message: 'Only the circle host or the doubt author can mark doubts as resolved',
      });
      return;
    }

    const shouldResolve = typeof isResolved === 'boolean' ? isResolved : !doubt.isResolved;

    doubt.isResolved = shouldResolve;
    doubt.resolvedBy = shouldResolve ? userId : null;
    doubt.resolvedAt = shouldResolve ? new Date() : null;

    await doubt.save();

    const populated = await StudyCircleDiscussion.findById(doubt._id)
      .populate('authorId', 'name avatar')
      .populate('resolvedBy', 'name')
      .lean();

    // Broadcast resolution
    emitToCircle(circleId, 'circle:doubt:resolved', {
      doubtId: doubt._id.toString(),
      isResolved: doubt.isResolved,
      resolvedBy: populated?.resolvedBy,
      resolvedAt: doubt.resolvedAt,
    });

    res.json({ success: true, discussion: populated });
  } catch (error) {
    console.error('Error resolving doubt:', error);
    res.status(500).json({ message: 'Failed to resolve doubt' });
  }
};

// ==========================================
// 12. Regenerate / Rotate Invitation Code (Host Only)
// ==========================================
export const regenerateInviteCode = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const membership = await StudyCircleMembership.findOne({ circleId, userId });
    if (!membership || membership.role !== 'host') {
      res.status(403).json({ message: 'Only the host can regenerate the invitation link' });
      return;
    }

    const circle = await StudyCircle.findById(circleId);
    if (!circle) {
      res.status(404).json({ message: 'Circle not found' });
      return;
    }

    const { rawCode, codeHash } = generateInviteCode();
    circle.inviteCodeHash = codeHash;
    await circle.save();

    const inviteUrl = `${config.frontendUrl}/study-circles/join/${rawCode}`;

    res.json({
      success: true,
      inviteCode: rawCode,
      inviteUrl,
    });
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    res.status(500).json({ message: 'Failed to regenerate invite code' });
  }
};

// ==========================================
// 13. Leave a Study Circle
// ==========================================
export const leaveCircle = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const membership = await StudyCircleMembership.findOne({ circleId, userId });
    if (!membership) {
      res.status(404).json({ message: 'Membership not found' });
      return;
    }

    if (membership.role === 'host') {
      res.status(400).json({
        message: 'The host cannot leave the circle. You can delete the circle if you wish to close it.',
      });
      return;
    }

    // Delete member's record
    await StudyCircleMembership.deleteOne({ _id: membership._id });

    // Atomically decrement circle's memberCount
    const updatedCircle = await StudyCircle.findOneAndUpdate(
      { _id: circleId, memberCount: { $gt: 1 } },
      { $inc: { memberCount: -1 } },
      { new: true }
    );

    // Broadcast member left
    emitToCircle(circleId, 'circle:member:left', {
      userId: userId.toString(),
      memberCount: updatedCircle?.memberCount || 1,
    });

    res.json({ success: true, message: 'You have left the study circle' });
  } catch (error) {
    console.error('Error leaving circle:', error);
    res.status(500).json({ message: 'Failed to leave circle' });
  }
};

// ==========================================
// 14. Delete a Study Circle (Host Only)
// ==========================================
export const deleteCircle = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const circle = await StudyCircle.findById(circleId);
    if (!circle) {
      res.status(404).json({ message: 'Study circle not found' });
      return;
    }

    if (circle.hostId.toString() !== userId.toString()) {
      res.status(403).json({ message: 'Only the host can delete this study circle' });
      return;
    }

    // Cascade delete memberships and discussions
    await StudyCircleMembership.deleteMany({ circleId });
    await StudyCircleDiscussion.deleteMany({ circleId });
    await StudyCircle.deleteOne({ _id: circleId });

    res.json({ success: true, message: 'Study circle deleted successfully' });
  } catch (error) {
    console.error('Error deleting circle:', error);
    res.status(500).json({ message: 'Failed to delete study circle' });
  }
};

// ==========================================
// 15. Add Circle Playlist to Member's Personal Courses
// ==========================================
export const addCircleToCourses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { circleId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(circleId)) {
      res.status(400).json({ message: 'Invalid circle ID format' });
      return;
    }

    // Verify requester is an active member of this circle
    const membership = await StudyCircleMembership.findOne({ circleId, userId });
    if (!membership) {
      res.status(403).json({
        message: 'Access denied: you must be an active member of this circle to add its playlist',
      });
      return;
    }

    const circle = await StudyCircle.findById(circleId);
    if (!circle) {
      res.status(404).json({ message: 'Study circle not found' });
      return;
    }

    // Host check: Host created circle from their existing course; do not duplicate
    const hostIdStr =
      (circle.hostId as any)?._id?.toString() ||
      circle.hostId?.toString();

    if (hostIdStr === userId.toString()) {
      res.status(400).json({
        success: false,
        isHost: true,
        alreadyAdded: true,
        isAddedToCourses: true,
        courseId: circle.sourceCourseId,
        message: 'You are the host and already own the original course in your library',
      });
      return;
    }

    const snapshot = circle.playlistSnapshot;
    if (!snapshot || !Array.isArray(snapshot.videos) || snapshot.videos.length === 0) {
      res.status(400).json({ message: 'This study circle has no playlist videos to import' });
      return;
    }

    // Determine stable playlist ID and candidates
    const sourceCourse = circle.sourceCourseId
      ? await Course.findById(circle.sourceCourseId).select('playlistId')
      : null;

    const candidatePlaylistIds = [
      snapshot.playlistId,
      sourceCourse?.playlistId,
      circle.sourceCourseId ? `circle_snapshot_${circle.sourceCourseId}` : undefined,
      `circle_snapshot_${circle._id}`,
    ].filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

    const playlistId =
      snapshot.playlistId ||
      sourceCourse?.playlistId ||
      `circle_snapshot_${circle.sourceCourseId}`;

    // 1. Duplicate check: Check if user ALREADY has this course in their personal library
    const existingCourse = await Course.findOne({
      userId,
      playlistId: { $in: candidatePlaylistIds },
    });
    if (existingCourse) {
      // Reconcile member progress with existing course
      await syncMemberProgressWithCourse(userId, circle, membership);

      if (!circle.playlistSnapshot?.playlistId && existingCourse.playlistId) {
        await StudyCircle.updateOne(
          { _id: circle._id },
          { $set: { 'playlistSnapshot.playlistId': existingCourse.playlistId } }
        );
      }

      res.status(200).json({
        success: true,
        alreadyAdded: true,
        isAddedToCourses: true,
        courseId: existingCourse._id,
        courseTitle: existingCourse.title,
        progressPercentage: existingCourse.progressPercentage,
        message: 'This course is already in your personal library',
      });
      return;
    }

    // 2. Create the personal Course document for this member
    let newCourse;
    try {
      newCourse = await Course.create({
        userId,
        playlistId,
        title: snapshot.title,
        description: snapshot.description || '',
        thumbnail: snapshot.thumbnail || '',
        channelName: snapshot.channelName || '',
        totalVideos: snapshot.totalVideos || snapshot.videos.length,
        totalDurationSeconds: snapshot.totalDurationSeconds || 0,
        progressPercentage: membership.progressPercentage || 0,
      });
    } catch (createErr: any) {
      // Handle race condition duplicate key error (code 11000)
      if (createErr.code === 11000) {
        const raceCourse = await Course.findOne({
          userId,
          playlistId: { $in: candidatePlaylistIds },
        });
        if (raceCourse) {
          res.status(200).json({
            success: true,
            alreadyAdded: true,
            isAddedToCourses: true,
            courseId: raceCourse._id,
            courseTitle: raceCourse.title,
            progressPercentage: raceCourse.progressPercentage,
            message: 'This course is already in your personal library',
          });
          return;
        }
      }
      throw createErr;
    }

    // 3. Create Video documents for this member's new course copy
    const videoDocs = snapshot.videos.map((sv) => ({
      courseId: newCourse._id,
      youtubeVideoId: sv.youtubeVideoId,
      title: sv.title,
      thumbnail: sv.thumbnail || '',
      durationSeconds: sv.durationSeconds || 0,
      position: sv.position,
      isAvailable: true,
    }));

    const createdVideos =
      videoDocs.length > 0 ? await Video.insertMany(videoDocs) : [];

    // 4. Synchronize any existing progress from Study Circle to the new course
    const completedSnapshotIdSet = new Set<string>(membership.completedVideoIds || []);
    const progressDocs = [];

    for (const cv of createdVideos) {
      const matchingSv = snapshot.videos.find(
        (sv) => sv.youtubeVideoId === cv.youtubeVideoId || sv.position === cv.position
      );

      const isCompleted =
        matchingSv && completedSnapshotIdSet.has(matchingSv.videoId);

      const isCurrent =
        matchingSv && matchingSv.videoId === membership.currentVideoId;

      if (isCompleted) {
        progressDocs.push({
          user: userId,
          course: newCourse._id,
          video: cv._id,
          watchedSeconds: cv.durationSeconds || matchingSv?.durationSeconds || 0,
          durationSeconds: cv.durationSeconds || matchingSv?.durationSeconds || 0,
          progressPercentage: 100,
          completed: true,
          completedAt: new Date(),
          lastWatchedAt: new Date(),
        });
      } else if (isCurrent && membership.positionSeconds > 0) {
        const duration = cv.durationSeconds || matchingSv?.durationSeconds || 0;
        progressDocs.push({
          user: userId,
          course: newCourse._id,
          video: cv._id,
          watchedSeconds: membership.positionSeconds,
          durationSeconds: duration,
          progressPercentage:
            duration > 0
              ? Math.min(99, Math.round((membership.positionSeconds / duration) * 100))
              : 0,
          completed: false,
          completedAt: null,
          lastWatchedAt: new Date(),
        });
      }
    }

    if (progressDocs.length > 0) {
      await VideoProgress.insertMany(progressDocs);
    }

    // Calculate official course completion statistics using getCourseCompletionStats
    const stats = await getCourseCompletionStats(userId, newCourse._id);
    if (newCourse.progressPercentage !== stats.courseProgressPercentage) {
      await Course.updateOne(
        { _id: newCourse._id },
        { $set: { progressPercentage: stats.courseProgressPercentage } }
      );
      newCourse.progressPercentage = stats.courseProgressPercentage;
    }

    // Keep membership progress in sync
    await syncMemberProgressWithCourse(userId, circle, membership);

    res.status(201).json({
      success: true,
      alreadyAdded: false,
      isAddedToCourses: true,
      courseId: newCourse._id,
      courseTitle: newCourse.title,
      progressPercentage: newCourse.progressPercentage,
      message: 'Course added to your personal library successfully',
    });
  } catch (error) {
    console.error('Error adding study circle playlist to personal courses:', error);
    res.status(500).json({ message: 'Failed to add course to personal library' });
  }
};

