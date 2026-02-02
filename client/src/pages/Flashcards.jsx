import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Brain, Calendar } from 'lucide-react';
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
      <div>
        <button
          onClick={() => setSelectedSet(null)}
          className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to all sets
        </button>
        <FlashcardPlayer flashcardSet={selectedSet} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Flashcards</h1>
        <p className="text-gray-500 text-sm">Study with AI-generated flashcards</p>
      </div>

      {!flashcardSets || flashcardSets.length === 0 ? (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-200 p-12 lg:p-16 text-center">
          <Brain className="w-14 h-14 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No flashcard sets yet</h3>
          <p className="text-gray-500 text-sm">
            Generate flashcards from your PDFs in the Library
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {flashcardSets.map((set) => (
            <div
              key={set._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
              onClick={() => setSelectedSet(set)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                  {set.cards?.length || 0} cards
                </span>
              </div>

              <h3 className="font-bold text-gray-900 mb-2">{set.title}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(set.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Flashcards;
