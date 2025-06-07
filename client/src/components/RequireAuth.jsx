import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const RequireAuth = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // console.log('[RequireAuth] Checking auth:', {
  //   user: !!user,
  //   loading,
  //   role: user?.role,
  //   requiredRoles: roles,
  //   pathname: location.pathname,
  // });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-cyan-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 111 8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 111 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.warn('[RequireAuth] No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    console.warn(`[RequireAuth] User role ${user.role} not authorized for ${roles.join(', ')}`);
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-gray-400 p-6 bg-gray-900 rounded-lg shadow-lg">
          <h2 className="text-2xl text-red-400 mb-4">Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <a href="/" className="mt-4 inline-block text-cyan-400 hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAuth;