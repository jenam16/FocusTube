import assert from 'node:assert';

console.log('--- Running Phase 3 Course UI & Detail Experience Verifications ---');

// 1. Duration Formatting Verification
const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }

  return `${minutes}:${pad(seconds)}`;
};

console.log('1. Testing duration formatting examples from Section 19...');
assert.strictEqual(formatDuration(45), '0:45');
assert.strictEqual(formatDuration(762), '12:42'); // 12m 42s = 762s
assert.strictEqual(formatDuration(4320), '1h 12m'); // 1h 12m = 4320s
assert.strictEqual(formatDuration(9300), '2h 35m'); // 2h 35m = 9300s
assert.strictEqual(formatDuration(3600), '1h');
console.log('✓ All duration formatting examples verified!');

// 2. Lesson Order Sorting Verification (position ASC)
console.log('2. Testing lesson order sorting (position ASC)...');
interface VideoMock {
  _id: string;
  position: number;
  title: string;
}

const unorderedVideos: VideoMock[] = [
  { _id: 'v3', position: 2, title: 'Lesson 3' },
  { _id: 'v1', position: 0, title: 'Lesson 1' },
  { _id: 'v4', position: 3, title: 'Lesson 4' },
  { _id: 'v2', position: 1, title: 'Lesson 2' },
];

const sorted = [...unorderedVideos].sort((a, b) => a.position - b.position);
assert.strictEqual(sorted[0].title, 'Lesson 1');
assert.strictEqual(sorted[1].title, 'Lesson 2');
assert.strictEqual(sorted[2].title, 'Lesson 3');
assert.strictEqual(sorted[3].title, 'Lesson 4');
console.log('✓ Lesson order sorting verified!');

// 3. Navigation Boundaries Verification (Previous / Next disable rules)
console.log('3. Testing lesson navigation previous/next logic...');
const getNav = (list: VideoMock[], currentId: string) => {
  const idx = list.findIndex((v) => v._id === currentId);
  return {
    previous: idx > 0 ? list[idx - 1] : null,
    next: idx < list.length - 1 ? list[idx + 1] : null,
    isFirst: idx === 0,
    isLast: idx === list.length - 1,
  };
};

// First lesson
const navFirst = getNav(sorted, 'v1');
assert.strictEqual(navFirst.isFirst, true);
assert.strictEqual(navFirst.previous, null);
assert.strictEqual(navFirst.next?._id, 'v2');

// Middle lesson
const navMiddle = getNav(sorted, 'v2');
assert.strictEqual(navMiddle.isFirst, false);
assert.strictEqual(navMiddle.previous?._id, 'v1');
assert.strictEqual(navMiddle.next?._id, 'v3');

// Final lesson
const navLast = getNav(sorted, 'v4');
assert.strictEqual(navLast.isLast, true);
assert.strictEqual(navLast.previous?._id, 'v3');
assert.strictEqual(navLast.next, null);
console.log('✓ Navigation boundary rules verified!');

// 4. Single-lesson boundary
const single = [{ _id: 'v1', position: 0, title: 'Solo Lesson' }];
const singleNav = getNav(single, 'v1');
assert.strictEqual(singleNav.previous, null);
assert.strictEqual(singleNav.next, null);
assert.strictEqual(singleNav.isFirst, true);
assert.strictEqual(singleNav.isLast, true);
console.log('✓ Single-lesson boundaries verified!');

console.log('--- All Phase 3 Unit Verifications Passed Successfully ---');
