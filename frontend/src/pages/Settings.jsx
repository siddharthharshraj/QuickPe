import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import apiClient from "../services/api/client";
// PDF utilities removed - using React-PDF components instead

export const Settings = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({
        firstName: "",
        lastName: "",
        username: "",
        userId: ""
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedInfo, setEditedInfo] = useState({
        firstName: "",
        lastName: "",
        username: ""
    });
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: ""
    });
    const [updating, setUpdating] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [settingsEnabled, setSettingsEnabled] = useState(true);
    
    // Check if settings are disabled for this user (from backend)
    const isTestUser = !settingsEnabled;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        const loadUserProfile = async () => {
            try {
                // First try to get user info from token
                const decoded = jwtDecode(token);
                
                // Then fetch full profile from backend
                const response = await apiClient.get('/profile');
                if (response.data && response.data.user) {
                    const profile = response.data.user;
                    setUserProfile(profile);
                    setSettingsEnabled(profile.settingsEnabled !== false);
                    setUserInfo({
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        username: profile.email || profile.username || '',
                        userId: profile._id || profile.id || ''
                    });
                    setEditedInfo({
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        username: profile.email || profile.username || ''
                    });
                } else if (response.data) {
                    // Handle direct response format
                    const profile = response.data;
                    setUserProfile(profile);
                    setSettingsEnabled(profile.settingsEnabled !== false);
                    setUserInfo({
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        username: profile.email || profile.username || '',
                        userId: profile._id || profile.id || ''
                    });
                    setEditedInfo({
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        username: profile.email || profile.username || ''
                    });
                } else {
                    // Fallback to token data
                    setUserInfo({
                        firstName: decoded.firstName || '',
                        lastName: decoded.lastName || '',
                        username: decoded.email || decoded.username || '',
                        userId: decoded.userId || decoded.id || ''
                    });
                    setEditedInfo({
                        firstName: decoded.firstName || '',
                        lastName: decoded.lastName || '',
                        username: decoded.email || decoded.username || ''
                    });
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
                // Fallback to token data if API fails
                try {
                    const decoded = jwtDecode(token);
                    setUserInfo({
                        firstName: decoded.firstName || '',
                        lastName: decoded.lastName || '',
                        username: decoded.email || decoded.username || '',
                        userId: decoded.userId || decoded.id || ''
                    });
                    setEditedInfo({
                        firstName: decoded.firstName || '',
                        lastName: decoded.lastName || '',
                        username: decoded.email || decoded.username || ''
                    });
                } catch (tokenError) {
                    console.error('Error decoding token:', tokenError);
                    navigate("/signin");
                    return;
                }
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, [navigate]);

    const handleSaveProfile = async () => {
        if (isTestUser) {
            alert('Demo accounts cannot be modified');
            return;
        }

        setUpdating(true);
        try {
            const response = await apiClient.put('/profile', editedInfo);
            
            if (response.data.success) {
                setUserInfo(editedInfo);
                setIsEditing(false);
                alert('Profile updated successfully!');
            } else {
                alert(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update profile';
            alert(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        if (isTestUser) {
            alert('Demo accounts cannot be modified');
            return;
        }

        if (!passwordData.newPassword || !passwordData.confirmPassword) {
            alert('Please fill in all password fields!');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match!');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            alert('New password must be at least 6 characters long!');
            return;
        }

        setUpdating(true);
        try {
            const response = await apiClient.put('/change-password', {
                newPassword: passwordData.newPassword
            });
            
            if (response.data.success) {
                setPasswordData({
                    newPassword: "",
                    confirmPassword: ""
                });
                setShowChangePassword(false);
                alert('Password changed successfully!');
            } else {
                alert(response.data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMessage = error.response?.data?.message || 'Failed to change password';
            alert(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Profile Information Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                            {!isTestUser && (
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {isEditing ? "Cancel" : "Edit Profile"}
                                </button>
                            )}
                            {isTestUser && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                                    Test Account - Read Only
                                </span>
                            )}
                        </div>
                        
                        {/* User Profile Details */}
                        {userProfile && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Account Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">QuickPe ID</label>
                                        <p className="mt-1 text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border">
                                            {userProfile.quickpeId || 'Not assigned'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Account Created</label>
                                        <p className="mt-1 text-sm text-gray-900 bg-white px-3 py-2 rounded border">
                                            {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Account Status</label>
                                        <p className="mt-1 text-sm text-emerald-600 font-medium bg-white px-3 py-2 rounded border">
                                            Active
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Account Type</label>
                                        <p className="mt-1 text-sm text-gray-900 bg-white px-3 py-2 rounded border">
                                            {isTestUser ? 'Test Account' : 'Regular Account'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedInfo.firstName}
                                            onChange={(e) => setEditedInfo(prev => ({...prev, firstName: e.target.value}))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                            {userInfo.firstName}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedInfo.lastName}
                                            onChange={(e) => setEditedInfo(prev => ({...prev, lastName: e.target.value}))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                            {userInfo.lastName}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Registered Email
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editedInfo.username}
                                            onChange={(e) => setEditedInfo(prev => ({...prev, username: e.target.value}))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={isTestUser}
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 flex items-center">
                                            <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                            {userInfo.username}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        User ID (Non-editable)
                                    </label>
                                    <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 font-mono text-sm cursor-not-allowed">
                                        {userInfo.userId}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Edit/Save Buttons */}
                        <div className="mt-6 flex justify-end space-x-3">
                            {isTestUser && (
                                <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-amber-800">Demo Account - Editing Restricted</p>
                                            <p className="text-xs text-amber-700">This is a test user account. Profile editing is disabled to maintain demo consistency.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedInfo({
                                                firstName: userInfo.firstName,
                                                lastName: userInfo.lastName,
                                                username: userInfo.username
                                            });
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        disabled={updating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={updating}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {updating ? "Saving..." : "Save Changes"}
                                    </button>
                                </>
                            ) : null}
                        </div>

                        {/* Change Password Section */}
                        {!isTestUser && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                                    <button
                                        onClick={() => setShowChangePassword(!showChangePassword)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        {showChangePassword ? "Cancel" : "Change Password"}
                                    </button>
                                </div>

                                {showChangePassword && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex justify-end">
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={updating}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {updating ? "Updating..." : "Update Password"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Delete Account */}
                        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 mt-6">
                            <div className="flex items-center">
                                <div className="bg-red-100 p-3 rounded-lg mr-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-medium text-red-900">Delete Account</h3>
                                    <p className="text-sm text-red-700">
                                        {isTestUser ? "Demo accounts cannot be deleted" : "Permanently delete your account and data"}
                                    </p>
                                </div>
                            </div>
                            <button 
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isTestUser 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                                disabled={isTestUser}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Settings;
