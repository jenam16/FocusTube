import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  course?: mongoose.Types.ObjectId | null;
  video?: mongoose.Types.ObjectId | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt: Date | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
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
    date: {
      type: Date,
      required: true,
      default: () => {
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        return now;
      },
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ user: 1, date: 1, completed: 1 });
taskSchema.index({ user: 1, date: -1, createdAt: -1 });
taskSchema.index({ user: 1, course: 1 });

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);

