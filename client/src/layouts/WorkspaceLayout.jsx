import { useState, useEffect } from 'react';
import { Outlet, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
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
  MessageSquare,
  GraduationCap
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WorkspaceLayout = () => {
  const { user, logout } = useAuth();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 w-64 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">StudyWorkspace</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Workspace Selector */}
            <div className="relative">
              <select 
                value={currentWorkspace?._id || ''} 
                onChange={(e) => navigate(`/workspace/${e.target.value}/dashboard`)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg appearance-none text-sm text-gray-700 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              >
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>{ws.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 pointer-events-none text-gray-400" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  to={`/workspace/${workspaceId}/${item.path}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <img 
                src={user?.avatar || 'https://via.placeholder.com/32'} 
                alt={user?.displayName} 
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="font-semibold text-gray-900">
                {currentWorkspace?.name || 'Loading...'}
              </h2>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
