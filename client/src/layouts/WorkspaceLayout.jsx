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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 w-64 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">StudyWorkspace</h1>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:bg-white/20 rounded-lg p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Workspace Selector */}
            <div className="relative">
              <select 
                value={currentWorkspace?._id || ''} 
                onChange={(e) => navigate(`/workspace/${e.target.value}/dashboard`)}
                className="w-full px-3 py-2 border-0 rounded-lg appearance-none bg-white pr-8 text-sm font-medium shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>{ws.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 pointer-events-none text-gray-600" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = window.location.pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  to={`/workspace/${workspaceId}/${item.path}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0">
            <div className="flex items-center gap-3 mb-3 p-2">
              <img 
                src={user?.avatar || 'https://via.placeholder.com/40'} 
                alt={user?.displayName} 
                className="w-9 h-9 rounded-full border-2 border-blue-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="px-4 lg:px-6 py-3 flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {currentWorkspace?.name || 'Loading...'}
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
