import assert from 'node:assert';

console.log('--- Running Phase 4 YouTube Video Player & Navigation Verifications ---');

interface VideoMock {
  _id: string;
  youtubeVideoId: string;
  position: number;
  title: string;
  isAvailable: boolean;
}

const getPlayableVideos = (videos: VideoMock[]): VideoMock[] => {
  return [...videos]
    .filter((v) => v.isAvailable !== false && Boolean(v.youtubeVideoId))
    .sort((a, b) => a.position - b.position);
};

const getFirstPlayableVideo = (videos: VideoMock[]): VideoMock | null => {
  const playable = getPlayableVideos(videos);
  return playable.length > 0 ? playable[0] : null;
};

const getNextPlayableVideo = (
  videos: VideoMock[],
  currentVideoId?: string
): VideoMock | null => {
  if (!currentVideoId) return null;
  const playable = getPlayableVideos(videos);
  const currentIndex = playable.findIndex(
    (v) => v._id === currentVideoId || v.youtubeVideoId === currentVideoId
  );

  if (currentIndex === -1 || currentIndex >= playable.length - 1) {
    return null;
  }

  return playable[currentIndex + 1];
};

const getPreviousPlayableVideo = (
  videos: VideoMock[],
  currentVideoId?: string
): VideoMock | null => {
  if (!currentVideoId) return null;
  const playable = getPlayableVideos(videos);
  const currentIndex = playable.findIndex(
    (v) => v._id === currentVideoId || v.youtubeVideoId === currentVideoId
  );

  if (currentIndex <= 0) {
    return null;
  }

  return playable[currentIndex - 1];
};

// Test dataset with mixed available and unavailable videos out of order
const testVideos: VideoMock[] = [
  { _id: 'v4', youtubeVideoId: 'yt4', position: 3, title: 'Lesson 4', isAvailable: true },
  { _id: 'v1', youtubeVideoId: 'yt1', position: 0, title: 'Lesson 1 (Unavailable)', isAvailable: false },
  { _id: 'v3', youtubeVideoId: 'yt3', position: 2, title: 'Lesson 3 (Unavailable)', isAvailable: false },
  { _id: 'v2', youtubeVideoId: 'yt2', position: 1, title: 'Lesson 2', isAvailable: true },
  { _id: 'v5', youtubeVideoId: 'yt5', position: 4, title: 'Lesson 5', isAvailable: true },
];

console.log('1. Testing getPlayableVideos sorting and filtering...');
const playable = getPlayableVideos(testVideos);
assert.strictEqual(playable.length, 3);
assert.strictEqual(playable[0]._id, 'v2');
assert.strictEqual(playable[1]._id, 'v4');
assert.strictEqual(playable[2]._id, 'v5');
console.log('✓ Playable videos correctly filtered and sorted by position ASC!');

console.log('2. Testing getFirstPlayableVideo when first video is unavailable...');
const first = getFirstPlayableVideo(testVideos);
assert.notStrictEqual(first, null);
assert.strictEqual(first?._id, 'v2', 'Should skip unavailable Lesson 1 and pick Lesson 2');
console.log('✓ First playable video correctly skips unavailable initial lessons!');

console.log('3. Testing getNextPlayableVideo skipping unavailable videos...');
// When on v2, next is v4 (v3 is unavailable and skipped)
const nextFromV2 = getNextPlayableVideo(testVideos, 'v2');
assert.strictEqual(nextFromV2?._id, 'v4', 'Next should skip v3 and select v4');

// When on v4, next is v5
const nextFromV4 = getNextPlayableVideo(testVideos, 'v4');
assert.strictEqual(nextFromV4?._id, 'v5');

// When on v5 (last playable), next should be null
const nextFromV5 = getNextPlayableVideo(testVideos, 'v5');
assert.strictEqual(nextFromV5, null, 'Next on last video must be null (disabled)');
console.log('✓ Next navigation correctly skips unavailable videos and handles end bounds!');

console.log('4. Testing getPreviousPlayableVideo skipping unavailable videos...');
// When on v5, previous is v4
const prevFromV5 = getPreviousPlayableVideo(testVideos, 'v5');
assert.strictEqual(prevFromV5?._id, 'v4');

// When on v4, previous is v2 (v3 is unavailable and skipped)
const prevFromV4 = getPreviousPlayableVideo(testVideos, 'v4');
assert.strictEqual(prevFromV4?._id, 'v2', 'Previous should skip v3 and select v2');

// When on v2 (first playable), previous should be null
const prevFromV2 = getPreviousPlayableVideo(testVideos, 'v2');
assert.strictEqual(prevFromV2, null, 'Previous on first video must be null (disabled)');
console.log('✓ Previous navigation correctly skips unavailable videos and handles start bounds!');

console.log('5. Testing dataset where all videos are unavailable...');
const allUnavailable: VideoMock[] = [
  { _id: 'u1', youtubeVideoId: 'yt1', position: 0, title: 'Bad 1', isAvailable: false },
  { _id: 'u2', youtubeVideoId: 'yt2', position: 1, title: 'Bad 2', isAvailable: false },
];
assert.strictEqual(getFirstPlayableVideo(allUnavailable), null);
assert.strictEqual(getNextPlayableVideo(allUnavailable, 'u1'), null);
assert.strictEqual(getPreviousPlayableVideo(allUnavailable, 'u2'), null);
console.log('✓ All-unavailable scenario handled cleanly without crashing!');

console.log('--- All Phase 4 Unit Verifications Passed Successfully ---');
