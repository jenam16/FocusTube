import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { StudyMaterial } from '../models/StudyMaterial.js';

// Helper to infer file type from URL or extension
const inferFileType = (url: string, explicitType?: string): string => {
  if (explicitType && explicitType.trim()) {
    return explicitType.trim().toLowerCase();
  }
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.pdf')) return 'pdf';
  if (cleanUrl.endsWith('.doc') || cleanUrl.endsWith('.docx')) return 'doc';
  if (cleanUrl.endsWith('.epub')) return 'epub';
  if (cleanUrl.endsWith('.ppt') || cleanUrl.endsWith('.pptx')) return 'ppt';
  if (cleanUrl.endsWith('.xls') || cleanUrl.endsWith('.xlsx')) return 'sheet';
  return 'link';
};

/**
 * GET /api/study-materials
 * List all study materials for the authenticated user with optional search and fileType filter
 */
export const getStudyMaterials = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { search, fileType } = req.query;

    const filter: Record<string, unknown> = { userId };

    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { originalUrl: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (fileType && typeof fileType === 'string' && fileType !== 'all') {
      filter.fileType = fileType.trim().toLowerCase();
    }

    const materials = await StudyMaterial.find(filter).sort({
      updatedAt: -1,
      createdAt: -1,
    });

    res.status(200).json({ materials });
  } catch (error) {
    console.error('Get study materials error:', error);
    res.status(500).json({ message: 'Failed to retrieve study materials' });
  }
};

/**
 * GET /api/study-materials/:id
 * Retrieve a single study material by ID
 */
export const getStudyMaterialById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ message: 'Study material not found' });
      return;
    }

    const material = await StudyMaterial.findOne({ _id: id, userId });
    if (!material) {
      res.status(404).json({ message: 'Study material not found' });
      return;
    }

    res.status(200).json({ material });
  } catch (error) {
    console.error('Get study material error:', error);
    res.status(500).json({ message: 'Failed to retrieve study material' });
  }
};

/**
 * POST /api/study-materials
 * Create a new study resource metadata record
 */
export const createStudyMaterial = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { name, originalUrl, fileType } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Resource name is required' });
      return;
    }

    if (!originalUrl || typeof originalUrl !== 'string' || !originalUrl.trim()) {
      res.status(400).json({ message: 'Original URL is required' });
      return;
    }

    const trimmedUrl = originalUrl.trim();
    // Validate basic URL scheme
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      res.status(400).json({
        message: 'Please provide a valid URL starting with http:// or https://',
      });
      return;
    }

    const resolvedFileType = inferFileType(trimmedUrl, fileType);

    const material = await StudyMaterial.create({
      userId,
      name: name.trim(),
      originalUrl: trimmedUrl,
      fileType: resolvedFileType,
    });

    res.status(201).json({
      material,
      message: 'Study material added successfully',
    });
  } catch (error) {
    console.error('Create study material error:', error);
    res.status(500).json({ message: 'Failed to create study material' });
  }
};

/**
 * PATCH /api/study-materials/:id
 * Update an existing study resource
 */
export const updateStudyMaterial = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ message: 'Study material not found' });
      return;
    }

    const material = await StudyMaterial.findOne({ _id: id, userId });
    if (!material) {
      res.status(404).json({ message: 'Study material not found' });
      return;
    }

    const { name, originalUrl, fileType } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ message: 'Resource name cannot be empty' });
        return;
      }
      material.name = name.trim();
    }

    if (originalUrl !== undefined) {
      if (typeof originalUrl !== 'string' || !originalUrl.trim()) {
        res.status(400).json({ message: 'Original URL cannot be empty' });
        return;
      }
      const trimmedUrl = originalUrl.trim();
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        res.status(400).json({
          message: 'Please provide a valid URL starting with http:// or https://',
        });
        return;
      }
      material.originalUrl = trimmedUrl;
      if (!fileType) {
        material.fileType = inferFileType(trimmedUrl, material.fileType);
      }
    }

    if (fileType !== undefined && typeof fileType === 'string' && fileType.trim()) {
      material.fileType = fileType.trim().toLowerCase();
    }

    await material.save();

    res.status(200).json({
      material,
      message: 'Study material updated successfully',
    });
  } catch (error) {
    console.error('Update study material error:', error);
    res.status(500).json({ message: 'Failed to update study material' });
  }
};

/**
 * DELETE /api/study-materials/:id
 * Remove a study material from the user's library
 */
export const deleteStudyMaterial = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ message: 'Study material not found' });
      return;
    }

    const deleted = await StudyMaterial.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      res.status(404).json({ message: 'Study material not found' });
      return;
    }

    res.status(200).json({ message: 'Study material deleted successfully' });
  } catch (error) {
    console.error('Delete study material error:', error);
    res.status(500).json({ message: 'Failed to delete study material' });
  }
};
