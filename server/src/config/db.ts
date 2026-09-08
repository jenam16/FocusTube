import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDB = async (): Promise<void> => {
  if (!config.mongoUri) {
    console.warn('MongoDB URI is not configured.');
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};
