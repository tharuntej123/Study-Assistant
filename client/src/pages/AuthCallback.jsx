import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const workspace = searchParams.get('workspace');

      if (!token || !workspace) {
        navigate('/login');
        return;
      }

      try {
        // Store token in localStorage for cross-origin compatibility
        localStorage.setItem('auth_token', token);
        
        // Also try to set cookie via API call (fallback)
        try {
          await api.post('/auth/set-token', { token });
        } catch (cookieError) {
          console.log('Cookie setting failed, using localStorage only');
        }
        
        // Refresh auth state
        await checkAuth();
        
        // Redirect to workspace
        navigate(`/workspace/${workspace}/dashboard`);
      } catch (error) {
        console.error('Auth callback error:', error);
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
