import multer from 'multer';
import pdfParse from 'pdf-parse';
import StudyMaterial from '../models/StudyMaterial.js';
import { uploadFile, deleteFile } from '../services/s3Service.js';

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
          const pdfData = await pdfParse(req.file.buffer);
          transcribedText = pdfData.text;

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

      res.status(201).json({
        message: 'File uploaded successfully',
        material: await material.populate('uploadedBy', 'displayName email avatar'),
      });
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

export { uploadMaterial, getWorkspaceMaterials, deleteMaterial };
