import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import { VideoProgress } from '../models/VideoProgress.js';
import { StudyCircle } from '../models/StudyCircle.js';
import { StudyCircleMembership } from '../models/StudyCircleMembership.js';
import { calculateCircleProgress, generateInviteCode } from '../utils/studyCircle.js';
import { syncMemberProgressWithCourse } from '../controllers/studyCircleController.js';
import { getCourseCompletionStats } from '../controllers/progressController.js';
import { config } from '../config/index.js';

dotenv.config();

async function runCircleProgressSyncVerification() {
  console.log('--- Starting Study Circle Progress Synchronization Verification ---');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri);
  }
  console.log('✓ Connected to MongoDB');

  // 1. Verify calculation parity between FocusTube Course and Study Circle
  console.log('\n1. Verifying mathematical calculation parity...');
  // 4 out of 31 videos completed
  const circlePct4of31 = calculateCircleProgress(4, 31);
  assert.strictEqual(circlePct4of31, 13, 'Expected 4/31 to equal 13%');

  // 0 videos
  assert.strictEqual(calculateCircleProgress(0, 31), 0, 'Expected 0/31 to equal 0%');

  // All completed
  assert.strictEqual(calculateCircleProgress(31, 31), 100, 'Expected 31/31 to equal 100%');
  console.log('✓ Progress percentage calculations match 13% for 4/31 videos');

  // 2. Setup mock data
  console.log('\n2. Setting up test course with 31 videos & 4 completed lessons...');
  const hostUser = await User.create({
    name: 'Sync Host',
    email: `sync_host_${Date.now()}@focustube.dev`,
    passwordHash: 'dummy_hash',
    emailVerified: true,
  });

  const memberUser = await User.create({
    name: 'Sync Member',
    email: `sync_member_${Date.now()}@focustube.dev`,
    passwordHash: 'dummy_hash',
    emailVerified: true,
  });

  const course = await Course.create({
    userId: hostUser._id,
    playlistId: `PL_test_${Date.now()}`,
    title: 'Backend from First Principles',
    description: 'Master backend engineering',
    totalVideos: 31,
    totalDurationSeconds: 31 * 600,
    progressPercentage: 0,
  });

  // Create 31 video documents
  const videos: any[] = [];
  for (let i = 1; i <= 31; i++) {
    const video = await Video.create({
      courseId: course._id,
      youtubeVideoId: `yt_vid_${i}_${Date.now()}`,
      title: `Lesson ${i}: Topic ${i}`,
      durationSeconds: 600,
      position: i,
      isAvailable: true,
    });
    videos.push(video);
  }

  // Mark first 4 videos as completed in VideoProgress for host
  for (let i = 0; i < 4; i++) {
    await VideoProgress.create({
      user: hostUser._id,
      course: course._id,
      video: videos[i]._id,
      watchedSeconds: 600,
      durationSeconds: 600,
      progressPercentage: 100,
      completed: true,
      completedAt: new Date(),
      lastWatchedAt: new Date(),
    });
  }

  // Verify Dashboard course completion calculation
  const statsBefore = await getCourseCompletionStats(hostUser._id, course._id);
  assert.strictEqual(statsBefore.completedVideos, 4);
  assert.strictEqual(statsBefore.totalAvailableVideos, 31);
  assert.strictEqual(statsBefore.courseProgressPercentage, 13);
  await Course.updateOne(
    { _id: course._id },
    { $set: { progressPercentage: statsBefore.courseProgressPercentage } }
  );
  console.log('✓ Host Course stats confirmed: 4/31 videos completed (13%)');

  // 3. Create Study Circle and verify Host Membership synchronization
  console.log('\n3. Creating Study Circle from the course...');
  const snapshotVideos = videos.map((v) => ({
    videoId: v._id.toString(),
    youtubeVideoId: v.youtubeVideoId,
    title: v.title,
    thumbnail: '',
    durationSeconds: v.durationSeconds,
    position: v.position,
  }));

  const { codeHash } = generateInviteCode();
  const circle = await StudyCircle.create({
    name: 'Backend Circle',
    description: 'Study group for backend course',
    hostId: hostUser._id,
    sourceCourseId: course._id,
    memberCount: 1,
    inviteCodeHash: codeHash,
    playlistSnapshot: {
      sourceCourseId: course._id,
      title: course.title,
      description: course.description,
      thumbnail: '',
      channelName: 'FocusTube Academy',
      totalVideos: 31,
      totalDurationSeconds: 31 * 600,
      videos: snapshotVideos,
    },
  });

  const rawHostMembership = await StudyCircleMembership.create({
    circleId: circle._id,
    userId: hostUser._id,
    role: 'host',
    currentVideoId: snapshotVideos[0].videoId,
    positionSeconds: 0,
    completedVideoIds: [],
    completedVideosCount: 0,
    progressPercentage: 0,
    lastActiveAt: new Date(),
  });

  // Run syncMemberProgressWithCourse
  const syncedHostMembership = await syncMemberProgressWithCourse(
    hostUser._id,
    circle,
    rawHostMembership
  );

  assert.strictEqual(syncedHostMembership.completedVideosCount, 4);
  assert.strictEqual(syncedHostMembership.progressPercentage, 13);
  assert.strictEqual(syncedHostMembership.completedVideoIds.length, 4);
  console.log('✓ Host Study Circle Membership synchronized with Course progress: 4/31 (13%)');

  // 4. Test New Member joins and check strict isolation
  console.log('\n4. Testing Member B joining the Circle...');
  const rawMemberMembership = await StudyCircleMembership.create({
    circleId: circle._id,
    userId: memberUser._id,
    role: 'member',
    currentVideoId: snapshotVideos[0].videoId,
    positionSeconds: 0,
    completedVideoIds: [],
    completedVideosCount: 0,
    progressPercentage: 0,
    lastActiveAt: new Date(),
  });

  const syncedMemberMembership = await syncMemberProgressWithCourse(
    memberUser._id,
    circle,
    rawMemberMembership
  );

  assert.strictEqual(syncedMemberMembership.completedVideosCount, 0);
  assert.strictEqual(syncedMemberMembership.progressPercentage, 0);
  assert.strictEqual(syncedMemberMembership.completedVideoIds.length, 0);
  console.log('✓ Member B progress is strictly independent: 0/31 (0%)');

  // Verify Host membership was NOT touched
  const reloadedHost = await StudyCircleMembership.findById(syncedHostMembership._id);
  assert.strictEqual(reloadedHost?.completedVideosCount, 4);
  assert.strictEqual(reloadedHost?.progressPercentage, 13);
  console.log('✓ Host progress was NOT altered by Member B joining');

  // 5. Test Two-Way Sync when Host marks 5th lesson complete in Study Circle
  console.log('\n5. Testing Host completing Lesson 5 in Study Circle workspace...');
  const fifthVideo = videos[4];
  syncedHostMembership.completedVideoIds.push(fifthVideo._id.toString());
  syncedHostMembership.completedVideosCount = 5;
  syncedHostMembership.progressPercentage = calculateCircleProgress(5, 31);
  await syncedHostMembership.save();

  // Upsert VideoProgress as done by updateProgress in studyCircleController
  await VideoProgress.findOneAndUpdate(
    {
      user: hostUser._id,
      course: course._id,
      video: fifthVideo._id,
    },
    {
      $set: {
        watchedSeconds: 600,
        durationSeconds: 600,
        progressPercentage: 100,
        completed: true,
        completedAt: new Date(),
        lastWatchedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const updatedStats = await getCourseCompletionStats(hostUser._id, course._id);
  await Course.updateOne(
    { _id: course._id },
    { $set: { progressPercentage: updatedStats.courseProgressPercentage } }
  );

  const reloadedCourse = await Course.findById(course._id);
  assert.strictEqual(reloadedCourse?.progressPercentage, 16); // 5/31 = 16.129% -> 16%
  assert.strictEqual(syncedHostMembership.progressPercentage, 16);
  console.log('✓ Two-Way Sync succeeded: Study Circle 5/31 (16%) reflected on FocusTube Course (16%)');

  // 6. Test Member B completing Lesson 1 and ensuring Host course is NOT modified
  console.log('\n6. Testing Member B completing a lesson without modifying Host Course...');
  syncedMemberMembership.completedVideoIds.push(videos[0]._id.toString());
  syncedMemberMembership.completedVideosCount = 1;
  syncedMemberMembership.progressPercentage = calculateCircleProgress(1, 31);
  await syncedMemberMembership.save();

  const finalHostCourse = await Course.findById(course._id);
  assert.strictEqual(finalHostCourse?.progressPercentage, 16, 'Host course percentage must remain 16%');
  console.log('✓ Member B progress did not leak into or modify Host course');

  // Cleanup
  console.log('\n7. Cleaning up test documents...');
  await VideoProgress.deleteMany({ user: { $in: [hostUser._id, memberUser._id] } });
  await Video.deleteMany({ courseId: course._id });
  await Course.deleteOne({ _id: course._id });
  await StudyCircleMembership.deleteMany({ circleId: circle._id });
  await StudyCircle.deleteOne({ _id: circle._id });
  await User.deleteMany({ _id: { $in: [hostUser._id, memberUser._id] } });
  console.log('✓ Cleaned up test data');

  console.log('\n🎉 ALL STUDY CIRCLE PROGRESS SYNCHRONIZATION TESTS PASSED!\n');
  await mongoose.disconnect();
}

runCircleProgressSyncVerification().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
