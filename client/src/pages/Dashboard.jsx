import { useAuth } from '../context/AuthContext';
import { Upload, Brain, Calendar, Library } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { workspaceId } = useParams();

  const quickActions = [
    { 
      name: 'Upload Material', 
      icon: Upload, 
      path: 'library',
      color: 'bg-blue-500',
      description: 'Add PDFs and images'
    },
    { 
      name: 'View Library', 
      icon: Library, 
      path: 'library',
      color: 'bg-green-500',
      description: 'Browse your materials'
    },
    { 
      name: 'Study Flashcards', 
      icon: Brain, 
      path: 'flashcards',
      color: 'bg-purple-500',
      description: 'AI-generated cards'
    },
    { 
      name: 'Schedule Study', 
      icon: Calendar, 
      path: 'calendar',
      color: 'bg-orange-500',
      description: 'Plan your sessions'
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.displayName?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600">
          Ready to make your study session more productive?
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={`/workspace/${workspaceId}/${action.path}`}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{action.name}</h3>
            <p className="text-sm text-gray-500">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 mb-1">0</p>
            <p className="text-sm text-gray-600">Materials Uploaded</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600 mb-1">0</p>
            <p className="text-sm text-gray-600">Flashcard Sets</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600 mb-1">0</p>
            <p className="text-sm text-gray-600">Study Sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
