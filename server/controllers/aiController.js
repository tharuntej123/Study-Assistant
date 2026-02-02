import StudyMaterial from '../models/StudyMaterial.js';
import FlashcardSet from '../models/FlashcardSet.js';
import { generateFlashcards, chatWithContext } from '../services/aiService.js';

const generateFlashcardsFromMaterial = async (req, res) => {
  try {
    const { materialId } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'Material ID is required' });
    }

    const material = await StudyMaterial.findOne({
      _id: materialId,
      workspaceId: req.workspace._id,
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (!material.transcribedText || material.transcribedText.trim() === '') {
      return res.status(400).json({ 
        error: 'No text available for flashcard generation. PDF may be empty or text extraction failed.' 
      });
    }

    const maxTokens = 30000;
    const textToProcess = material.transcribedText.substring(0, maxTokens);

    const flashcardsData = await generateFlashcards(textToProcess);

    const flashcardSet = await FlashcardSet.create({
      workspaceId: req.workspace._id,
      title: `Flashcards - ${material.title}`,
      cards: flashcardsData,
      createdBy: req.user._id,
      sourceId: material._id,
    });

    res.status(201).json({
      message: 'Flashcards generated successfully',
      flashcardSet: await flashcardSet.populate('createdBy', 'displayName email avatar'),
    });
  } catch (error) {
    console.error('Generate flashcards error:', error.message);
    res.status(500).json({ error: 'Server error generating flashcards' });
  }
};

const chatWithWorkspace = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const recentMaterials = await StudyMaterial.find({
      workspaceId: req.workspace._id,
      transcribedText: { $exists: true, $ne: '' },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('transcribedText title');

    if (recentMaterials.length === 0) {
      return res.status(400).json({ 
        error: 'No materials with text content found in this workspace. Please upload some PDFs first.' 
      });
    }

    let concatenatedText = '';
    const maxContextLength = 20000;

    for (const material of recentMaterials) {
      const materialText = `\n\n--- ${material.title} ---\n${material.transcribedText}`;
      
      if (concatenatedText.length + materialText.length > maxContextLength) {
        break;
      }
      
      concatenatedText += materialText;
    }

    const answer = await chatWithContext(query, concatenatedText);

    res.json({
      query,
      answer,
      sourcesUsed: recentMaterials.map(m => ({ id: m._id, title: m.title })),
    });
  } catch (error) {
    console.error('Chat with workspace error:', error.message);
    res.status(500).json({ error: 'Server error processing chat request' });
  }
};

const getWorkspaceFlashcards = async (req, res) => {
  try {
    const flashcardSets = await FlashcardSet.find({
      workspaceId: req.workspace._id,
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'displayName email avatar');

    res.json({ flashcardSets });
  } catch (error) {
    console.error('Get flashcards error:', error.message);
    res.status(500).json({ error: 'Server error fetching flashcards' });
  }
};

export { generateFlashcardsFromMaterial, chatWithWorkspace, getWorkspaceFlashcards };
