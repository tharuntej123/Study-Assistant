import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyMaterial',
    },
    type: {
      type: String,
      enum: ['study', 'review', 'quiz', 'flashcards'],
      default: 'study',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed', 'cancelled'],
      default: 'scheduled',
    },
    googleEventId: {
      type: String,
      default: null,
    },
    reminder: {
      type: Number, // minutes before
      default: 15,
    },
    notes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
    actualDuration: {
      type: Number, // minutes
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
studySessionSchema.index({ workspaceId: 1, userId: 1, startTime: 1 });
studySessionSchema.index({ userId: 1, startTime: 1, endTime: 1 });

export default mongoose.model('StudySession', studySessionSchema);
