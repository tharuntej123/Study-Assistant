import { useState, useEffect } from 'react';
import { Outlet, Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Library, 
  Brain, 
  Calendar, 
  LogOut, 
  ChevronDown,
  Menu,
  X,
  MessageSquare
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WorkspaceLayout = () => {
  const { user, logout } = useAuth();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w._id === workspaceId);
      setCurrentWorkspace(workspace);
    }
  }, [workspaceId, workspaces]);

  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      setWorkspaces(response.data.workspaces || []);
      
      if (response.data.workspaces?.length > 0 && !workspaceId) {
        navigate(`/workspace/${response.data.workspaces[0]._id}/dashboard`);
      }
    } catch (error) {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
    { name: 'Library', icon: Library, path: 'library' },
    { name: 'Flashcards', icon: Brain, path: 'flashcards' },
    { name: 'AI Chat', icon: MessageSquare, path: 'chat' },
    { name: 'Calendar', icon: Calendar, path: 'calendar' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 w-64`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-blue-600">StudyWorkspace</h1>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Workspace Selector */}
            <div className="relative">
              <select 
                value={currentWorkspace?._id || ''} 
                onChange={(e) => navigate(`/workspace/${e.target.value}/dashboard`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none bg-white pr-8 text-sm"
              >
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>{ws.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 pointer-events-none text-gray-500" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={`/workspace/${workspaceId}/${item.path}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <item.icon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <img 
                src={user?.avatar || 'https://via.placeholder.com/40'} 
                alt={user?.displayName} 
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {currentWorkspace?.name || 'Loading...'}
            </h2>
            <div className="w-10"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
