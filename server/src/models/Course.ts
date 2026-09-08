import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  playlistId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  totalVideos: number;
  totalDurationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    playlistId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    channelName: {
      type: String,
      default: '',
      trim: true,
    },
    totalVideos: {
      type: Number,
      default: 0,
    },
    totalDurationSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a user cannot import the same playlist multiple times
courseSchema.index({ userId: 1, playlistId: 1 }, { unique: true });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
