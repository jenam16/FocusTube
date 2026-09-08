import { Response } from 'express';
import { User, sanitizeUser } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const syncUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { name, avatar, dailyGoalMinutes } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    if (typeof dailyGoalMinutes === 'number' && dailyGoalMinutes > 0) {
      user.dailyGoalMinutes = dailyGoalMinutes;
    }

    await user.save();

    res.status(200).json({
      user: sanitizeUser(user),
      message: 'User synchronized successfully',
    });
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ message: 'Internal server error during user sync' });
  }
};
