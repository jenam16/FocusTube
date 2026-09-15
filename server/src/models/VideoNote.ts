import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVideoNote extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  noteType: 'text' | 'screenshot';
  screenshotUrl?: string;
  cloudinaryPublicId?: string;
  youtubeVideoId?: string;
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
    noteType: {
      type: String,
      enum: ['text', 'screenshot'],
      default: 'text',
      index: true,
    },
    screenshotUrl: {
      type: String,
      default: undefined,
    },
    cloudinaryPublicId: {
      type: String,
      default: undefined,
    },
    youtubeVideoId: {
      type: String,
      default: undefined,
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
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
// Fast lookups for screenshot notes filtered by noteType & created date
videoNoteSchema.index({ user: 1, noteType: 1, createdAt: -1 });
// Fast lookups for course-filtered screenshot notes
videoNoteSchema.index({ user: 1, course: 1, noteType: 1, createdAt: -1 });

export const VideoNote: Model<IVideoNote> =
  mongoose.models.VideoNote || mongoose.model<IVideoNote>('VideoNote', videoNoteSchema);
