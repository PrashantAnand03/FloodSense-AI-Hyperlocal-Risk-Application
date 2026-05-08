import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Droplets } from 'lucide-react';

/**
 * Wraps any route that requires authentication.
 * Redirects to /login if user is not logged in.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 mb-4 animate-pulse">
            <Droplets className="w-8 h-8 text-brand-400" />
          </div>
          <p className="text-gray-400 text-sm">Loading FloodSense AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
