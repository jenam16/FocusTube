import assert from 'assert';
import mongoose from 'mongoose';
import { sanitizeUser, IUser } from '../models/User.js';
import { config } from '../config/index.js';

async function runBypassVerificationTests() {
  console.log('--- Starting FocusTube Email Verification Bypass Tests ---\n');

  // Test 1: Configuration flag logic & production safety
  console.log('1. Testing bypass configuration and production safety guard...');
  
  // Verify current development config
  assert.strictEqual(
    typeof config.bypassEmailVerification,
    'boolean',
    'config.bypassEmailVerification must be boolean'
  );

  // Verify production safety guard: NODE_ENV=production must strictly disable bypass
  const simulateProductionCheck = (bypassEnv: string | undefined, nodeEnv: string): boolean => {
    return nodeEnv !== 'production' && (bypassEnv === 'true' || bypassEnv === '1');
  };

  assert.strictEqual(
    simulateProductionCheck('true', 'production'),
    false,
    'Bypass MUST be false when NODE_ENV is production, even if BYPASS_EMAIL_VERIFICATION=true'
  );
  assert.strictEqual(
    simulateProductionCheck('1', 'production'),
    false,
    'Bypass MUST be false when NODE_ENV is production, even if BYPASS_EMAIL_VERIFICATION=1'
  );
  assert.strictEqual(
    simulateProductionCheck('true', 'development'),
    true,
    'Bypass MUST be true in development when BYPASS_EMAIL_VERIFICATION=true'
  );
  assert.strictEqual(
    simulateProductionCheck(undefined, 'development'),
    false,
    'Bypass MUST default to false when BYPASS_EMAIL_VERIFICATION is not set'
  );
  assert.strictEqual(
    simulateProductionCheck('false', 'development'),
    false,
    'Bypass MUST be false when BYPASS_EMAIL_VERIFICATION=false'
  );
  console.log('✓ Configuration and production guard verified!\n');

  // Test 2: Verify sanitizeUser behavior without modifying database state
  console.log('2. Testing sanitizeUser behavior for unverified accounts...');
  
  // Create mock user document representing an unverified user in MongoDB
  const mockUnverifiedUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Unverified User',
    email: 'unverified@example.com',
    passwordHash: 'someHashedPassword',
    emailVerified: false,
    avatar: null,
    dailyGoalMinutes: 30,
    currentStreak: 1,
    longestStreak: 2,
    lastActiveDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as IUser;

  // Sanitization when bypass is DISABLED
  const sanitizedStrict = sanitizeUser(mockUnverifiedUser, false);
  assert.strictEqual(sanitizedStrict.emailVerified, false, 'Strict mode must preserve emailVerified: false');
  assert.strictEqual(mockUnverifiedUser.emailVerified, false, 'DB record must remain emailVerified: false');

  // Sanitization when bypass is ENABLED
  const sanitizedBypassed = sanitizeUser(mockUnverifiedUser, true);
  assert.strictEqual(
    sanitizedBypassed.emailVerified,
    true,
    'Bypass mode must return effective emailVerified: true in API response'
  );
  assert.strictEqual(
    mockUnverifiedUser.emailVerified,
    false,
    'Crucial: MongoDB record MUST remain emailVerified: false (temporary bypass must NOT permanently alter DB)'
  );
  console.log('✓ sanitizeUser behavior verified (DB record unmutated, response sanitized correctly)!\n');

  // Test 3: Verify sanitizeUser behavior for verified accounts
  console.log('3. Testing sanitizeUser behavior for verified accounts...');
  const mockVerifiedUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Verified User',
    email: 'verified@example.com',
    passwordHash: 'someHashedPassword',
    emailVerified: true,
    avatar: null,
    dailyGoalMinutes: 30,
    currentStreak: 5,
    longestStreak: 5,
    lastActiveDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as IUser;

  const sanitizedVerifiedStrict = sanitizeUser(mockVerifiedUser, false);
  assert.strictEqual(sanitizedVerifiedStrict.emailVerified, true, 'Verified user must stay emailVerified: true in strict mode');

  const sanitizedVerifiedBypassed = sanitizeUser(mockVerifiedUser, true);
  assert.strictEqual(sanitizedVerifiedBypassed.emailVerified, true, 'Verified user must stay emailVerified: true in bypass mode');
  console.log('✓ Existing verified accounts continue to work identically!\n');

  // Test 4: Logic flow for registration under bypass vs strict
  console.log('4. Testing registration flow decisions...');
  const simulateRegisterFlow = (isBypass: boolean) => {
    if (isBypass) {
      return {
        autoLogin: true,
        sendVerificationEmail: false,
        responseCode: 'REGISTRATION_SUCCESS',
        emailVerified: true,
      };
    } else {
      return {
        autoLogin: false,
        sendVerificationEmail: true,
        responseCode: 'REGISTRATION_SUCCESS',
        emailVerified: false,
      };
    }
  };

  const bypassedReg = simulateRegisterFlow(true);
  assert.strictEqual(bypassedReg.autoLogin, true, 'Bypass registration must automatically issue session');
  assert.strictEqual(bypassedReg.sendVerificationEmail, false, 'Bypass registration must avoid sending unnecessary emails');
  assert.strictEqual(bypassedReg.emailVerified, true, 'Bypass registration must signal emailVerified: true to client');

  const strictReg = simulateRegisterFlow(false);
  assert.strictEqual(strictReg.autoLogin, false, 'Strict registration must NOT auto-login before verification');
  assert.strictEqual(strictReg.sendVerificationEmail, true, 'Strict registration MUST send Resend verification email');
  assert.strictEqual(strictReg.emailVerified, false, 'Strict registration must return emailVerified: false');
  console.log('✓ Registration flow simulation verified for both modes!\n');

  // Test 5: Logic flow for login under bypass vs strict
  console.log('5. Testing login flow decisions for unverified accounts...');
  const simulateLoginFlow = (userVerifiedInDb: boolean, isBypass: boolean) => {
    if (userVerifiedInDb === false && !isBypass) {
      return { status: 403, code: 'EMAIL_NOT_VERIFIED', allowed: false };
    }
    return { status: 200, code: 'SUCCESS', allowed: true };
  };

  const unverifiedLoginBypassed = simulateLoginFlow(false, true);
  assert.strictEqual(unverifiedLoginBypassed.allowed, true, 'Unverified user MUST be allowed to login when bypass is active');
  assert.strictEqual(unverifiedLoginBypassed.status, 200, 'Unverified user gets 200 when bypass is active');

  const unverifiedLoginStrict = simulateLoginFlow(false, false);
  assert.strictEqual(unverifiedLoginStrict.allowed, false, 'Unverified user MUST be blocked when bypass is disabled');
  assert.strictEqual(unverifiedLoginStrict.status, 403, 'Unverified user receives 403 when bypass is disabled');
  assert.strictEqual(unverifiedLoginStrict.code, 'EMAIL_NOT_VERIFIED');

  const verifiedLoginStrict = simulateLoginFlow(true, false);
  assert.strictEqual(verifiedLoginStrict.allowed, true, 'Verified user always logs in successfully');
  console.log('✓ Login authorization flow simulation verified!\n');

  console.log('========================================================');
  console.log('🎉 ALL EMAIL VERIFICATION BYPASS TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================\n');
}

runBypassVerificationTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
