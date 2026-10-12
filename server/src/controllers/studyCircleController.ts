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

    const inviteUrl = `${config.frontendUrl}/study-circles/join/${rawCode}`;

    res.status(201).json({
      success: true,
      circle,
      inviteCode: rawCode,
      inviteUrl,
      myMembership: hostMembership,
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

    const circles = memberships
      .filter((m) => m.circleId !== null)
      .map((m) => {
        const c = m.circleId as unknown as IStudyCircle;
        return {
          _id: c._id,
          name: c.name,
          description: c.description,
          host: c.hostId,
          isHost: m.role === 'host',
          role: m.role,
          memberCount: c.memberCount,
          maxMembers: 5,
          courseTitle: c.playlistSnapshot?.title || '',
          courseThumbnail: c.playlistSnapshot?.thumbnail || '',
          totalVideos: c.playlistSnapshot?.totalVideos || 0,
          myProgressPercentage: m.progressPercentage,
          myCompletedVideosCount: m.completedVideosCount,
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

      // Notify other room subscribers in realtime
      emitToCircle(circle._id.toString(), 'circle:member:joined', {
        member: {
          userId: userId.toString(),
          name: req.user?.name,
          avatar: req.user?.avatar,
          role: 'member',
          progressPercentage: 0,
          completedVideosCount: 0,
          lastActiveAt: new Date(),
        },
        memberCount: updatedCircle.memberCount,
      });

      res.status(201).json({
        success: true,
        circleId: circle._id,
        membership,
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

    res.json({
      success: true,
      circle,
      myMembership: membership,
      isHost: membership.role === 'host',
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

    const memberships = await StudyCircleMembership.find({ circleId })
      .populate('userId', 'name avatar')
      .sort({ role: 1, joinedAt: 1 });

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
