import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVideoProgress extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  watchedSeconds: number;
  durationSeconds: number;
  progressPercentage: number;
  completed: boolean;
  completedAt: Date | null;
  lastWatchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const videoProgressSchema = new Schema<IVideoProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    watchedSeconds: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring 1 progress record per user per video
videoProgressSchema.index({ user: 1, course: 1, video: 1 }, { unique: true });

// Query index for quick recent watch resolution
videoProgressSchema.index({ user: 1, lastWatchedAt: -1 });

// Query index for filtering completed course videos
videoProgressSchema.index({ user: 1, course: 1, completed: 1 });

export const VideoProgress: Model<IVideoProgress> =
  mongoose.models.VideoProgress ||
  mongoose.model<IVideoProgress>('VideoProgress', videoProgressSchema);

