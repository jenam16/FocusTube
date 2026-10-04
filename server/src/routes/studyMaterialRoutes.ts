import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getStudyMaterials,
  getStudyMaterialById,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
} from '../controllers/studyMaterialController.js';

const router = Router();

// All study material endpoints require authentication
router.use(authenticate);

router.get('/', getStudyMaterials);
router.post('/', createStudyMaterial);
router.get('/:id', getStudyMaterialById);
router.patch('/:id', updateStudyMaterial);
router.delete('/:id', deleteStudyMaterial);

export default router;
