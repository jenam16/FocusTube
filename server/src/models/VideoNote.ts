import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVideoNote extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  title: string;
  content: string;
  timestampSeconds: number | null;
  isPinned: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const videoNoteSchema = new Schema<IVideoNote>(
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
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    timestampSeconds: {
      type: Number,
      default: null,
      min: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookups for notes of a specific video, sorted chronologically
videoNoteSchema.index({ user: 1, video: 1, timestampSeconds: 1, createdAt: 1 });
// Compound index for paginated workspace notes (pinned first, then recently updated)
videoNoteSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });
// Fast lookups for course-grouped sidebar notes
videoNoteSchema.index({ user: 1, course: 1, updatedAt: -1 });
// Fast lookups for tag searches
videoNoteSchema.index({ user: 1, tags: 1 });

export const VideoNote: Model<IVideoNote> =
  mongoose.models.VideoNote || mongoose.model<IVideoNote>('VideoNote', videoNoteSchema);

