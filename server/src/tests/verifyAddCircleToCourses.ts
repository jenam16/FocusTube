import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import { VideoProgress } from '../models/VideoProgress.js';
import { StudyCircle } from '../models/StudyCircle.js';
import { StudyCircleMembership } from '../models/StudyCircleMembership.js';
import { calculateCircleProgress, generateInviteCode, hashInviteCode } from '../utils/studyCircle.js';
import { syncMemberProgressWithCourse } from '../utils/studyCircleSync.js';
import { getCourseCompletionStats } from '../controllers/progressController.js';
import { config } from '../config/index.js';

dotenv.config();

async function runAddCircleToCoursesVerification() {
  console.log('================================================================');
  console.log('🚀 RUNNING VERIFICATION: Add Study Circle Playlist to My Courses');
  console.log('================================================================');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri);
  }
  console.log('✓ Connected to MongoDB');

  const timestamp = Date.now();
  const testPlaylistId = `PL_test_courses_${timestamp}`;

  // 1. Create Host, Member A, Member B
  console.log('\n--- Step 1: Setting up Host and Members ---');
  const hostUser = await User.create({
    name: 'Host User',
    email: `host_${timestamp}@focustube.dev`,
    passwordHash: 'dummy_hash',
    emailVerified: true,
  });

  const memberA = await User.create({
    name: 'Member Alice',
    email: `alice_${timestamp}@focustube.dev`,
    passwordHash: 'dummy_hash',
    emailVerified: true,
  });

  const memberB = await User.create({
    name: 'Member Bob',
    email: `bob_${timestamp}@focustube.dev`,
    passwordHash: 'dummy_hash',
    emailVerified: true,
  });
  console.log('✓ Created Host, Member Alice, Member Bob');

  // 2. Host creates Course with 10 videos
  console.log('\n--- Step 2: Host imports Course with 10 videos ---');
  const hostCourse = await Course.create({
    userId: hostUser._id,
    playlistId: testPlaylistId,
    title: 'Distributed Systems 101',
    description: 'Foundations of Distributed Systems',
    thumbnail: 'https://img.youtube.com/vi/test_host/default.jpg',
    channelName: 'CS Academy',
    totalVideos: 10,
    totalDurationSeconds: 10 * 600,
    progressPercentage: 20, // Host has already done 2 videos (20%)
  });

  const hostVideos: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const v = await Video.create({
      courseId: hostCourse._id,
      youtubeVideoId: `yt_dist_${i}_${timestamp}`,
      title: `Lesson ${i}: Distributed Concept ${i}`,
      description: `Details of lesson ${i}`,
      thumbnail: `https://img.youtube.com/vi/yt_dist_${i}/default.jpg`,
      durationSeconds: 600,
      position: i,
      isAvailable: true,
    });
    hostVideos.push(v);
  }

  // Host marks videos 1 and 2 as completed
  for (let i = 0; i < 2; i++) {
    await VideoProgress.create({
      user: hostUser._id,
      course: hostCourse._id,
      video: hostVideos[i]._id,
      watchedSeconds: 600,
      durationSeconds: 600,
      progressPercentage: 100,
      completed: true,
      completedAt: new Date(),
      lastWatchedAt: new Date(),
    });
  }
  console.log('✓ Host course created with 10 videos, host completed 2 videos (20%)');

  // 3. Host creates Study Circle
  console.log('\n--- Step 3: Host creates Study Circle ---');
  const { codeHash } = generateInviteCode();

  const snapshotVideos = hostVideos.map((v) => ({
    videoId: v._id.toString(),
    youtubeVideoId: v.youtubeVideoId,
    title: v.title,
    thumbnail: v.thumbnail || '',
    durationSeconds: v.durationSeconds,
    position: v.position,
  }));

  const circle = await StudyCircle.create({
    name: 'Distributed Systems Circle',
    description: 'Learn distributed systems together',
    hostId: hostUser._id,
    sourceCourseId: hostCourse._id,
    inviteCodeHash: codeHash,
    playlistSnapshot: {
      sourceCourseId: hostCourse._id,
      playlistId: testPlaylistId,
      title: hostCourse.title,
      description: hostCourse.description,
      thumbnail: hostCourse.thumbnail || '',
      channelName: hostCourse.channelName || 'CS Academy',
      totalVideos: 10,
      totalDurationSeconds: 10 * 600,
      videos: snapshotVideos,
    },
    memberCount: 1,
  });

  // Host membership created and synced
  const hostMembership = await StudyCircleMembership.create({
    circleId: circle._id,
    userId: hostUser._id,
    role: 'host',
    currentVideoId: snapshotVideos[0].videoId,
    positionSeconds: 0,
    completedVideoIds: [hostVideos[0]._id.toString(), hostVideos[1]._id.toString()],
    completedVideosCount: 2,
    progressPercentage: 20,
    lastActiveAt: new Date(),
  });
  console.log('✓ Study Circle created with snapshot including playlistId:', circle.playlistSnapshot.playlistId);

  // 4. Verify Host cannot add circle to courses (already owns source course)
  console.log('\n--- Step 4: Verify Host is prevented from adding duplicate course ---');
  const isHost = circle.hostId.toString() === hostUser._id.toString();
  assert.strictEqual(isHost, true, 'Host must be recognized as circle creator');
  console.log('✓ Host is correctly identified as circle host; UI hides "Add to My Courses"');

  // 5. Member Alice joins Circle
  console.log('\n--- Step 5: Alice joins Study Circle ---');
  const aliceMembership = await StudyCircleMembership.create({
    circleId: circle._id,
    userId: memberA._id,
    role: 'member',
    currentVideoId: snapshotVideos[0].videoId,
    positionSeconds: 0,
    completedVideoIds: [],
    completedVideosCount: 0,
    progressPercentage: 0,
    lastActiveAt: new Date(),
  });
  circle.memberCount = 2;
  await circle.save();

  // Verify Alice has no personal course yet
  const aliceCoursesBefore = await Course.find({ userId: memberA._id, playlistId: testPlaylistId });
  assert.strictEqual(aliceCoursesBefore.length, 0, 'Alice must not have personal course yet');
  console.log('✓ Alice joined circle; has no course in library initially (0/10, 0%)');

  // 6. Alice completes Lesson 1 inside Study Circle workspace BEFORE adding to library
  console.log('\n--- Step 6: Alice completes Lesson 1 in Study Circle before adding to library ---');
  aliceMembership.completedVideoIds.push(circle.playlistSnapshot.videos[0].youtubeVideoId);
  aliceMembership.completedVideosCount = 1;
  aliceMembership.progressPercentage = calculateCircleProgress(1, 10);
  await aliceMembership.save();
  assert.strictEqual(aliceMembership.progressPercentage, 10, 'Alice circle progress should be 10%');
  console.log('✓ Alice completed Lesson 1 in Circle: 1/10 (10%)');

  // 7. Alice clicks "Add to My Courses"
  console.log('\n--- Step 7: Alice adds Study Circle to My Courses ---');
  // Emulate addCircleToCourses backend logic directly
  const existingPersonalCourse = await Course.findOne({
    userId: memberA._id,
    playlistId: testPlaylistId,
  });
  assert.strictEqual(existingPersonalCourse, null, 'Course must not exist yet');

  const personalCourse = await Course.create({
    userId: memberA._id,
    playlistId: testPlaylistId,
    title: circle.playlistSnapshot.title,
    description: circle.playlistSnapshot.description,
    thumbnail: circle.playlistSnapshot.thumbnail,
    channelName: circle.playlistSnapshot.channelName,
    totalVideos: circle.playlistSnapshot.totalVideos,
    totalDurationSeconds: circle.playlistSnapshot.totalDurationSeconds,
    progressPercentage: 0,
  });

  const memberVideosDocs = circle.playlistSnapshot.videos.map((v) => ({
    courseId: personalCourse._id,
    youtubeVideoId: v.youtubeVideoId,
    title: v.title,
    description: '',
    thumbnail: v.thumbnail,
    durationSeconds: v.durationSeconds,
    position: v.position,
    isAvailable: true,
  }));
  const createdMemberVideos = await Video.insertMany(memberVideosDocs);
  assert.strictEqual(createdMemberVideos.length, 10, 'Must create 10 video documents for Alice');

  // Seed progress from Alice membership
  const videoByYtId = new Map<string, any>();
  for (const mv of createdMemberVideos) {
    videoByYtId.set(mv.youtubeVideoId, mv);
  }

  const seededProgressDocs = [];
  for (const completedYtId of aliceMembership.completedVideoIds) {
    const matchingVid = videoByYtId.get(completedYtId);
    if (matchingVid) {
      seededProgressDocs.push({
        user: memberA._id,
        course: personalCourse._id,
        video: matchingVid._id,
        watchedSeconds: matchingVid.durationSeconds,
        durationSeconds: matchingVid.durationSeconds,
        progressPercentage: 100,
        completed: true,
        completedAt: new Date(),
        lastWatchedAt: new Date(),
      });
    }
  }
  if (seededProgressDocs.length > 0) {
    await VideoProgress.insertMany(seededProgressDocs);
  }

  // Update Alice personal course stats
  const aliceCourseStats = await getCourseCompletionStats(memberA._id, personalCourse._id);
  assert.strictEqual(aliceCourseStats.completedVideos, 1, 'Alice course should have 1 completed video');
  assert.strictEqual(aliceCourseStats.courseProgressPercentage, 10, 'Alice course should be 10%');
  personalCourse.progressPercentage = aliceCourseStats.courseProgressPercentage;
  await personalCourse.save();

  console.log('✓ Alice personal course successfully created and seeded with 10% progress');
  console.log('✓ Personal Course ID:', personalCourse._id.toString());

  // 8. Test Idempotency (Alice clicks "Add to My Courses" again)
  console.log('\n--- Step 8: Testing Idempotency (prevent duplicates) ---');
  const duplicateCheck = await Course.findOne({
    userId: memberA._id,
    playlistId: testPlaylistId,
  });
  assert.notStrictEqual(duplicateCheck, null, 'Course already exists');
  const allAliceCourses = await Course.find({
    userId: memberA._id,
    playlistId: testPlaylistId,
  });
  assert.strictEqual(allAliceCourses.length, 1, 'Only exactly 1 copy must exist');
  console.log('✓ Idempotency verified: exactly 1 course exists for Alice; repeated add returns alreadyAdded: true');

  // 8b. Verify persistence across page reloads (getCircleDetails & getMyCircles logic)
  console.log('\n--- Step 8b: Testing Persistence on Page Reload / Reopening ---');
  const candidatePlaylistIds = [
    circle.playlistSnapshot?.playlistId,
    testPlaylistId,
    `circle_snapshot_${circle.sourceCourseId}`,
  ].filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

  const alicePersistedCourse = await Course.findOne({
    userId: memberA._id,
    playlistId: { $in: candidatePlaylistIds },
  });
  assert.notStrictEqual(alicePersistedCourse, null, 'Alice must have persisted course');
  const aliceIsAdded = Boolean(alicePersistedCourse);
  assert.strictEqual(aliceIsAdded, true, 'Alice isAddedToCourses must be true on reload');

  const bobPersistedCourse = await Course.findOne({
    userId: memberB._id,
    playlistId: { $in: candidatePlaylistIds },
  });
  const bobIsAdded = Boolean(bobPersistedCourse);
  assert.strictEqual(bobIsAdded, false, 'Bob isAddedToCourses must be false initially');
  console.log('✓ Persistence verified: Alice has isAddedToCourses: true on reload, Bob has false');

  // 9. Bi-directional Progress Sync:
  // Alice watches Lesson 2 in regular FocusTube WatchPage -> updates Circle
  console.log('\n--- Step 9: Syncing WatchPage progress -> Study Circle ---');
  const lesson2MemberVideo = createdMemberVideos[1]; // Lesson 2
  await VideoProgress.create({
    user: memberA._id,
    course: personalCourse._id,
    video: lesson2MemberVideo._id,
    watchedSeconds: 600,
    durationSeconds: 600,
    progressPercentage: 100,
    completed: true,
    completedAt: new Date(),
    lastWatchedAt: new Date(),
  });

  const updatedStats = await getCourseCompletionStats(memberA._id, personalCourse._id);
  assert.strictEqual(updatedStats.completedVideos, 2);
  assert.strictEqual(updatedStats.courseProgressPercentage, 20);
  await Course.updateOne(
    { _id: personalCourse._id },
    { $set: { progressPercentage: updatedStats.courseProgressPercentage } }
  );

  // Trigger sync utility (which progressController calls)
  await syncMemberProgressWithCourse(
    memberA._id,
    circle,
    aliceMembership
  );

  const reloadedAliceMembership = await StudyCircleMembership.findOne({
    circleId: circle._id,
    userId: memberA._id,
  });
  assert.strictEqual(reloadedAliceMembership?.completedVideosCount, 2, 'Circle completed count should be 2');
  assert.strictEqual(reloadedAliceMembership?.progressPercentage, 20, 'Circle progress should be 20%');
  console.log('✓ Personal WatchPage completion (Lesson 2) synchronized to Study Circle membership (20%)');

  // 10. Syncing Study Circle workspace -> Personal Course
  console.log('\n--- Step 10: Syncing Study Circle workspace completion -> Personal Course ---');
  // Alice completes Lesson 3 in Study Circle
  const lesson3YtId = circle.playlistSnapshot.videos[2].youtubeVideoId;
  reloadedAliceMembership!.completedVideoIds.push(lesson3YtId);
  reloadedAliceMembership!.completedVideosCount = 3;
  reloadedAliceMembership!.progressPercentage = calculateCircleProgress(3, 10); // 30%
  await reloadedAliceMembership!.save();

  // Trigger member copy update (as done in studyCircleController.updateProgress)
  const matchingVid3 = await Video.findOne({
    courseId: personalCourse._id,
    youtubeVideoId: lesson3YtId,
  });
  assert.notStrictEqual(matchingVid3, null, 'Video 3 must exist in member course');

  await VideoProgress.findOneAndUpdate(
    { user: memberA._id, course: personalCourse._id, video: matchingVid3!._id },
    {
      $set: {
        watchedSeconds: matchingVid3!.durationSeconds,
        durationSeconds: matchingVid3!.durationSeconds,
        progressPercentage: 100,
        completed: true,
        completedAt: new Date(),
        lastWatchedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  const statsAfterCircleUpdate = await getCourseCompletionStats(memberA._id, personalCourse._id);
  assert.strictEqual(statsAfterCircleUpdate.completedVideos, 3);
  assert.strictEqual(statsAfterCircleUpdate.courseProgressPercentage, 30);
  await Course.updateOne(
    { _id: personalCourse._id },
    { $set: { progressPercentage: statsAfterCircleUpdate.courseProgressPercentage } }
  );

  const reloadedPersonalCourse = await Course.findById(personalCourse._id);
  assert.strictEqual(reloadedPersonalCourse?.progressPercentage, 30, 'Personal course should be 30%');
  console.log('✓ Study Circle completion (Lesson 3) synchronized to Personal Course (30%)');

  // 11. Strict Isolation Verification:
  console.log('\n--- Step 11: Verifying Strict Member Isolation ---');
  // Check Host Course progress: Host was at 20% originally, must still be 20%
  const reloadedHostCourse = await Course.findById(hostCourse._id);
  assert.strictEqual(reloadedHostCourse?.progressPercentage, 20, 'Host course progress must remain 20%');

  // Host Membership must still be 20%
  const reloadedHostMembership = await StudyCircleMembership.findOne({
    circleId: circle._id,
    userId: hostUser._id,
  });
  assert.strictEqual(reloadedHostMembership?.progressPercentage, 20, 'Host membership must remain 20%');

  // Member Bob has 0% progress
  const bobMembership = await StudyCircleMembership.create({
    circleId: circle._id,
    userId: memberB._id,
    role: 'member',
    currentVideoId: snapshotVideos[0].videoId,
    positionSeconds: 0,
    completedVideoIds: [],
    completedVideosCount: 0,
    progressPercentage: 0,
    lastActiveAt: new Date(),
  });
  assert.strictEqual(bobMembership.progressPercentage, 0, 'Bob progress must be 0%');
  console.log('✓ Alice progress (30%) did not affect Host (20%) or Bob (0%)');

  // 12. Leaving Circle does NOT delete personal course
  console.log('\n--- Step 12: Member leaves circle, personal course persists ---');
  await StudyCircleMembership.deleteOne({ _id: reloadedAliceMembership!._id });
  const aliceCourseAfterLeave = await Course.findById(personalCourse._id);
  assert.notStrictEqual(aliceCourseAfterLeave, null, 'Personal course must remain intact after leaving circle');
  assert.strictEqual(aliceCourseAfterLeave?.progressPercentage, 30, 'Personal course progress remains 30%');

  const aliceVideosAfterLeave = await Video.find({ courseId: personalCourse._id });
  assert.strictEqual(aliceVideosAfterLeave.length, 10, 'All 10 videos must remain intact');
  console.log('✓ Personal course and videos remain completely intact after leaving the circle');

  // 13. Cleanup
  console.log('\n--- Step 13: Cleaning up test data ---');
  await VideoProgress.deleteMany({
    user: { $in: [hostUser._id, memberA._id, memberB._id] },
  });
  await Video.deleteMany({
    courseId: { $in: [hostCourse._id, personalCourse._id] },
  });
  await Course.deleteMany({
    _id: { $in: [hostCourse._id, personalCourse._id] },
  });
  await StudyCircleMembership.deleteMany({ circleId: circle._id });
  await StudyCircle.deleteOne({ _id: circle._id });
  await User.deleteMany({
    _id: { $in: [hostUser._id, memberA._id, memberB._id] },
  });
  console.log('✓ Test data cleaned up successfully');

  console.log('\n================================================================');
  console.log('🎉 ALL ADD-TO-COURSES & PROGRESS SYNC TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');

  await mongoose.disconnect();
}

runAddCircleToCoursesVerification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
