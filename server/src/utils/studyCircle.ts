import crypto from 'crypto';

/**
 * Generates an unpredictable, cryptographically random invitation code
 * and its corresponding SHA-256 hash for database storage.
 */
export const generateInviteCode = (): {
  rawCode: string;
  codeHash: string;
} => {
  // 16 bytes hex produces a clean 32-character unpredictable token
  const rawCode = crypto.randomBytes(16).toString('hex');
  const codeHash = hashInviteCode(rawCode);
  return { rawCode, codeHash };
};

/**
 * Hashes an invitation code with SHA-256.
 */
export const hashInviteCode = (rawCode: string): string => {
  return crypto.createHash('sha256').update(rawCode.trim()).digest('hex');
};

/**
 * Calculates progress percentage deterministically.
 */
export const calculateCircleProgress = (
  completedVideos: number,
  totalVideos: number
): number => {
  if (totalVideos <= 0 || completedVideos <= 0) return 0;
  if (completedVideos >= totalVideos) return 100;
  return Math.min(99, Math.max(1, Math.round((completedVideos / totalVideos) * 100)));
};

