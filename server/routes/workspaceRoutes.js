import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateWorkspaceAccess, requireRole } from '../middleware/workspaceMiddleware.js';
import {
  uploadMaterial,
  getWorkspaceMaterials,
  deleteMaterial,
  getMaterial,
} from '../controllers/materialController.js';
import {
  generateFlashcardsFromMaterial,
  chatWithWorkspace,
  getWorkspaceFlashcards,
  summarizeMaterial,
} from '../controllers/aiController.js';
import {
  getUserWorkspaces,
  createWorkspace,
} from '../controllers/workspaceController.js';

const router = express.Router();

router.get('/', protect, getUserWorkspaces);
router.post('/', protect, createWorkspace);

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

router.get(
  '/:workspaceId/materials/:materialId',
  protect,
  validateWorkspaceAccess,
  getMaterial
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

router.get(
  '/:workspaceId/flashcards',
  protect,
  validateWorkspaceAccess,
  getWorkspaceFlashcards
);

router.post(
  '/:workspaceId/chat',
  protect,
  validateWorkspaceAccess,
  chatWithWorkspace
);

router.post(
  '/:workspaceId/materials/:materialId/summarize',
  protect,
  validateWorkspaceAccess,
  summarizeMaterial
);

export default router;
