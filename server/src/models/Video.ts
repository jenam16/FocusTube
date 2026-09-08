import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVideo extends Document {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  youtubeVideoId: string;
  title: string;
  thumbnail: string;
  durationSeconds: number;
  position: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    youtubeVideoId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.index({ courseId: 1, position: 1 });

export const Video: Model<IVideo> =
  mongoose.models.Video || mongoose.model<IVideo>('Video', videoSchema);
