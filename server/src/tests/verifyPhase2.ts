import assert from 'node:assert';
import {
  extractPlaylistId,
  parseISO8601Duration,
  YouTubeError,
} from '../services/youtubeService.js';

console.log('--- Running Phase 2 YouTube Service Unit Verifications ---');

// 1. Test extractPlaylistId
console.log('1. Testing playlist ID extraction...');
const standardUrl =
  'https://www.youtube.com/playlist?list=PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0';
assert.strictEqual(
  extractPlaylistId(standardUrl),
  'PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0'
);

const shortUrl =
  'https://youtube.com/playlist?list=PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0';
assert.strictEqual(
  extractPlaylistId(shortUrl),
  'PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0'
);

const mobileUrl =
  'https://m.youtube.com/playlist?list=PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0';
assert.strictEqual(
  extractPlaylistId(mobileUrl),
  'PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0'
);

const watchListUrl =
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0&index=1';
assert.strictEqual(
  extractPlaylistId(watchListUrl),
  'PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0'
);

const rawId = 'PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0';
assert.strictEqual(
  extractPlaylistId(rawId),
  'PL4cUxeGkcC9gUxtNzTrigyeeSl6219wR0'
);

assert.strictEqual(extractPlaylistId('https://google.com'), null);
assert.strictEqual(extractPlaylistId('not-a-playlist-id!'), null);
assert.strictEqual(extractPlaylistId(''), null);
console.log('✓ All playlist ID extraction tests passed!');

// 2. Test parseISO8601Duration
console.log('2. Testing ISO 8601 duration parsing...');
assert.strictEqual(parseISO8601Duration('PT1H2M10S'), 3730);
assert.strictEqual(parseISO8601Duration('PT15M33S'), 933);
assert.strictEqual(parseISO8601Duration('PT45S'), 45);
assert.strictEqual(parseISO8601Duration('PT1H'), 3600);
assert.strictEqual(parseISO8601Duration('P1DT2H'), 93600);
assert.strictEqual(parseISO8601Duration('P0D'), 0);
assert.strictEqual(parseISO8601Duration('PT0S'), 0);
assert.strictEqual(parseISO8601Duration(''), 0);
assert.strictEqual(parseISO8601Duration(undefined), 0);
console.log('✓ All ISO 8601 duration parsing tests passed!');

// 3. Test YouTubeError class
console.log('3. Testing YouTubeError status codes...');
const err = new YouTubeError('Playlist not found', 404);
assert.strictEqual(err.statusCode, 404);
assert.strictEqual(err.message, 'Playlist not found');
assert.strictEqual(err.name, 'YouTubeError');
console.log('✓ YouTubeError class verified!');

console.log('--- All Phase 2 Unit Tests Passed Successfully ---');
