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
  generateQuizFromMaterial,
  getQuizByMaterial,
  getWorkspaceQuizzes,
  saveQuizResult,
  getUserProgress,
} from '../controllers/quizController.js';
import {
  getUserWorkspaces,
  createWorkspace,
} from '../controllers/workspaceController.js';
import {
  getWorkspaceSessions,
  createSession,
  updateSession,
  deleteSession,
  getStudyStats,
  checkCalendarStatus,
  syncSessionToCalendar,
} from '../controllers/scheduleController.js';

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

// Quiz routes
router.post(
  '/:workspaceId/quiz/generate',
  protect,
  validateWorkspaceAccess,
  generateQuizFromMaterial
);

router.get(
  '/:workspaceId/quiz',
  protect,
  validateWorkspaceAccess,
  getWorkspaceQuizzes
);

router.get(
  '/:workspaceId/quiz/material/:materialId',
  protect,
  validateWorkspaceAccess,
  getQuizByMaterial
);

router.post(
  '/:workspaceId/quiz/save-result',
  protect,
  validateWorkspaceAccess,
  saveQuizResult
);

router.get(
  '/:workspaceId/progress',
  protect,
  validateWorkspaceAccess,
  getUserProgress
);

// Schedule routes
router.get(
  '/:workspaceId/sessions',
  protect,
  validateWorkspaceAccess,
  getWorkspaceSessions
);

router.post(
  '/:workspaceId/sessions',
  protect,
  validateWorkspaceAccess,
  createSession
);

router.put(
  '/:workspaceId/sessions/:sessionId',
  protect,
  validateWorkspaceAccess,
  updateSession
);

router.delete(
  '/:workspaceId/sessions/:sessionId',
  protect,
  validateWorkspaceAccess,
  deleteSession
);

router.get(
  '/:workspaceId/schedule/stats',
  protect,
  validateWorkspaceAccess,
  getStudyStats
);

router.get(
  '/:workspaceId/schedule/calendar-status',
  protect,
  validateWorkspaceAccess,
  checkCalendarStatus
);

router.post(
  '/:workspaceId/sessions/:sessionId/sync',
  protect,
  validateWorkspaceAccess,
  syncSessionToCalendar
);

export default router;
