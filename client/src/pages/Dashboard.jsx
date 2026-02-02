import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Upload, Brain, Calendar, Library, Clock, FileText, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { workspaceId } = useParams();

  // Fetch materials count
  const { data: materialsData } = useQuery({
    queryKey: ['materials', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/materials`);
      return response.data.materials;
    },
  });

  // Fetch flashcards count
  const { data: flashcardsData } = useQuery({
    queryKey: ['flashcards', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/flashcards`);
      return response.data.flashcardSets;
    },
  });

  const quickActions = [
    { name: 'Upload', icon: Upload, path: 'library', desc: 'Add materials' },
    { name: 'Library', icon: Library, path: 'library', desc: 'Browse files' },
    { name: 'Flashcards', icon: Brain, path: 'flashcards', desc: 'Study cards' },
    { name: 'Calendar', icon: Calendar, path: 'calendar', desc: 'Plan sessions' },
  ];

  // Calculate total flashcard count
  const totalFlashcards = flashcardsData?.reduce((acc, set) => acc + (set.cards?.length || 0), 0) || 0;

  const stats = [
    { label: 'Materials', value: materialsData?.length || 0, icon: FileText },
    { label: 'Flashcards', value: totalFlashcards, icon: Brain },
    { label: 'Study Sets', value: flashcardsData?.length || 0, icon: Clock },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get recent materials for activity
  const recentMaterials = materialsData?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          {getGreeting()}, {user?.displayName?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm">Ready to continue learning?</p>
        
        <Link 
          to={`/workspace/${workspaceId}/library`}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Start Studying
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={`/workspace/${workspaceId}/${action.path}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-800 transition-colors">
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">{action.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-medium text-gray-500 mb-4">Recent Activity</h2>
        {recentMaterials.length > 0 ? (
          <div className="space-y-3">
            {recentMaterials.map((material) => (
              <Link
                key={material._id}
                to={`/workspace/${workspaceId}/material/${material._id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${material.type === 'pdf' ? 'bg-blue-50' : 'bg-green-50'}`}>
                  <FileText className={`w-5 h-5 ${material.type === 'pdf' ? 'text-blue-600' : 'text-green-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{material.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(material.createdAt).toLocaleDateString()} · {material.type.toUpperCase()}
                  </p>
                </div>
                {material.isProcessed && (
                  <span className="text-xs text-green-600 font-medium">AI Ready</span>
                )}
              </Link>
            ))}
            <Link 
              to={`/workspace/${workspaceId}/library`}
              className="block text-center text-sm text-gray-600 hover:text-gray-900 pt-2"
            >
              View all materials →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-4">No recent activity yet</p>
            <Link 
              to={`/workspace/${workspaceId}/library`}
              className="text-sm text-gray-900 font-medium hover:underline"
            >
              Upload your first material →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
