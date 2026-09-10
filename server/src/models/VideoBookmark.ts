import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVideoBookmark extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const videoBookmarkSchema = new Schema<IVideoBookmark>(
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
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate bookmarks per user/video
videoBookmarkSchema.index({ user: 1, video: 1 }, { unique: true });
// Fast query for all bookmarks of a user in a course
videoBookmarkSchema.index({ user: 1, course: 1 });

export const VideoBookmark: Model<IVideoBookmark> =
  mongoose.models.VideoBookmark ||
  mongoose.model<IVideoBookmark>('VideoBookmark', videoBookmarkSchema);
