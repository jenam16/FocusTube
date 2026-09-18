import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  verificationTokenHash: string | null;
  verificationTokenExpiresAt: Date | null;
  lastVerificationSentAt: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetTokenExpiresAt?: Date | null;
  lastPasswordResetSentAt?: Date | null;
  avatar: string | null;
  dailyGoalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatar: string | null;
  dailyGoalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    verificationTokenExpiresAt: {
      type: Date,
      default: null,
    },
    lastVerificationSentAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
      default: null,
    },
    lastPasswordResetSentAt: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    dailyGoalMinutes: {
      type: Number,
      default: 30,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const sanitizeUser = (user: IUser): SanitizedUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified ?? false,
  avatar: user.avatar,
  dailyGoalMinutes: user.dailyGoalMinutes,
  currentStreak: user.currentStreak,
  longestStreak: user.longestStreak,
  lastActiveDate: user.lastActiveDate,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
