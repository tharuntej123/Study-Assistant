import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    transcribedText: {
      type: String,
    },
    summary: {
      type: String,
      default: '',
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

studyMaterialSchema.index({ workspaceId: 1 });

export default mongoose.model('StudyMaterial', studyMaterialSchema);
