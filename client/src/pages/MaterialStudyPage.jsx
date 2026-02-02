import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Layers,
  FileText,
  Brain,
  Send,
  Loader2,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import QuizModal from '../components/QuizModal';

const MaterialStudyPage = () => {
  const { workspaceId, materialId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('summary');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

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
    { id: 'quiz', label: 'Quiz', icon: ClipboardList },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <h2 className="font-semibold text-gray-900 mb-2">Material not found</h2>
        <Link
          to={`/workspace/${workspaceId}/library`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to={`/workspace/${workspaceId}/library`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 truncate">{material.title}</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>{new Date(material.createdAt).toLocaleDateString()}</span>
            <span>·</span>
            <span className="uppercase">{material.type}</span>
            {material.isProcessed && <span className="text-green-600">· AI Ready</span>}
          </div>
        </div>
      </div>

      {/* Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Document Preview */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Document</h2>
          </div>
          <div className="flex-1 bg-gray-50 min-h-[400px] lg:min-h-0">
            {material.type === 'pdf' ? (
              <iframe
                src={material.fileUrl}
                className="w-full h-full min-h-[400px] lg:min-h-[500px]"
                title={material.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6">
                <img
                  src={material.fileUrl}
                  alt={material.title}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
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
                      className="absolute top-0 right-0 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${summarizeMutation.isPending ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <ReactMarkdown>{material.summary}</ReactMarkdown>
                    </div>
                  </div>
                ) : !material.isProcessed && material.transcribedText ? (
                  <div className="h-full flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Generating summary...</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">No summary available</p>
                    {material.transcribedText && (
                      <button
                        onClick={() => summarizeMutation.mutate()}
                        disabled={summarizeMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                      >
                        {summarizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Generate Summary
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
                  <div className="space-y-3">
                    {flashcardSets.map((set) => (
                      <div key={set._id} className="p-3 border border-gray-200 rounded-lg">
                        <h3 className="font-medium text-gray-900 text-sm">{set.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{set.cards.length} cards</p>
                        <Link
                          to={`/workspace/${workspaceId}/flashcards`}
                          className="text-xs text-gray-600 hover:text-gray-900 mt-2 inline-block"
                        >
                          View Flashcards →
                        </Link>
                      </div>
                    ))}
                    <button
                      onClick={() => generateFlashcardsMutation.mutate()}
                      disabled={generateFlashcardsMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 text-sm transition-colors"
                    >
                      {generateFlashcardsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      Generate More
                    </button>
                  </div>
                ) : !material.isProcessed && material.transcribedText ? (
                  <div className="h-full flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Generating flashcards...</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">No flashcards available</p>
                    {material.transcribedText && (
                      <button
                        onClick={() => generateFlashcardsMutation.mutate()}
                        disabled={generateFlashcardsMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                      >
                        {generateFlashcardsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
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
                <div className="flex-1 overflow-auto space-y-3 mb-3 min-h-[200px]">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-gray-500">Ask questions about this document</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                          msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-3 py-2 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                    disabled={chatMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={chatMutation.isPending || !chatInput.trim()}
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Quiz Tab */}
            {activeTab === 'quiz' && (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Test Your Knowledge</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-xs">10 AI-generated questions</p>
                {material.transcribedText ? (
                  <button
                    onClick={() => setIsQuizModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    Start Quiz
                  </button>
                ) : (
                  <p className="text-xs text-gray-400">No content available for quiz</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        workspaceId={workspaceId}
        materialId={materialId}
        materialTitle={material?.title}
      />
    </div>
  );
};

export default MaterialStudyPage;
