import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute: State update', {
      path: location.pathname,
      loading,
      hasUser: !!user
    });
  }, [location.pathname, loading, user]);

  // Set a timeout to detect if loading is stuck
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('ProtectedRoute: Loading timeout - authentication may be stuck');
        setLoadingTimeout(true);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Show loading indicator while authentication is initializing
  if (loading) {
    console.log('ProtectedRoute: Loading state, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          <p className="mt-2 text-sm text-gray-400">Initializing authentication</p>
          {loadingTimeout && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
              <p className="text-yellow-800 text-sm">
                Authentication is taking longer than expected. Check the browser console for details.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to /auth');
    // Save the attempted URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
