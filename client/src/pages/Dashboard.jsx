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
    <div>
      {/* Welcome Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          Welcome back, {user?.displayName?.split(' ')[0]}! 👋
        </h1>
        <p className="text-blue-100 text-base lg:text-lg">
          Ready to make your study session more productive?
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={`/workspace/${workspaceId}/${action.path}`}
            className="bg-white p-5 lg:p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:-translate-y-0.5"
          >
            <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 shadow-md`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-base">{action.name}</h3>
            <p className="text-sm text-gray-500">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Your Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-3xl font-bold text-blue-600 mb-1">0</p>
            <p className="text-sm font-medium text-gray-700">Materials Uploaded</p>
          </div>
          <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <p className="text-3xl font-bold text-purple-600 mb-1">0</p>
            <p className="text-sm font-medium text-gray-700">Flashcard Sets</p>
          </div>
          <div className="text-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-3xl font-bold text-green-600 mb-1">0</p>
            <p className="text-sm font-medium text-gray-700">Study Sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
