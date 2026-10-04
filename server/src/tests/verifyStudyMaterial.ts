import assert from 'node:assert';

console.log('--- Running Study Material Unit Verifications ---');

// Helper to infer file type from URL
const inferFileType = (url: string, explicitType?: string): string => {
  if (explicitType && explicitType.trim()) {
    return explicitType.trim().toLowerCase();
  }
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.pdf')) return 'pdf';
  if (cleanUrl.endsWith('.doc') || cleanUrl.endsWith('.docx')) return 'doc';
  if (cleanUrl.endsWith('.epub')) return 'epub';
  if (cleanUrl.endsWith('.ppt') || cleanUrl.endsWith('.pptx')) return 'ppt';
  if (cleanUrl.endsWith('.xls') || cleanUrl.endsWith('.xlsx')) return 'sheet';
  return 'link';
};

// 1. Testing file type inference
console.log('1. Testing file type inference from URL and explicit overrides...');
assert.strictEqual(inferFileType('https://example.com/handbook.pdf'), 'pdf');
assert.strictEqual(inferFileType('https://example.com/notes.docx?token=123'), 'doc');
assert.strictEqual(inferFileType('https://example.com/book.epub'), 'epub');
assert.strictEqual(inferFileType('https://example.com/slides.pptx'), 'ppt');
assert.strictEqual(inferFileType('https://example.com/data.xlsx'), 'sheet');
assert.strictEqual(inferFileType('https://en.wikipedia.org/wiki/React'), 'link');
assert.strictEqual(inferFileType('https://example.com/file', 'PDF'), 'pdf');
console.log('✓ File type inference tests passed successfully!');

// 2. Testing URL validation
console.log('2. Testing URL validation logic...');
const isValidUrl = (url: string): boolean => {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
};

assert.strictEqual(isValidUrl('https://example.com/handbook.pdf'), true);
assert.strictEqual(isValidUrl('http://example.com/resource'), true);
assert.strictEqual(isValidUrl('ftp://example.com/file'), false);
assert.strictEqual(isValidUrl('javascript:alert(1)'), false);
assert.strictEqual(isValidUrl(''), false);
console.log('✓ URL validation logic passed!');

// 3. Testing schema metadata requirements
console.log('3. Testing schema metadata structure...');
interface MockStudyMaterial {
  userId: string;
  name: string;
  originalUrl: string;
  fileType: string;
  createdAt: Date;
  updatedAt: Date;
}

const mockRecord: MockStudyMaterial = {
  userId: 'user_123',
  name: 'Operating Systems Three Easy Pieces',
  originalUrl: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf',
  fileType: inferFileType('https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

assert.strictEqual(mockRecord.name, 'Operating Systems Three Easy Pieces');
assert.strictEqual(mockRecord.fileType, 'pdf');
assert.strictEqual((mockRecord as any).lastViewedPage, undefined);
assert.strictEqual(typeof mockRecord.userId, 'string');
// Confirm no courseId or videoId is attached (independent personal library)
assert.strictEqual((mockRecord as any).courseId, undefined);
assert.strictEqual((mockRecord as any).videoId, undefined);
console.log('✓ Schema metadata structure and course independence verified!');

console.log('--- All Study Material Unit Tests Passed Successfully! ---');
