import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Check, X } from 'lucide-react';

const FlashcardPlayer = ({ flashcardSet }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState([]);
  const [unknownCards, setUnknownCards] = useState([]);

  if (!flashcardSet || !flashcardSet.cards || flashcardSet.cards.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500 text-sm">No flashcards available</p>
      </div>
    );
  }

  const currentCard = flashcardSet.cards[currentIndex];
  const totalCards = flashcardSet.cards.length;
  const progress = ((currentIndex + 1) / totalCards) * 100;

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
    setKnownCards([]);
    setUnknownCards([]);
  };

  const handleMarkKnown = () => {
    if (!knownCards.includes(currentIndex)) {
      setKnownCards([...knownCards, currentIndex]);
      setUnknownCards(unknownCards.filter(i => i !== currentIndex));
    }
    handleNext();
  };

  const handleMarkUnknown = () => {
    if (!unknownCards.includes(currentIndex)) {
      setUnknownCards([...unknownCards, currentIndex]);
      setKnownCards(knownCards.filter(i => i !== currentIndex));
    }
    handleNext();
  };

  const isComplete = currentIndex === totalCards - 1 && (knownCards.includes(currentIndex) || unknownCards.includes(currentIndex));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900">{flashcardSet.title}</h2>
            <p className="text-sm text-gray-500">{currentIndex + 1} of {totalCards}</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gray-900 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3 text-sm">
          <span className="text-green-600">{knownCards.length} known</span>
          <span className="text-gray-300">·</span>
          <span className="text-red-500">{unknownCards.length} review</span>
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-4">
        <div
          onClick={handleFlip}
          className="relative cursor-pointer"
          style={{ perspective: '1500px' }}
        >
          <div
            className="relative w-full h-72 transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="absolute top-4 left-4 text-xs text-gray-400 font-medium">QUESTION</span>
              <p className="text-lg text-center text-gray-900 leading-relaxed">{currentCard.front}</p>
              <span className="absolute bottom-4 text-xs text-gray-400">Tap to flip</span>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <span className="absolute top-4 left-4 text-xs text-gray-400 font-medium">ANSWER</span>
              <p className="text-lg text-center text-white leading-relaxed">{currentCard.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Buttons */}
      {isFlipped && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={handleMarkUnknown}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
          >
            <X className="w-4 h-4" />
            Still Learning
          </button>
          <button
            onClick={handleMarkKnown}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            Got It
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex gap-1">
          {Array.from({ length: Math.min(totalCards, 8) }).map((_, index) => {
            const isActive = totalCards <= 8 ? index === currentIndex : index === Math.floor((currentIndex / totalCards) * 8);
            return (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  isActive ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              />
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === totalCards - 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Completion */}
      {isComplete && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Session Complete!</h3>
          <p className="text-sm text-gray-500 mb-4">
            {knownCards.length} known · {unknownCards.length} to review
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Study Again
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashcardPlayer;
