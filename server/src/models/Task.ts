import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
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
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ user: 1, date: -1, createdAt: -1 });

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
