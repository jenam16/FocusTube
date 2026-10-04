import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAISummaryMoment {
  startTime: number;
  time: string;
  title: string;
  description: string;
}

export interface IAISummary {
  summary: string;
  keyConcepts: string[];
  importantMoments: IAISummaryMoment[];
  quickRevision: string[];
  generatedAt: Date;
}

export interface IVideo extends Document {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  youtubeVideoId: string;
  title: string;
  thumbnail: string;
  durationSeconds: number;
  position: number;
  isAvailable: boolean;
  aiSummary?: IAISummary;
  createdAt: Date;
  updatedAt: Date;
}

const aiSummaryMomentSchema = new Schema<IAISummaryMoment>(
  {
    startTime: { type: Number, required: true },
    time: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const aiSummarySchema = new Schema<IAISummary>(
  {
    summary: { type: String, required: true },
    keyConcepts: [{ type: String }],
    importantMoments: [aiSummaryMomentSchema],
    quickRevision: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
    aiSummary: {
      type: aiSummarySchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.index({ courseId: 1, position: 1 });

export const Video: Model<IVideo> =
  mongoose.models.Video || mongoose.model<IVideo>('Video', videoSchema);
