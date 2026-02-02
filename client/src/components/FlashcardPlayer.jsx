import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const FlashcardPlayer = ({ flashcardSet, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcardSet || !flashcardSet.cards || flashcardSet.cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No flashcards available</p>
      </div>
    );
  }

  const currentCard = flashcardSet.cards[currentIndex];
  const totalCards = flashcardSet.cards.length;

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{flashcardSet.title}</h2>
          <p className="text-gray-600">
            Card {currentIndex + 1} of {totalCards}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Flashcard */}
      <div className="mb-6">
        <div
          onClick={handleFlip}
          className="relative cursor-pointer"
          style={{ perspective: '1000px' }}
        >
          <div
            className={`relative w-full h-80 transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-white rounded-xl shadow-lg border border-gray-200 p-8 flex flex-col items-center justify-center backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-sm text-gray-500 mb-4">QUESTION</p>
              <p className="text-xl text-center text-gray-900">{currentCard.front}</p>
              <p className="text-sm text-gray-400 mt-6">Click to reveal answer</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <p className="text-sm text-blue-200 mb-4">ANSWER</p>
              <p className="text-xl text-center text-white">{currentCard.back}</p>
              <p className="text-sm text-blue-200 mt-6">Click to see question</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <div className="flex gap-2">
          {Array.from({ length: totalCards }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === totalCards - 1}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default FlashcardPlayer;
