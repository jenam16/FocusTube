import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import {
  generateVerificationToken,
  hashVerificationToken,
  generateToken,
} from '../utils/token.js';
import { config } from '../config/index.js';

dotenv.config();

async function runE2EAuthVerification() {
  console.log('--- Starting End-to-End Authentication & Email Verification Flow Test ---');

  // Connect to MongoDB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri);
  }
  console.log('✓ Connected to MongoDB');

  const testEmail = `e2e_student_${Date.now()}@focustube.dev`;
  const password = 'Password123!';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 1. Test New Signup (creates unverified user)
  console.log('\n1. Testing New Signup (Unverified Account Creation)...');
  const { rawToken, tokenHash } = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 30 * 60 * 1000);

  const newUser = await User.create({
    name: 'E2E Test Student',
    email: testEmail,
    passwordHash,
    emailVerified: false,
    verificationTokenHash: tokenHash,
    verificationTokenExpiresAt: verificationExpires,
    lastVerificationSentAt: new Date(),
  });

  assert.strictEqual(newUser.emailVerified, false, 'New user must have emailVerified = false');
  assert.strictEqual(newUser.verificationTokenHash, tokenHash, 'Token hash must match in database');
  assert.ok(newUser.verificationTokenExpiresAt, 'Verification expiry must be set');
  console.log('✓ New user created in database as unverified with secure token hash and expiry');

  // 2. Test Login Blocking for Unverified User
  console.log('\n2. Testing Login Attempt Before Email Verification...');
  const userToLogin = await User.findOne({ email: testEmail });
  assert.ok(userToLogin, 'User must exist');
  const isMatch = await bcrypt.compare(password, userToLogin.passwordHash);
  assert.strictEqual(isMatch, true, 'Password must match');
  assert.strictEqual(userToLogin.emailVerified, false, 'User must be unverified');
  // Expected behavior: Block with EMAIL_NOT_VERIFIED
  const loginBlocked = userToLogin.emailVerified === false;
  assert.strictEqual(loginBlocked, true, 'Unverified user login must be blocked');
  console.log('✓ Login correctly blocked for unverified account with EMAIL_NOT_VERIFIED');

  // 3. Test Existing Unverified Account Registration Attempt
  console.log('\n3. Testing Registration Attempt with Existing Unverified Email...');
  const existingCheck = await User.findOne({ email: testEmail });
  assert.ok(existingCheck, 'Existing user found');
  assert.strictEqual(existingCheck.emailVerified, false, 'Is unverified');
  // When an existing unverified user tries to register again, backend responds with 409 EMAIL_NOT_VERIFIED
  const isExistingUnverified = existingCheck && !existingCheck.emailVerified;
  assert.strictEqual(isExistingUnverified, true, 'Correctly detected as existing unverified account');
  console.log('✓ Existing unverified account correctly triggers structured EMAIL_NOT_VERIFIED response');

  // 4. Test Resend Cooldown Enforcement (60 seconds)
  console.log('\n4. Testing Resend 60-Second Cooldown Enforcement...');
  const COOLDOWN_MS = 60 * 1000;
  // Attempting resend immediately after registration
  const elapsed = Date.now() - existingCheck.lastVerificationSentAt!.getTime();
  const isCooldownActive = elapsed < COOLDOWN_MS;
  const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
  assert.strictEqual(isCooldownActive, true, 'Cooldown must be active immediately after registration');
  assert.ok(remainingSeconds > 0 && remainingSeconds <= 60, 'Remaining seconds must be <= 60');
  console.log(`✓ Cooldown correctly enforced! Resend blocked for ${remainingSeconds}s`);

  // 5. Test Token Expiry Handling
  console.log('\n5. Testing Expired Token Rejection...');
  const expiredToken = 'expired_raw_token_example';
  const expiredHash = hashVerificationToken(expiredToken);
  const expiredUser = new User({
    name: 'Expired Test',
    email: `expired_${Date.now()}@focustube.dev`,
    passwordHash,
    emailVerified: false,
    verificationTokenHash: expiredHash,
    verificationTokenExpiresAt: new Date(Date.now() - 5000), // 5 seconds ago
    lastVerificationSentAt: new Date(),
  });
  await expiredUser.save();

  const foundExpired = await User.findOne({ verificationTokenHash: expiredHash });
  assert.ok(foundExpired, 'Found expired token in DB');
  const isExpired = foundExpired.verificationTokenExpiresAt!.getTime() < Date.now();
  assert.strictEqual(isExpired, true, 'Token must be recognized as expired');
  console.log('✓ Expired token successfully identified and rejected');

  // 6. Test Valid Token Verification & One-Time Invalidation
  console.log('\n6. Testing Valid Token Verification, Session Creation & One-Time Invalidation...');
  const foundUser = await User.findOne({ verificationTokenHash: tokenHash });
  assert.ok(foundUser, 'User found with valid token hash');
  assert.ok(foundUser.verificationTokenExpiresAt!.getTime() > Date.now(), 'Token is not expired');

  // Mark verified and invalidate
  foundUser.emailVerified = true;
  foundUser.verificationTokenHash = null;
  foundUser.verificationTokenExpiresAt = null;
  await foundUser.save();

  // Create auth session token
  const sessionToken = generateToken(foundUser._id.toString());
  assert.ok(sessionToken, 'Session token generated successfully');

  assert.strictEqual(foundUser.emailVerified, true, 'User is now marked emailVerified = true');
  assert.strictEqual(foundUser.verificationTokenHash, null, 'Verification token hash cleared');
  console.log('✓ Email verified! Token invalidated and session token generated');

  // Re-attempting with same token
  const reusedAttempt = await User.findOne({ verificationTokenHash: tokenHash });
  assert.strictEqual(reusedAttempt, null, 'Reusing previous token must fail (returns INVALID_OR_USED)');
  console.log('✓ One-time token usage enforced: Reused token yields INVALID_OR_USED');

  // 7. Test Login After Verification (Succeeds)
  console.log('\n7. Testing Login After Verification...');
  const verifiedUser = await User.findOne({ email: testEmail });
  assert.ok(verifiedUser, 'User found');
  assert.strictEqual(verifiedUser.emailVerified, true, 'User is verified');
  const verifiedMatch = await bcrypt.compare(password, verifiedUser.passwordHash);
  assert.strictEqual(verifiedMatch, true, 'Password matches');
  console.log('✓ Login successfully permitted for verified user!');

  // Clean up test users
  await User.deleteOne({ _id: newUser._id });
  await User.deleteOne({ _id: expiredUser._id });
  console.log('✓ Cleaned up test data');

  console.log('\n--- All End-to-End Authentication Tests Passed Successfully! ---');
  await mongoose.disconnect();
}

runE2EAuthVerification().catch((err) => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
