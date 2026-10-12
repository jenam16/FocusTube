import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStudyCircleDiscussion extends Document {
  _id: mongoose.Types.ObjectId;
  circleId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title?: string;
  body: string;
  videoId?: string;
  videoTitle?: string;
  timestampSeconds?: number;
  parentId: mongoose.Types.ObjectId | null;
  isResolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const studyCircleDiscussionSchema = new Schema<IStudyCircleDiscussion>(
  {
    circleId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyCircle',
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    videoId: {
      type: String,
      trim: true,
    },
    videoTitle: {
      type: String,
      trim: true,
    },
    timestampSeconds: {
      type: Number,
      min: 0,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyCircleDiscussion',
      default: null,
      index: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

studyCircleDiscussionSchema.index({ circleId: 1, parentId: 1, createdAt: 1 });

export const StudyCircleDiscussion: Model<IStudyCircleDiscussion> =
  mongoose.models.StudyCircleDiscussion ||
  mongoose.model<IStudyCircleDiscussion>(
    'StudyCircleDiscussion',
    studyCircleDiscussionSchema
  );
