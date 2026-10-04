import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyMaterial extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  originalUrl: string;
  fileType: string;
  createdAt: Date;
  updatedAt: Date;
}

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: [200, 'Resource name cannot exceed 200 characters'],
    },
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
      default: 'pdf',
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user query performance
studyMaterialSchema.index({ userId: 1, createdAt: -1 });

export const StudyMaterial = mongoose.model<IStudyMaterial>(
  'StudyMaterial',
  studyMaterialSchema
);
