import mongoose from 'mongoose';

const flashcardSetSchema = new mongoose.Schema(
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
    cards: [
      {
        front: {
          type: String,
          required: true,
        },
        back: {
          type: String,
          required: true,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyMaterial',
    },
  },
  {
    timestamps: true,
  }
);

flashcardSetSchema.index({ workspaceId: 1 });

export default mongoose.model('FlashcardSet', flashcardSetSchema);
