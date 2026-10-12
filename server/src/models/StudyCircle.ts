import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISnapshotVideo {
  videoId: string;
  youtubeVideoId: string;
  title: string;
  thumbnail: string;
  durationSeconds: number;
  position: number;
}

export interface IPlaylistSnapshot {
  sourceCourseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  totalVideos: number;
  totalDurationSeconds: number;
  videos: ISnapshotVideo[];
}

export interface IStudyCircle extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  hostId: mongoose.Types.ObjectId;
  sourceCourseId: mongoose.Types.ObjectId;
  memberCount: number;
  inviteCodeHash: string;
  playlistSnapshot: IPlaylistSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

const snapshotVideoSchema = new Schema<ISnapshotVideo>(
  {
    videoId: { type: String, required: true },
    youtubeVideoId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    thumbnail: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    position: { type: Number, required: true },
  },
  { _id: false }
);

const playlistSnapshotSchema = new Schema<IPlaylistSnapshot>(
  {
    sourceCourseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    channelName: { type: String, default: '' },
    totalVideos: { type: Number, default: 0 },
    totalDurationSeconds: { type: Number, default: 0 },
    videos: [snapshotVideoSchema],
  },
  { _id: false }
);

const studyCircleSchema = new Schema<IStudyCircle>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sourceCourseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    memberCount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 5,
    },
    inviteCodeHash: {
      type: String,
      required: true,
      index: true,
    },
    playlistSnapshot: {
      type: playlistSnapshotSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StudyCircle: Model<IStudyCircle> =
  mongoose.models.StudyCircle ||
  mongoose.model<IStudyCircle>('StudyCircle', studyCircleSchema);
