import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/layout/RequireAuth';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Flashcards from './pages/Flashcards';
import WorkspaceChat from './pages/WorkspaceChat';
import Calendar from './pages/Calendar';
import MaterialStudyPage from './pages/MaterialStudyPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/workspace/:workspaceId"
              element={
                <RequireAuth>
                  <WorkspaceLayout />
                </RequireAuth>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="library" element={<Library />} />
              <Route path="material/:materialId" element={<MaterialStudyPage />} />
              <Route path="flashcards" element={<Flashcards />} />
              <Route path="chat" element={<WorkspaceChat />} />
              <Route path="calendar" element={<Calendar />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
