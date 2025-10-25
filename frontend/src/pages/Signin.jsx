import { Link, useNavigate } from 'react-router-dom';
import { useState } from "react"
import { motion } from "framer-motion"
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, UserIcon, UserGroupIcon } from "@heroicons/react/24/outline"
import { Footer } from "../components/Footer"
import QuickPeLogo from "../components/QuickPeLogo"
import apiClient from "../services/api/client.js";

export const Signin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [retryAfter, setRetryAfter] = useState(0);
    const [retryTimer, setRetryTimer] = useState(null);
    const navigate = useNavigate();

    // Registered database users with account balances (showing last 3 users)
    const testUsers = [
        {
            name: "Smriti Shukla",
            email: "smriti.shukla@quickpe.com",
            password: "password123",
            role: "Regular User",
            quickpeId: "QP567890",
            balance: "₹94,567"
        },
        {
            name: "Arpit Shukla",
            email: "arpit.shukla@quickpe.com",
            password: "password123",
            role: "Regular User",
            quickpeId: "QP234567",
            balance: "₹1,56,789"
        },
        {
            name: "Siddharth Raj",
            email: "siddharth@quickpe.com",
            password: "password123",
            role: "Admin User",
            quickpeId: "QPK-373B56D9",
            balance: "₹8,16,624"
        }
    ];

    const handleSignin = async () => {
        setLoading(true);
        setError("");
        setValidationErrors({});

        // Validate inputs
        const errors = {};
        if (!username.trim()) {
            errors.username = "Email is required";
        }
        if (!password) {
            errors.password = "Password is required";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setLoading(false);
            return;
        }

        try {
            console.log('🔐 Attempting signin with:', { email: username });
            const response = await apiClient.post("/auth/signin", {
                email: username,
                password
            });
            console.log('✅ Signin successful:', response.data);
            
            // Reset rate limiting state on successful login
            setIsRateLimited(false);
            if (retryTimer) {
                clearInterval(retryTimer);
                setRetryTimer(null);
            }
            
            // Store authentication data
            const userData = response.data.data.user;
            const token = response.data.data.token;
            
            localStorage.setItem("token", token);
            localStorage.setItem("userId", userData.id);
            localStorage.setItem("user", JSON.stringify({
                id: userData.id,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                quickpeId: userData.quickpeId,
                balance: userData.balance,
                role: userData.role,
                isAdmin: userData.isAdmin || false,
                lastLogin: new Date().toISOString()
            }));
            
            console.log('✅ Stored user data and redirecting to dashboard');
            
            // Force page reload to trigger AuthContext re-check
            window.location.href = '/dashboard';
        } catch (err) {
            console.error('❌ Signin failed:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            
            // Handle rate limiting
            if (err.response?.status === 429) {
                const retryAfter = parseInt(err.response.headers['retry-after']) || 60;
                setIsRateLimited(true);
                setRetryAfter(retryAfter);
                
                // Start countdown timer
                const timer = setInterval(() => {
                    setRetryAfter(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            setIsRateLimited(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                
                setRetryTimer(timer);
                setError(`Too many attempts. Please try again in ${retryAfter} seconds.`);
            } else {
                setError(err.response?.data?.message || "Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fillTestUser = (user) => {
        setUsername(user.email);
        setPassword(user.password);
        setError("");
        setValidationErrors({});
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* Header */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <motion.div 
                            className="flex items-center space-x-2 cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => navigate('/')}
                        >
                            <QuickPeLogo />
                        </motion.div>
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => navigate("/")}
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                            >
                                Home
                            </button>
                            <button 
                                onClick={() => navigate('/about')}
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                            >
                                About
                            </button>
                            <button 
                                onClick={() => navigate('/kpi-reports')}
                                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                            >
                                KPI Reports
                            </button>
                            <button
                                onClick={() => navigate("/signup")}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
                    >
                        {/* Test Users Section - Left Side */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <UserGroupIcon className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Test Users</h2>
                                <p className="text-slate-600">Use these accounts to test the application</p>
                            </div>

                            <div className="space-y-4">
                                {testUsers.map((user, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 text-lg">{user.name}</div>
                                                <div className="text-sm text-slate-600 mb-1">{user.email}</div>
                                                <div className="text-sm text-blue-600 font-medium">{user.role}</div>
                                                <div className="flex items-center space-x-4 mt-2">
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                        {user.quickpeId}
                                                    </span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {user.balance}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => fillTestUser(user)}
                                                className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                            >
                                                Auto Fill
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start space-x-2">
                                    <div className="text-amber-600 text-lg">💡</div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-amber-800">Quick Test Instructions</h4>
                                        <p className="text-xs text-amber-700 mt-1">
                                            Click "Auto Fill" to populate credentials instantly. All test users use password: <code className="bg-amber-100 px-1 rounded">password123</code>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sign In Form - Right Side */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                            {/* Logo and Title */}
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <LockClosedIcon className="h-10 w-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                                <p className="text-slate-600">Sign in to your QuickPe account</p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Form */}
                            <form onSubmit={(e) => { e.preventDefault(); handleSignin(); }} className="space-y-6">
                                {/* Email Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                                                validationErrors.username ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                                            }`}
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                    {validationErrors.username && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
                                    )}
                                </div>

                                {/* Password Input */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`block w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                                                validationErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                                            }`}
                                            placeholder="Enter your password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                            )}
                                        </button>
                                    </div>
                                    {validationErrors.password && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                                    )}
                                </div>

                                {/* Error Message */}
                                {(error || isRateLimited) && (
                                    <div className={`p-3 rounded-md text-sm mb-4 ${
                                        isRateLimited 
                                            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                                            : 'bg-red-50 text-red-600'
                                    }`}>
                                        {isRateLimited ? (
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="font-medium">Too many attempts</p>
                                                    <p>Please wait {retryAfter} seconds before trying again.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                                {error}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Sign In Button */}
                                <button
                                    type="submit"
                                    disabled={loading || isRateLimited}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                        isRateLimited 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                                    } focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading 
                                        ? 'Signing in...' 
                                        : isRateLimited 
                                            ? `Try again in ${retryAfter}s` 
                                            : 'Sign in'}
                                </button>
                            </form>

                            {/* Forgot Password Link */}
                            <div className="mt-6 text-center">
                                <Link
                                    to="/reset-password"
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            {/* Sign Up Link */}
                            <div className="mt-4 text-center">
                                <p className="text-slate-600">
                                    Don't have an account?{' '}
                                    <Link
                                        to="/signup"
                                        className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Signin;