import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../services/api/client';

export const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const validateAuth = async () => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            if (!token || !user) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }
            
            try {
                // Validate user data format
                const userData = JSON.parse(user);
                
                // Verify token with backend
                const response = await apiClient.get('/auth/verify');
                
                if (response.data.success) {
                    setIsAuthenticated(true);
                } else {
                    throw new Error('Token verification failed');
                }
            } catch (error) {
                console.error('Authentication validation failed:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        
        validateAuth();
    }, []);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Verifying authentication...</p>
                </div>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }
    
    return children;
};

export default ProtectedRoute;
