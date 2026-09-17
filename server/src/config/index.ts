import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/focustube',
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  jwtSecret:
    process.env.JWT_SECRET ||
    'focustube_default_super_secret_jwt_key_change_in_production_32',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

console.log("Cloudinary Config:", {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING",
  apiSecret: process.env.CLOUDINARY_API_SECRET ? "LOADED" : "MISSING",
});
