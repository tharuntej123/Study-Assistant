import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Brain, ArrowLeft, Play, BookOpen } from 'lucide-react';
import api from '../lib/api';
import FlashcardPlayer from '../components/FlashcardPlayer';

const Flashcards = () => {
  const { workspaceId } = useParams();
  const [selectedSet, setSelectedSet] = useState(null);

  const { data: flashcardSets, isLoading } = useQuery({
    queryKey: ['flashcards', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/flashcards`);
      return response.data.flashcardSets;
    },
  });

  if (selectedSet) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedSet(null)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sets
        </button>
        <FlashcardPlayer flashcardSet={selectedSet} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalCards = flashcardSets?.reduce((sum, set) => sum + (set.cards?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Flashcards</h1>
          <p className="text-sm text-gray-500">{flashcardSets?.length || 0} sets · {totalCards} cards</p>
        </div>
      </div>

      {/* Content */}
      {!flashcardSets || flashcardSets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Brain className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No flashcard sets yet</h3>
          <p className="text-sm text-gray-500 mb-4">Upload materials to generate flashcards automatically</p>
          <Link
            to={`/workspace/${workspaceId}/library`}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Go to Library
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcardSets.map((set) => (
            <div
              key={set._id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer group"
              onClick={() => setSelectedSet(set)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-xs text-gray-500">{set.cards?.length || 0} cards</span>
              </div>

              <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{set.title}</h3>
              <p className="text-xs text-gray-500 mb-4">
                {new Date(set.createdAt).toLocaleDateString()}
              </p>

              <button className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white text-sm rounded-lg group-hover:bg-gray-800 transition-colors">
                <Play className="w-4 h-4" />
                Study
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Flashcards;
