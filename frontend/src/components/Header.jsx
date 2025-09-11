import { useNavigate } from 'react-router-dom';

export const Header = () => {
    const navigate = useNavigate();
    
    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">₹</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">QuickPe</span>
                        </div>
                    </div>
                    
                    <nav className="flex space-x-4">
                        <button
                            onClick={() => navigate('/signin')}
                            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                            Sign Up
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
};
