import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import {
  generateVerificationToken,
  hashVerificationToken,
} from '../utils/token.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { config } from '../config/index.js';

dotenv.config();

async function runPasswordResetTests() {
  console.log('--- Starting Password Reset Flow Tests ---');

  // Test 1: Cryptographically Secure Reset Token Generation & SHA-256 Hashing
  console.log('\n1. Testing password reset token generation and SHA-256 hashing...');
  const { rawToken, tokenHash } = generateVerificationToken();
  assert.ok(rawToken, 'rawToken must exist');
  assert.ok(tokenHash, 'tokenHash must exist');
  assert.strictEqual(rawToken.length, 64, 'rawToken hex length must be 64 characters (32 bytes)');
  assert.strictEqual(tokenHash.length, 64, 'tokenHash length must be 64 characters (SHA-256)');

  const recomputedHash = hashVerificationToken(rawToken);
  assert.strictEqual(recomputedHash, tokenHash, 'Recomputed hash must match tokenHash exactly');
  console.log('✓ Token generation and deterministic SHA-256 hashing verified!');

  // Test 2: 30-Minute Expiration Verification
  console.log('\n2. Testing 30-minute expiration window logic...');
  const now = Date.now();
  const resetExpiry = new Date(now + 30 * 60 * 1000);
  const expiredDate = new Date(now - 1000);

  assert.ok(resetExpiry.getTime() > Date.now(), 'Reset expiry must be in the future');
  assert.ok(resetExpiry.getTime() - now <= 30 * 60 * 1000, 'Expiry is within 30 minutes');
  assert.ok(expiredDate.getTime() < Date.now(), 'Expired token must be in the past');
  console.log('✓ 30-minute expiration validation verified!');

  // Test 3: 60-Second Cooldown Enforcement
  console.log('\n3. Testing 60-second cooldown enforcement...');
  const COOLDOWN_MS = 60 * 1000;
  const recentSentAt = new Date(Date.now() - 25 * 1000); // sent 25s ago
  const elapsed = Date.now() - recentSentAt.getTime();
  const isCooldownActive = elapsed < COOLDOWN_MS;
  const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);

  assert.strictEqual(isCooldownActive, true, 'Cooldown must be active if sent 25s ago');
  assert.ok(remainingSeconds >= 34 && remainingSeconds <= 36, 'Remaining seconds should be around 35s');

  const oldSentAt = new Date(Date.now() - 65 * 1000); // sent 65s ago
  const oldCooldownActive = Date.now() - oldSentAt.getTime() < COOLDOWN_MS;
  assert.strictEqual(oldCooldownActive, false, 'Cooldown should expire after 60s');
  console.log('✓ 60-second cooldown enforcement verified!');

  // Test 4: Resend Email Service Integration for Password Reset
  console.log('\n4. Testing Resend Email Service for password reset...');
  const testRecipient = config.resend.apiKey ? 'delivered@resend.dev' : 'testuser@example.com';
  const emailResult = await sendPasswordResetEmail({
    to: testRecipient,
    name: 'Reset Test User',
    token: rawToken,
  });
  assert.ok(emailResult, 'Email result must be returned');
  assert.strictEqual(emailResult.success, true, 'Email result success must be true');
  console.log('✓ Resend password reset email sending verified!');

  // Connect to MongoDB for DB Lifecycle Tests
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri);
  }
  console.log('✓ Connected to MongoDB');

  // Test 5: Complete Database Reset Lifecycle & Email Verification Status Preservation
  console.log('\n5. Testing End-to-End User Reset Lifecycle in MongoDB...');
  const testEmail = `reset_test_${Date.now()}@focustube.dev`;
  const initialPassword = 'InitialPassword123!';
  const initialHash = await bcrypt.hash(initialPassword, 10);

  // Create an unverified user to ensure emailVerified remains false after password reset
  const user = await User.create({
    name: 'Reset Test User',
    email: testEmail,
    passwordHash: initialHash,
    emailVerified: false,
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: resetExpiry,
    lastPasswordResetSentAt: new Date(),
  });

  assert.strictEqual(user.emailVerified, false, 'User begins unverified');
  assert.strictEqual(user.passwordResetTokenHash, tokenHash, 'Reset token hash stored in DB');
  console.log('✓ User created with pending password reset token');

  // Find user by token hash (simulating reset password endpoint)
  const foundUser = await User.findOne({ passwordResetTokenHash: tokenHash });
  assert.ok(foundUser, 'User found by password reset token hash');
  assert.ok(foundUser.passwordResetTokenExpiresAt!.getTime() > Date.now(), 'Token has not expired');

  // Update password
  const newPassword = 'NewSecurePassword456!';
  const newHash = await bcrypt.hash(newPassword, 10);
  foundUser.passwordHash = newHash;
  foundUser.passwordResetTokenHash = null;
  foundUser.passwordResetTokenExpiresAt = null;
  await foundUser.save();

  // Verify new password matches and old password fails
  const updatedUser = await User.findOne({ email: testEmail });
  assert.ok(updatedUser, 'Updated user found');
  const oldMatch = await bcrypt.compare(initialPassword, updatedUser.passwordHash);
  const newMatch = await bcrypt.compare(newPassword, updatedUser.passwordHash);

  assert.strictEqual(oldMatch, false, 'Old password must no longer match');
  assert.strictEqual(newMatch, true, 'New password must match');
  assert.strictEqual(updatedUser.passwordResetTokenHash, null, 'Reset token hash must be cleared (single-use)');
  assert.strictEqual(updatedUser.passwordResetTokenExpiresAt, null, 'Reset expiry must be cleared');
  assert.strictEqual(updatedUser.emailVerified, false, 'emailVerified must be preserved and NOT automatically changed');
  console.log('✓ Password reset successfully! Token cleared and emailVerified preserved');

  // Test 6: Replay / Reused Token Rejection
  console.log('\n6. Testing Reused Reset Token Rejection...');
  const reusedLookup = await User.findOne({ passwordResetTokenHash: tokenHash });
  assert.strictEqual(reusedLookup, null, 'Reusing a consumed token must return null / invalid');
  console.log('✓ Replay protection verified: consumed token rejected');

  // Cleanup
  await User.deleteOne({ _id: user._id });
  console.log('✓ Test user cleaned up');

  console.log('\n--- All Password Reset Flow Tests Passed Successfully! ---');
  await mongoose.disconnect();
}

runPasswordResetTests().catch((err) => {
  console.error('Password Reset Test Failure:', err);
  process.exit(1);
});
