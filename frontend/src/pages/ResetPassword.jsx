import { Link, useNavigate } from 'react-router-dom';
import { useState } from "react"
import { motion } from "framer-motion"
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, KeyIcon } from "@heroicons/react/24/outline"
import { Footer } from "../components/Footer"
import QuickPeLogo from "../components/QuickPeLogo"
import apiClient from "../services/api/client.js";
import toast from 'react-hot-toast';

export const ResetPassword = () => {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const errors = {};
        
        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = "Please enter a valid email";
        }
        
        if (!newPassword) {
            errors.newPassword = "New password is required";
        } else if (newPassword.length < 6) {
            errors.newPassword = "Password must be at least 6 characters";
        }
        
        if (!confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        } else if (newPassword !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError("");
        setSuccess(false);
        
        try {
            const response = await apiClient.post("/auth/reset-password", {
                email,
                newPassword
            });
            
            console.log('✅ Password reset successful:', response.data);
            setSuccess(true);
            toast.success('Password reset successfully! You can now sign in with your new password.');
            
            // Redirect to signin after 2 seconds
            setTimeout(() => {
                navigate("/signin");
            }, 2000);
        } catch (err) {
            console.error('❌ Password reset failed:', err);
            const errorMessage = err.response?.data?.message || "Failed to reset password. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex flex-col">
            {/* Header */}
            <div className="w-full bg-white/80 backdrop-blur-sm border-b border-white/20 px-6 py-4">
                <Link to="/" className="flex items-center space-x-3">
                    <QuickPeLogo size="md" />
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                        {/* Logo and Title */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <KeyIcon className="h-10 w-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
                            <p className="text-slate-600">Enter your email and new password</p>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm"
                            >
                                ✅ Password reset successfully! Redirecting to signin...
                            </motion.div>
                        )}

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
                        <div className="space-y-5">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                                        className={`w-full pl-12 pr-4 py-3 bg-white/50 border ${
                                            validationErrors.email ? 'border-red-300' : 'border-slate-200'
                                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200`}
                                        placeholder="your.email@example.com"
                                        disabled={loading || success}
                                    />
                                </div>
                                {validationErrors.email && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                                )}
                            </div>

                            {/* New Password Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                                        className={`w-full pl-12 pr-12 py-3 bg-white/50 border ${
                                            validationErrors.newPassword ? 'border-red-300' : 'border-slate-200'
                                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200`}
                                        placeholder="Enter new password"
                                        disabled={loading || success}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                        disabled={loading || success}
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </button>
                                </div>
                                {validationErrors.newPassword && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                                        className={`w-full pl-12 pr-12 py-3 bg-white/50 border ${
                                            validationErrors.confirmPassword ? 'border-red-300' : 'border-slate-200'
                                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200`}
                                        placeholder="Confirm new password"
                                        disabled={loading || success}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                        disabled={loading || success}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </button>
                                </div>
                                {validationErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Reset Button */}
                            <motion.button
                                whileHover={{ scale: loading || success ? 1 : 1.02 }}
                                whileTap={{ scale: loading || success ? 1 : 0.98 }}
                                onClick={handleResetPassword}
                                disabled={loading || success}
                                className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 ${
                                    loading || success
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resetting Password...
                                    </span>
                                ) : success ? (
                                    'Password Reset Successfully!'
                                ) : (
                                    'Reset Password'
                                )}
                            </motion.button>
                        </div>

                        {/* Back to Signin Link */}
                        <div className="mt-6 text-center">
                            <Link
                                to="/signin"
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-200"
                            >
                                ← Back to Sign In
                            </Link>
                        </div>

                        {/* Test Note */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-xs text-blue-700 text-center">
                                <strong>Test Mode:</strong> This is a simple password reset for testing purposes. 
                                Enter any registered email and a new password to reset it.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
};

export default ResetPassword;
