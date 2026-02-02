import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Layers,
  FileText,
  Brain,
  Send,
  Loader2,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const MaterialStudyPage = () => {
  const { workspaceId, materialId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('summary');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  // Fetch material details (with polling for processing status)
  const { data: material, isLoading } = useQuery({
    queryKey: ['material', materialId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/materials/${materialId}`);
      return response.data.material;
    },
    refetchInterval: (query) => {
      // Poll every 3 seconds if material is not processed yet
      const data = query.state.data;
      if (data && !data.isProcessed && data.transcribedText) {
        return 3000;
      }
      return false;
    },
  });

  // Fetch flashcard sets for this material
  const { data: flashcardSets } = useQuery({
    queryKey: ['flashcards', workspaceId, materialId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/flashcards`);
      return response.data.flashcardSets.filter((set) => set.sourceId === materialId);
    },
    refetchInterval: (query) => {
      // Poll if material is being processed
      if (material && !material.isProcessed && material.transcribedText) {
        return 3000;
      }
      return false;
    },
  });

  // Summarize mutation
  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/workspaces/${workspaceId}/materials/${materialId}/summarize`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['material', materialId]);
      toast.success(data.cached ? 'Summary loaded from cache' : 'Summary generated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate summary');
    },
  });

  // Generate flashcards mutation
  const generateFlashcardsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/workspaces/${workspaceId}/flashcards/generate`, {
        materialId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['flashcards', workspaceId]);
      toast.success('Flashcards generated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate flashcards');
    },
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (query) => {
      const response = await api.post(`/workspaces/${workspaceId}/chat`, { query });
      return response.data;
    },
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to get response');
    },
  });

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages((prev) => [...prev, { role: 'user', content: chatInput }]);
    chatMutation.mutate(chatInput);
    setChatInput('');
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: Sparkles },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Material not found</h2>
        <Link
          to={`/workspace/${workspaceId}/library`}
          className="text-blue-600 hover:underline"
        >
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          to={`/workspace/${workspaceId}/library`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
            {material.title}
          </h1>
          <p className="text-sm text-gray-500">
            Uploaded {new Date(material.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left Column - Document Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document Preview
            </h2>
          </div>
          <div className="flex-1 bg-gray-100 min-h-[400px] lg:min-h-0">
            {material.type === 'pdf' ? (
              <iframe
                src={material.fileUrl}
                className="w-full h-full min-h-[400px] lg:min-h-[500px]"
                title={material.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={material.fileUrl}
                  alt={material.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Tabbed Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-4">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="h-full">
                {material.summary ? (
                  <div className="relative">
                    <button
                      onClick={() => summarizeMutation.mutate()}
                      disabled={summarizeMutation.isPending}
                      className="absolute top-0 right-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Regenerate summary"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${summarizeMutation.isPending ? 'animate-spin' : ''}`}
                      />
                    </button>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{material.summary}</ReactMarkdown>
                    </div>
                  </div>
                ) : !material.isProcessed && material.transcribedText ? (
                  // Auto-processing in progress
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Auto-Generating Summary...
                        </h3>
                        <p className="text-sm text-gray-500">
                          AI is analyzing your document in the background
                        </p>
                      </div>
                      {/* Skeleton loader */}
                      <div className="w-full max-w-md space-y-3 mt-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/6"></div>
                      </div>
                    </div>
                  </div>
                ) : summarizeMutation.isPending ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Generating Summary...
                        </h3>
                        <p className="text-sm text-gray-500">
                          AI is analyzing your document
                        </p>
                      </div>
                      {/* Skeleton loader */}
                      <div className="w-full max-w-md space-y-3 mt-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/6"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      No Summary Available
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-xs">
                      {material.transcribedText 
                        ? 'Generate an AI-powered summary to quickly understand the key points'
                        : 'No text content found in this document to summarize'}
                    </p>
                    {material.transcribedText && (
                      <button
                        onClick={() => summarizeMutation.mutate()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate AI Summary
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Flashcards Tab */}
            {activeTab === 'flashcards' && (
              <div className="h-full">
                {flashcardSets && flashcardSets.length > 0 ? (
                  <div className="space-y-4">
                    {flashcardSets.map((set) => (
                      <div
                        key={set._id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">{set.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {set.cards.length} cards •{' '}
                          {new Date(set.createdAt).toLocaleDateString()}
                        </p>
                        <Link
                          to={`/workspace/${workspaceId}/flashcards`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Flashcards →
                        </Link>
                      </div>
                    ))}
                    <button
                      onClick={() => generateFlashcardsMutation.mutate()}
                      disabled={generateFlashcardsMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
                    >
                      {generateFlashcardsMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      Generate More Flashcards
                    </button>
                  </div>
                ) : !material.isProcessed && material.transcribedText ? (
                  // Auto-processing in progress
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Auto-Generating Flashcards...
                        </h3>
                        <p className="text-sm text-gray-500">
                          AI is creating study cards in the background
                        </p>
                      </div>
                    </div>
                  </div>
                ) : generateFlashcardsMutation.isPending ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Generating Flashcards...
                        </h3>
                        <p className="text-sm text-gray-500">
                          AI is creating study cards
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <Layers className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      No Flashcards Available
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-xs">
                      {material.transcribedText 
                        ? 'Generate flashcards from this document to test your knowledge'
                        : 'No text content found in this document to create flashcards'}
                    </p>
                    {material.transcribedText && (
                      <button
                        onClick={() => generateFlashcardsMutation.mutate()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                      >
                        <Brain className="w-4 h-4" />
                        Generate Flashcards
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-auto space-y-4 mb-4 min-h-[200px]">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Ask Questions
                      </h3>
                      <p className="text-sm text-gray-500 max-w-xs">
                        Chat with AI about this document. Ask anything about the content!
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about this document..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={chatMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={chatMutation.isPending || !chatInput.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialStudyPage;
