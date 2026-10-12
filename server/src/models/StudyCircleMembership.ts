import mongoose, { Document, Model, Schema } from 'mongoose';

export type CircleRole = 'host' | 'member';

export interface IStudyCircleMembership extends Document {
  _id: mongoose.Types.ObjectId;
  circleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: CircleRole;
  currentVideoId: string;
  positionSeconds: number;
  completedVideoIds: string[];
  completedVideosCount: number;
  progressPercentage: number;
  lastActiveAt: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studyCircleMembershipSchema = new Schema<IStudyCircleMembership>(
  {
    circleId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyCircle',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['host', 'member'],
      default: 'member',
      required: true,
    },
    currentVideoId: {
      type: String,
      default: '',
    },
    positionSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedVideoIds: {
      type: [String],
      default: [],
    },
    completedVideosCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only be a member of a circle once
studyCircleMembershipSchema.index({ circleId: 1, userId: 1 }, { unique: true });

export const StudyCircleMembership: Model<IStudyCircleMembership> =
  mongoose.models.StudyCircleMembership ||
  mongoose.model<IStudyCircleMembership>(
    'StudyCircleMembership',
    studyCircleMembershipSchema
  );
