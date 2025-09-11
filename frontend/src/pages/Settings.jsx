import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Appbar } from "../components/Appbar";
import { Footer } from "../components/Footer";
import apiClient from "../api/client";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    
    // Test user emails that should be restricted from editing
    const testUserEmails = ['sid.raj@quickpe.com', 'siddharth.sinha@quickpe.com', 'harsh.raj@quickpe.com'];
    const isTestUser = testUserEmails.includes(userInfo.username);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        const loadUserProfile = async () => {
            try {
                const decoded = jwtDecode(token);
                
                let userInfoData = {
                    firstName: decoded.firstName || "",
                    lastName: decoded.lastName || "",
                    username: decoded.username || "",
                    userId: decoded.userId || ""
                };


                // Always fetch from backend to ensure we have the latest data
                try {
                    const response = await apiClient.get('/user/profile');
                    const profileData = response.data.user;
                    userInfoData = {
                        firstName: profileData.firstName || userInfoData.firstName,
                        lastName: profileData.lastName || userInfoData.lastName,
                        username: profileData.username || userInfoData.username,
                        userId: profileData._id || userInfoData.userId
                    };
                } catch (apiError) {
                    // Continue with JWT data even if API call fails
                }

                setUserInfo(userInfoData);
                setEditedInfo({
                    firstName: userInfoData.firstName,
                    lastName: userInfoData.lastName,
                    username: userInfoData.username
                });
            } catch (error) {
                navigate("/signin");
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, [navigate]);

    const downloadPDFStatement = async () => {
        setDownloadingPDF(true);
        try {
            let transactions = [];
            
            // Try to fetch transaction data, but continue even if it fails
            try {
                const response = await apiClient.get('/account/transactions?limit=1000');
                transactions = response.data.transactions || [];
                
                // If API call succeeds but returns empty, try alternative endpoint
                if (transactions.length === 0) {
                    // You can add fallback logic here if needed
                }
            } catch (apiError) {
                console.warn('Failed to fetch transactions, generating PDF without transaction data:', apiError);
                // Continue with empty transactions array
            }

            // Create PDF
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(20);
            doc.setTextColor(59, 130, 246); // Blue color
            doc.text('QuickPe Wallet Statement', 20, 30);
            
            // User info
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Account Holder: ${userInfo.firstName} ${userInfo.lastName}`, 20, 50);
            doc.text(`Email: ${userInfo.username}`, 20, 60);
            doc.text(`User ID: ${userInfo.userId}`, 20, 70);
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, 20, 80);

            // Line separator
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 90, 190, 90);

            // Transaction table
            if (transactions.length > 0) {
                const tableData = transactions.map((transaction, index) => [
                    (index + 1).toString(),
                    new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }),
                    new Date(transaction.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    transaction.type === 'received' 
                        ? `Money Received from ${transaction.otherUser?.name || 'Unknown User'}`
                        : `Money Sent to ${transaction.otherUser?.name || 'Unknown User'}`,
                    transaction.type === 'received' ? 'CREDIT' : 'DEBIT',
                    `Rs. ${transaction.amount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`,
                    transaction.description || 'Money Transfer'
                ]);

                autoTable(doc, {
                    startY: 100,
                    head: [['S.No.', 'Date', 'Time', 'Transaction Description', 'Type', 'Amount', 'Reference']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [59, 130, 246],
                        textColor: 255,
                        fontSize: 9,
                        fontStyle: 'bold',
                        halign: 'center',
                        valign: 'middle',
                        lineWidth: 0.5,
                        lineColor: [255, 255, 255],
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: 50,
                        lineWidth: 0.2,
                        lineColor: [200, 200, 200],
                        cellPadding: 3,
                        valign: 'middle'
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252]
                    },
                    columnStyles: {
                        0: { cellWidth: 15, halign: 'center' },   // S.No.
                        1: { cellWidth: 25, halign: 'center' },   // Date
                        2: { cellWidth: 20, halign: 'center' },   // Time
                        3: { cellWidth: 60, halign: 'left' },     // Description
                        4: { cellWidth: 18, halign: 'center' },   // Type
                        5: { cellWidth: 28, halign: 'right' },    // Amount
                        6: { cellWidth: 24, halign: 'left' }      // Reference
                    },
                    margin: { left: 10, right: 10 },
                    tableWidth: 'auto'
                });

                // Get current balance from user info or calculate
                let currentBalance = 0;
                try {
                    const balanceResponse = await apiClient.get('/account/balance');
                    currentBalance = balanceResponse.data.balance || 0;
                } catch (error) {
                    console.warn('Could not fetch current balance for PDF');
                    currentBalance = 0; // Set to 0 if can't fetch
                }

                // Summary section
                const totalReceived = transactions
                    .filter(t => t.type === 'received')
                    .reduce((sum, t) => sum + t.amount, 0);
                
                const totalSent = transactions
                    .filter(t => t.type === 'sent')
                    .reduce((sum, t) => sum + t.amount, 0);

                const finalY = doc.lastAutoTable.finalY + 15;
                
                // Enhanced Summary box
                doc.setDrawColor(59, 130, 246);
                doc.setLineWidth(0.8);
                doc.rect(20, finalY, 170, 50);
                
                doc.setFillColor(245, 247, 250);
                doc.rect(20, finalY, 170, 50, 'F');
                
                // Summary header
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(50, 50, 50);
                doc.text('TRANSACTION SUMMARY', 25, finalY + 12);
                
                // Summary details in two columns
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(70, 70, 70);
                
                // Left column
                doc.text(`Total Transactions: ${transactions.length}`, 25, finalY + 22);
                doc.text(`Total Credit: Rs. ${totalReceived.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 25, finalY + 30);
                doc.text(`Total Debit: Rs. ${totalSent.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 25, finalY + 38);
                
                // Right column - Current Balance (highlighted)
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(59, 130, 246);
                doc.text(`Current Balance: Rs. ${currentBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 110, finalY + 22);
                
                // Net Amount
                doc.setFontSize(9);
                doc.setTextColor(totalReceived - totalSent >= 0 ? [34, 197, 94] : [239, 68, 68]);
                doc.text(`Net Amount: Rs. ${(totalReceived - totalSent).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 110, finalY + 32);
            } else {
                doc.setFontSize(12);
                doc.setTextColor(150, 150, 150);
                doc.text('No transactions found for this account.', 20, 120);
                doc.setFontSize(10);
                doc.text('Start using QuickPe to send and receive money!', 20, 135);
            }

            // Enhanced Footer Section (properly aligned three-column layout)
            const pageHeight = doc.internal.pageSize.height;
            const footerStartY = pageHeight - 85;
            
            // Footer separator line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(20, footerStartY, 190, footerStartY);
            
            // Three-column footer layout with proper spacing
            const col1X = 20;   // Left column
            const col2X = 75;   // Center column  
            const col3X = 135;  // Right column
            
            // Column 1: Built By (Developer Info)
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(59, 130, 246);
            doc.text('Built By', col1X, footerStartY + 12);
            
            doc.setFont("helvetica", "bold");
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(9);
            doc.text('Siddharth Harsh Raj', col1X, footerStartY + 22);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), col1X, footerStartY + 30);
            
            // Column 2: Tech Stack (Center aligned)
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(59, 130, 246);
            doc.text('Tech Stack', col2X, footerStartY + 12);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            const techStack = ['React', 'Node.js', 'Express'];
            doc.text(techStack.join(' • '), col2X, footerStartY + 20);
            const techStack2 = ['MongoDB', 'JWT', 'Tailwind CSS'];
            doc.text(techStack2.join(' • '), col2X, footerStartY + 27);
            doc.text('Socket.io', col2X, footerStartY + 34);
            
            // Column 3: Connect (Right aligned)
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(59, 130, 246);
            doc.text('Connect', col3X, footerStartY + 12);
            
            // LinkedIn Profile link
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(59, 130, 246);
            doc.textWithLink('LinkedIn Profile', col3X, footerStartY + 22, { 
                url: 'https://www.linkedin.com/in/siddharthharshraj/' 
            });
            
            // Portfolio link
            doc.textWithLink('Portfolio', col3X, footerStartY + 30, { 
                url: 'https://siddharth-dev.tech' 
            });
            
            // Email link
            doc.textWithLink('contact@siddharth-dev.tech', col3X, footerStartY + 38, { 
                url: 'mailto:contact@siddharth-dev.tech' 
            });
            
            // Copyright section (bottom center)
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.3);
            doc.line(20, footerStartY + 48, 190, footerStartY + 48);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            const copyrightText = `© ${new Date().getFullYear()} Siddharth Harsh Raj. All rights reserved.`;
            const textWidth = doc.getTextWidth(copyrightText);
            const centerX = (doc.internal.pageSize.width - textWidth) / 2;
            doc.text(copyrightText, centerX, footerStartY + 58);
            
            // Security notice (centered)
            const securityText1 = 'This is a computer-generated statement. No signature required.';
            const securityText2 = 'Please verify all transactions and report discrepancies within 30 days.';
            const security1Width = doc.getTextWidth(securityText1);
            const security2Width = doc.getTextWidth(securityText2);
            doc.text(securityText1, (doc.internal.pageSize.width - security1Width) / 2, footerStartY + 68);
            doc.text(securityText2, (doc.internal.pageSize.width - security2Width) / 2, footerStartY + 75);
            
            // Page numbering
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(`Page ${i} of ${pageCount}`, 20, pageHeight - 5);
                doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, 
                         doc.internal.pageSize.width - 80, pageHeight - 5);
            }

            // Save the PDF
            const fileName = `QuickPe_Statement_${userInfo.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Full error details:', error.response?.data || error.message);
            
            // Show more specific error message
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            alert(`Failed to generate PDF statement: ${errorMessage}`);
        } finally {
            setDownloadingPDF(false);
        }
    };

    const handleSaveProfile = async () => {
        setUpdating(true);
        try {
            const response = await apiClient.put('/user/profile', {
                firstName: editedInfo.firstName,
                lastName: editedInfo.lastName,
                username: editedInfo.username
            });

            // Update local state
            setUserInfo(prev => ({
                ...prev,
                firstName: editedInfo.firstName,
                lastName: editedInfo.lastName,
                username: editedInfo.username
            }));

            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            console.error('Full error details:', error.response?.data || error.message);
            
            const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
            alert(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async () => {
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
            await apiClient.put('/user/change-password', {
                newPassword: passwordData.newPassword
            });

            setPasswordData({
                newPassword: "",
                confirmPassword: ""
            });
            setShowChangePassword(false);
            alert('Password changed successfully!');
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
            <div>
                <Appbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Appbar />
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
                        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                        <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
                    </div>

                    {/* Profile Information Card */}
                    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mr-4">
                                    {userInfo.firstName[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {userInfo.firstName} {userInfo.lastName}
                                    </h3>
                                    <p className="text-gray-600">QuickPayer</p>
                                </div>
                            </div>

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
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 flex items-center">
                                                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {updating ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        disabled={isTestUser}
                                        className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                                            isTestUser 
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                        title={isTestUser ? 'Profile editing is disabled for demo accounts' : 'Edit your profile'}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        {isTestUser ? 'Editing Disabled' : 'Edit Profile'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Account Actions Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Actions</h2>
                            <div className="space-y-4">
                                {/* Change Password */}
                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Change Password</h3>
                                            <p className="text-sm text-gray-500">
                                                {isTestUser ? "Demo account passwords cannot be changed" : "Update your account password"}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowChangePassword(!showChangePassword)}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            isTestUser 
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                        disabled={isTestUser}
                                    >
                                        Change
                                    </button>
                                </div>

                                {/* Change Password Form */}
                                {showChangePassword && !isTestUser && (
                                    <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                                        <div className="space-y-4">
                                            <div className="flex items-start p-3 bg-blue-100 rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-blue-800">
                                                        <strong>Note:</strong> You can change your password without entering your current password. Make sure to remember your new password.
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Enter new password (min 6 characters)"
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
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setShowChangePassword(false);
                                                        setPasswordData({
                                                            newPassword: "",
                                                            confirmPassword: ""
                                                        });
                                                    }}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                                    disabled={updating}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleChangePassword}
                                                    disabled={updating}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updating ? 'Updating...' : 'Update Password'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Delete Account */}
                                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
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
                </div>
            </div>
            <Footer />
        </div>
    );
};
