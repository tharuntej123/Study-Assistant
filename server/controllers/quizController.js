import Quiz from '../models/Quiz.js';
import UserProgress from '../models/UserProgress.js';
import StudyMaterial from '../models/StudyMaterial.js';
import { generateQuiz } from '../services/aiService.js';

const generateQuizFromMaterial = async (req, res) => {
  try {
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'Material ID is required' });
    }

    // Check if quiz already exists for this material (Cache hit)
    const existingQuiz = await Quiz.findOne({
      workspaceId: req.workspace._id,
      materialId,
    });

    if (existingQuiz) {
      return res.json({
        message: 'Quiz loaded from cache',
        quiz: existingQuiz,
        cached: true,
      });
    }

    // Fetch the material
    const material = await StudyMaterial.findOne({
      _id: materialId,
      workspaceId: req.workspace._id,
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (!material.transcribedText || material.transcribedText.trim() === '') {
      return res.status(400).json({
        error: 'No text available for quiz generation. PDF may be empty or text extraction failed.',
      });
    }

    // Generate quiz using AI
    const questionsData = await generateQuiz(material.transcribedText);

    // Create and save the quiz
    const quiz = await Quiz.create({
      workspaceId: req.workspace._id,
      materialId: material._id,
      title: `Quiz - ${material.title}`,
      questions: questionsData,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Quiz generated successfully',
      quiz,
      cached: false,
    });
  } catch (error) {
    console.error('Generate quiz error:', error.message);
    res.status(500).json({ error: 'Server error generating quiz' });
  }
};

const getQuizByMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const quiz = await Quiz.findOne({
      workspaceId: req.workspace._id,
      materialId,
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found for this material' });
    }

    res.json({ quiz });
  } catch (error) {
    console.error('Get quiz error:', error.message);
    res.status(500).json({ error: 'Server error fetching quiz' });
  }
};

const getWorkspaceQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ workspaceId: req.workspace._id })
      .sort({ createdAt: -1 })
      .populate('materialId', 'title')
      .populate('createdBy', 'displayName email avatar');

    res.json({ quizzes });
  } catch (error) {
    console.error('Get workspace quizzes error:', error.message);
    res.status(500).json({ error: 'Server error fetching quizzes' });
  }
};

const saveQuizResult = async (req, res) => {
  try {
    const { quizId, score, totalQuestions } = req.body;

    if (!quizId || score === undefined || !totalQuestions) {
      return res.status(400).json({ error: 'Quiz ID, score, and total questions are required' });
    }

    const quiz = await Quiz.findOne({
      _id: quizId,
      workspaceId: req.workspace._id,
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const percentage = Math.round((score / totalQuestions) * 100);

    const progress = await UserProgress.create({
      userId: req.user._id,
      workspaceId: req.workspace._id,
      quizId,
      score,
      totalQuestions,
      percentage,
    });

    res.status(201).json({
      message: 'Quiz result saved',
      progress,
    });
  } catch (error) {
    console.error('Save quiz result error:', error.message);
    res.status(500).json({ error: 'Server error saving quiz result' });
  }
};

const getUserProgress = async (req, res) => {
  try {
    const progress = await UserProgress.find({
      userId: req.user._id,
      workspaceId: req.workspace._id,
    })
      .sort({ completedAt: -1 })
      .populate('quizId', 'title');

    res.json({ progress });
  } catch (error) {
    console.error('Get user progress error:', error.message);
    res.status(500).json({ error: 'Server error fetching progress' });
  }
};

export {
  generateQuizFromMaterial,
  getQuizByMaterial,
  getWorkspaceQuizzes,
  saveQuizResult,
  getUserProgress,
};
