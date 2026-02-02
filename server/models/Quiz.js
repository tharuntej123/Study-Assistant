import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyMaterial',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: function (v) {
              return v.length === 4;
            },
            message: 'Each question must have exactly 4 options',
          },
        },
        correctIndex: {
          type: Number,
          required: true,
          min: 0,
          max: 3,
        },
        explanation: {
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
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ workspaceId: 1, materialId: 1 });

export default mongoose.model('Quiz', quizSchema);
