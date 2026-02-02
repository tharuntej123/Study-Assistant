import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Bot, User, BookOpen, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WorkspaceChat = () => {
  const { workspaceId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post(`/workspaces/${workspaceId}/chat`, {
        query: userMessage.content,
      });
      const aiMessage = {
        role: 'ai',
        content: response.data.answer,
        sources: response.data.sourcesUsed,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to get response');
      const errorMessage = {
        role: 'ai',
        content: 'Sorry, I encountered an error. Please make sure you have uploaded some materials with text content.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Summarize the main concepts",
    "What are the key takeaways?",
    "Explain this in simpler terms",
    "Give me study tips for this topic",
  ];

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">AI Study Assistant</h1>
        <p className="text-sm text-gray-500">Ask questions about your materials</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Start a conversation</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                Ask me anything about your uploaded materials.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(question)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-600 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'ai' && (
                  <div className="shrink-0 w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}>
                  {message.role === 'ai' ? (
                    <div className="prose prose-sm max-w-none prose-gray">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Sources
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.sources.map((source, idx) => (
                          <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600">
                            {source.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 disabled:bg-gray-100 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceChat;
