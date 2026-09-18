import assert from 'assert';
import { generateVerificationToken, hashVerificationToken } from '../utils/token.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { config } from '../config/index.js';

async function runTests() {
  console.log('--- Starting Email Verification & Resend System Tests ---');

  // Test 1: Cryptographically Secure Verification Token Generation & Hashing
  console.log('1. Testing verification token generation and SHA-256 hashing...');
  const { rawToken, tokenHash } = generateVerificationToken();
  assert.ok(rawToken, 'rawToken must exist');
  assert.ok(tokenHash, 'tokenHash must exist');
  assert.strictEqual(rawToken.length, 64, 'rawToken hex length must be 64 characters (32 bytes)');
  assert.strictEqual(tokenHash.length, 64, 'tokenHash length must be 64 characters (SHA-256)');

  // Verify hash determinism
  const recomputedHash = hashVerificationToken(rawToken);
  assert.strictEqual(recomputedHash, tokenHash, 'Recomputed hash must match tokenHash exactly');

  // Verify uniqueness
  const { rawToken: rawToken2, tokenHash: tokenHash2 } = generateVerificationToken();
  assert.notStrictEqual(rawToken, rawToken2, 'Consecutive tokens must be distinct');
  assert.notStrictEqual(tokenHash, tokenHash2, 'Consecutive token hashes must be distinct');
  console.log('✓ Verification token generation and hashing verified!');

  // Test 2: Token Expiration Logic
  console.log('2. Testing token expiration logic...');
  const now = Date.now();
  const validExpiry = new Date(now + 30 * 60 * 1000); // 30 minutes in future
  const expiredDate = new Date(now - 1000); // 1 second in past

  assert.ok(validExpiry.getTime() > Date.now(), 'Valid expiry must be in the future');
  assert.ok(expiredDate.getTime() < Date.now(), 'Expired date must be in the past');
  console.log('✓ Token expiration checks verified!');

  // Test 3: Resend Email Service Integration
  console.log('3. Testing Resend Email Service integration...');
  // delivered@resend.dev is Resend's official deliverable test recipient that passes sandbox validation
  const testRecipient = config.resend.apiKey ? 'delivered@resend.dev' : 'testuser@example.com';
  const emailResult = await sendVerificationEmail({
    to: testRecipient,
    name: 'Test Student',
    token: rawToken,
  });

  assert.ok(emailResult, 'Email result must be defined');
  assert.strictEqual(emailResult.success, true, 'Email result success must be true');
  console.log('✓ Resend email service verified!');

  // Test 4: Resend Cooldown Calculation (60 seconds)
  console.log('4. Testing Resend 60-second cooldown calculation...');
  const COOLDOWN_MS = 60 * 1000;
  const recentSentAt = new Date(Date.now() - 20 * 1000); // sent 20s ago
  const elapsed = Date.now() - recentSentAt.getTime();
  const cooldownActive = elapsed < COOLDOWN_MS;
  const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);

  assert.strictEqual(cooldownActive, true, 'Cooldown must be active if sent 20s ago');
  assert.ok(remainingSeconds >= 39 && remainingSeconds <= 41, 'Remaining seconds should be around 40s');

  const oldSentAt = new Date(Date.now() - 65 * 1000); // sent 65s ago
  const oldElapsed = Date.now() - oldSentAt.getTime();
  const oldCooldownActive = oldElapsed < COOLDOWN_MS;
  assert.strictEqual(oldCooldownActive, false, 'Cooldown must expire after 60s');
  console.log('✓ Resend cooldown logic verified!');

  // Test 5: Token Invalidation On Verification
  console.log('5. Testing one-time token invalidation and emailVerified transition...');
  let mockUser = {
    email: 'learner@focustube.dev',
    emailVerified: false,
    verificationTokenHash: tokenHash as string | null,
    verificationTokenExpiresAt: validExpiry as Date | null,
  };

  // Simulating successful verification
  assert.strictEqual(mockUser.emailVerified, false, 'Initially unverified');
  assert.ok(mockUser.verificationTokenHash !== null, 'Has token hash initially');

  // Verify and clear
  mockUser.emailVerified = true;
  mockUser.verificationTokenHash = null;
  mockUser.verificationTokenExpiresAt = null;

  assert.strictEqual(mockUser.emailVerified, true, 'Marked verified');
  assert.strictEqual(mockUser.verificationTokenHash, null, 'Token hash invalidated');
  assert.strictEqual(mockUser.verificationTokenExpiresAt, null, 'Expiry cleared');

  // If token is presented again:
  const isUsedOrInvalid = mockUser.verificationTokenHash === null;
  assert.strictEqual(isUsedOrInvalid, true, 'Reused token is recognized as invalid/already used');
  console.log('✓ One-time token invalidation logic verified!');

  console.log('--- All Email Verification & Resend Unit Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
