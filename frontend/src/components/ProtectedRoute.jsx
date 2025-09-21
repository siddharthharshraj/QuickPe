import { Navigate, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, error } = useContext(AuthContext);
    const [isInitialized, setIsInitialized] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Set initialized to true after first render
        setIsInitialized(true);
        
        // Show error toast if there's an authentication error
        if (error) {
            toast.error(error.message || 'Authentication failed');
        }
    }, [error]);

    // Show loading state while auth is being checked
    if (loading || !isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to signin if not authenticated
    if (!isAuthenticated) {
        // Store the current location to redirect back after login
        const redirectTo = location.pathname !== '/signin' ? `?redirect=${encodeURIComponent(location.pathname + location.search)}` : '';
        return <Navigate to={`/signin${redirectTo}`} replace state={{ from: location }} />;
    }

    return children;
};

export default ProtectedRoute;
