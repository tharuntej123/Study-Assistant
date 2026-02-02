import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  Loader2,
  Brain,
  Lightbulb,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const QuizModal = ({ isOpen, onClose, workspaceId, materialId, materialTitle }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/workspaces/${workspaceId}/quiz/generate`, {
        materialId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setQuiz(data.quiz);
      if (data.cached) {
        toast.success('Quiz loaded from cache');
      } else {
        toast.success('Quiz generated!');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate quiz');
    },
  });

  // Save result mutation
  const saveResultMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/workspaces/${workspaceId}/quiz/save-result`, {
        quizId: quiz._id,
        score,
        totalQuestions: quiz.questions.length,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Result saved!');
    },
  });

  // Load quiz when modal opens
  useEffect(() => {
    if (isOpen && !quiz) {
      generateQuizMutation.mutate();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuiz(null);
      setCurrentQuestion(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setIsComplete(false);
    }
  }, [isOpen]);

  const handleOptionClick = (optionIndex) => {
    if (isAnswered) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    if (optionIndex === quiz.questions[currentQuestion].correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion === quiz.questions.length - 1) {
      setIsComplete(true);
      saveResultMutation.mutate();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsComplete(false);
  };

  if (!isOpen) return null;

  const question = quiz?.questions?.[currentQuestion];
  const isCorrect = selectedOption === question?.correctIndex;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Quiz Mode</h2>
              <p className="text-sm text-white/80 truncate max-w-xs">{materialTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {generateQuizMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Generating Quiz...</h3>
              <p className="text-sm text-gray-500">AI is creating questions from your document</p>
            </div>
          ) : isComplete ? (
            // Final Score Screen
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mb-6">
                <Trophy className="w-12 h-12 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
              <p className="text-gray-600 mb-6">
                You scored{' '}
                <span className="font-bold text-indigo-600">
                  {score}/{quiz.questions.length}
                </span>
              </p>

              {/* Score visualization */}
              <div className="w-full max-w-xs mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Score</span>
                  <span>{Math.round((score / quiz.questions.length) * 100)}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      score / quiz.questions.length >= 0.7
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : score / quiz.questions.length >= 0.4
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                        : 'bg-gradient-to-r from-red-500 to-rose-500'
                    }`}
                    style={{ width: `${(score / quiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Feedback message */}
              <p className="text-center text-gray-600 mb-8 max-w-sm">
                {score / quiz.questions.length >= 0.8
                  ? '🎉 Excellent work! You have a strong understanding of this material.'
                  : score / quiz.questions.length >= 0.6
                  ? '👍 Good job! Review the topics you missed to improve further.'
                  : '📚 Keep studying! Review the material and try again.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Quiz
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          ) : quiz ? (
            // Quiz Questions
            <div>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>
                    Question {currentQuestion + 1} of {quiz.questions.length}
                  </span>
                  <span className="font-medium text-indigo-600">Score: {score}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question */}
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {question.questionText}
              </h3>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {question.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrectOption = index === question.correctIndex;
                  
                  let optionClasses = 'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ';
                  
                  if (!isAnswered) {
                    optionClasses += 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer';
                  } else if (isCorrectOption) {
                    optionClasses += 'border-green-500 bg-green-50';
                  } else if (isSelected && !isCorrectOption) {
                    optionClasses += 'border-red-500 bg-red-50';
                  } else {
                    optionClasses += 'border-gray-200 opacity-60';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(index)}
                      disabled={isAnswered}
                      className={optionClasses}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isAnswered && isCorrectOption
                          ? 'bg-green-500 text-white'
                          : isAnswered && isSelected && !isCorrectOption
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isAnswered && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {isAnswered && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (shown after answering) */}
              {isAnswered && (
                <div className={`p-4 rounded-xl mb-6 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <Lightbulb className={`w-5 h-5 mt-0.5 ${isCorrect ? 'text-green-600' : 'text-blue-600'}`} />
                    <div>
                      <p className={`font-medium mb-1 ${isCorrect ? 'text-green-800' : 'text-blue-800'}`}>
                        {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                      </p>
                      <p className="text-sm text-gray-700">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next button */}
              {isAnswered && (
                <button
                  onClick={handleNextQuestion}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all font-medium"
                >
                  {currentQuestion === quiz.questions.length - 1 ? 'See Results' : 'Next Question'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
