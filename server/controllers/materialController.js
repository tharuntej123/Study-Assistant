import multer from 'multer';
import { createRequire } from 'module';
import StudyMaterial from '../models/StudyMaterial.js';
import FlashcardSet from '../models/FlashcardSet.js';
import { uploadFile, deleteFile } from '../services/s3Service.js';
import { generateSummary, generateFlashcards } from '../services/aiService.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse-fork');

// Background AI processing function (non-blocking)
const processAIContent = async (material, workspaceId, userId) => {
  try {
    if (!material.transcribedText || material.transcribedText.trim() === '') {
      console.log(`No text to process for material ${material._id}`);
      return;
    }

    const textToProcess = material.transcribedText.substring(0, 20000);

    // Generate summary
    try {
      const summary = await generateSummary(textToProcess);
      await StudyMaterial.findByIdAndUpdate(material._id, {
        summary,
        isProcessed: true,
      });
      console.log(`Summary generated for material ${material._id}`);
    } catch (summaryError) {
      console.error(`Summary generation failed for ${material._id}:`, summaryError.message);
    }

    // Generate flashcards
    try {
      const flashcardsData = await generateFlashcards(textToProcess);
      await FlashcardSet.create({
        workspaceId,
        title: `Flashcards - ${material.title}`,
        cards: flashcardsData,
        createdBy: userId,
        sourceId: material._id,
      });
      console.log(`Flashcards generated for material ${material._id}`);
    } catch (flashcardError) {
      console.error(`Flashcard generation failed for ${material._id}:`, flashcardError.message);
    }
  } catch (error) {
    console.error(`AI processing failed for material ${material._id}:`, error.message);
  }
};

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
}).single('file');

const uploadMaterial = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';

      const { location, key } = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.workspace._id
      );

      let transcribedText = '';

      if (req.file.mimetype === 'application/pdf') {
        try {
          const data = await pdfParse(req.file.buffer);
          transcribedText = data.text || '';

          const maxTextSize = 5 * 1024 * 1024;
          if (transcribedText.length > maxTextSize) {
            transcribedText = transcribedText.substring(0, maxTextSize);
          }
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError.message);
        }
      }

      const material = await StudyMaterial.create({
        workspaceId: req.workspace._id,
        title,
        type: fileType,
        s3Key: key,
        fileUrl: location,
        transcribedText,
        uploadedBy: req.user._id,
      });

      // Respond immediately to user
      res.status(201).json({
        message: 'File uploaded successfully. AI processing started in background.',
        material: await material.populate('uploadedBy', 'displayName email avatar'),
        processing: true,
      });

      // Start AI processing in background (non-blocking)
      if (fileType === 'pdf' && transcribedText) {
        processAIContent(material, req.workspace._id, req.user._id);
      }
    });
  } catch (error) {
    console.error('Upload material error:', error.message);
    res.status(500).json({ error: 'Server error uploading material' });
  }
};

const getWorkspaceMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ workspaceId: req.workspace._id })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'displayName email avatar');

    res.json({ materials });
  } catch (error) {
    console.error('Get workspace materials error:', error.message);
    res.status(500).json({ error: 'Server error fetching materials' });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await StudyMaterial.findOne({
      _id: materialId,
      workspaceId: req.workspace._id,
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    await deleteFile(material.s3Key);

    await StudyMaterial.findByIdAndDelete(materialId);

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error.message);
    res.status(500).json({ error: 'Server error deleting material' });
  }
};

const getMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await StudyMaterial.findOne({
      _id: materialId,
      workspaceId: req.workspace._id,
    }).populate('uploadedBy', 'displayName email avatar');

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ material });
  } catch (error) {
    console.error('Get material error:', error.message);
    res.status(500).json({ error: 'Server error fetching material' });
  }
};

export { uploadMaterial, getWorkspaceMaterials, deleteMaterial, getMaterial };
