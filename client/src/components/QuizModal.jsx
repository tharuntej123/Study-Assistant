import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, CheckCircle2, XCircle, ChevronRight, RotateCcw, Loader2, Brain } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const QuizModal = ({ isOpen, onClose, workspaceId, materialId, materialTitle }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/workspaces/${workspaceId}/quiz/generate`, { materialId });
      return response.data;
    },
    onSuccess: (data) => {
      setQuiz(data.quiz);
      toast.success(data.cached ? 'Quiz loaded' : 'Quiz generated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate quiz');
    },
  });

  const saveResultMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/workspaces/${workspaceId}/quiz/save-result`, {
        quizId: quiz._id,
        score,
        totalQuestions: quiz.questions.length,
      });
    },
  });

  useEffect(() => {
    if (isOpen && !quiz) {
      generateQuizMutation.mutate();
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Quiz</h2>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{materialTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {generateQuizMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Generating quiz...</p>
            </div>
          ) : isComplete ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-4xl font-bold text-gray-900 mb-2">{score}/{quiz.questions.length}</div>
              <p className="text-gray-500 mb-2">{Math.round((score / quiz.questions.length) * 100)}% correct</p>
              
              <div className="w-full max-w-xs h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className={`h-full transition-all duration-500 ${
                    score / quiz.questions.length >= 0.7 ? 'bg-green-500' :
                    score / quiz.questions.length >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(score / quiz.questions.length) * 100}%` }}
                />
              </div>

              <p className="text-sm text-gray-600 text-center mb-6 max-w-xs">
                {score / quiz.questions.length >= 0.7
                  ? 'Great job! You have a solid understanding.'
                  : score / quiz.questions.length >= 0.4
                  ? 'Good effort! Review the material to improve.'
                  : 'Keep studying and try again!'}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : quiz ? (
            <div>
              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
                  <span>Score: {score}</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 transition-all duration-300 rounded-full"
                    style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <h3 className="font-medium text-gray-900 mb-4 leading-relaxed">{question.questionText}</h3>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {question.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrectOption = index === question.correctIndex;
                  
                  let classes = 'w-full p-3 rounded-lg border text-left transition-colors flex items-center gap-3 text-sm ';
                  
                  if (!isAnswered) {
                    classes += 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer';
                  } else if (isCorrectOption) {
                    classes += 'border-green-500 bg-green-50';
                  } else if (isSelected && !isCorrectOption) {
                    classes += 'border-red-500 bg-red-50';
                  } else {
                    classes += 'border-gray-100 opacity-50';
                  }

                  return (
                    <button key={index} onClick={() => handleOptionClick(index)} disabled={isAnswered} className={classes}>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                        isAnswered && isCorrectOption ? 'bg-green-500 text-white' :
                        isAnswered && isSelected && !isCorrectOption ? 'bg-red-500 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 text-gray-700">{option}</span>
                      {isAnswered && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {isAnswered && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {isAnswered && (
                <div className={`p-3 rounded-lg mb-4 text-sm ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className="font-medium text-gray-900 mb-1">{isCorrect ? '✓ Correct' : '✗ Incorrect'}</p>
                  <p className="text-gray-600">{question.explanation}</p>
                </div>
              )}

              {/* Next button */}
              {isAnswered && (
                <button
                  onClick={handleNextQuestion}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  {currentQuestion === quiz.questions.length - 1 ? 'See Results' : 'Next'}
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
