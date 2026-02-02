import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateWorkspaceAccess, requireRole } from '../middleware/workspaceMiddleware.js';
import {
  uploadMaterial,
  getWorkspaceMaterials,
  deleteMaterial,
} from '../controllers/materialController.js';
import {
  generateFlashcardsFromMaterial,
  chatWithWorkspace,
} from '../controllers/aiController.js';

const router = express.Router();

router.post(
  '/:workspaceId/upload',
  protect,
  validateWorkspaceAccess,
  requireRole('admin', 'editor'),
  uploadMaterial
);

router.get(
  '/:workspaceId/materials',
  protect,
  validateWorkspaceAccess,
  getWorkspaceMaterials
);

router.delete(
  '/:workspaceId/materials/:materialId',
  protect,
  validateWorkspaceAccess,
  requireRole('admin', 'editor'),
  deleteMaterial
);

router.post(
  '/:workspaceId/flashcards/generate',
  protect,
  validateWorkspaceAccess,
  requireRole('admin', 'editor'),
  generateFlashcardsFromMaterial
);

router.post(
  '/:workspaceId/chat',
  protect,
  validateWorkspaceAccess,
  chatWithWorkspace
);

export default router;
