import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";
import { SkeletonLoader } from "./SkeletonLoader";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState({
        startDate: "",
        endDate: ""
    });
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [copySuccess, setCopySuccess] = useState("");

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError("");
        
        try {
            // Add 3 second delay for better UX with skeleton loading
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const response = await apiClient.get(`/account/transactions?page=${pagination.page}&limit=${pagination.limit}`);
            
            if (response.data && response.data.transactions) {
                const transactionsArray = Array.isArray(response.data.transactions) ? response.data.transactions : [];
                const paginationData = response.data.pagination;
                
                setTransactions(transactionsArray);
                
                // Update pagination if data is available
                if (paginationData) {
                    setPagination(prev => ({
                        ...prev,
                        total: Number(paginationData.total) || 0,
                        pages: Number(paginationData.pages) || 1,
                        limit: Number(paginationData.limit) || 10
                    }));
                }
            } else {
                setError(response.error || "Failed to fetch transactions");
            }
            
        } catch (error) {
            const errorMessage = error.message || "An unexpected error occurred";
            setError(errorMessage);
            console.error("Error in fetchTransactions:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Filter transactions based on search query and date filters
    useEffect(() => {
        let filtered = transactions;

        // Filter by search query (transaction ID, description, or user name)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            
            filtered = filtered.filter(transaction => {
                const transactionId = (transaction.transactionId || '').toString().toLowerCase();
                const description = (transaction.description || '').toString().toLowerCase();
                const userName = (transaction.otherUser?.name || '').toString().toLowerCase();
                
                return transactionId.includes(query) ||
                       description.includes(query) ||
                       userName.includes(query);
            });
        }

        // Filter by date range
        if (dateFilter.startDate || dateFilter.endDate) {
            filtered = filtered.filter(transaction => {
                const transactionDate = new Date(transaction.timestamp);
                const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
                const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

                if (startDate && endDate) {
                    return transactionDate >= startDate && transactionDate <= endDate;
                } else if (startDate) {
                    return transactionDate >= startDate;
                } else if (endDate) {
                    return transactionDate <= endDate;
                }
                return true;
            });
        }

        setFilteredTransactions(filtered);
    }, [transactions, searchQuery, dateFilter]);

    const clearFilters = () => {
        setSearchQuery("");
        setDateFilter({ startDate: "", endDate: "" });
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess("Copied!");
            setTimeout(() => setCopySuccess(""), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setCopySuccess("Failed to copy");
            setTimeout(() => setCopySuccess(""), 2000);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString, isMobile = false) => {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            
            if (isMobile) {
                return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.pages) return;
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const downloadPDFStatement = async () => {
        setDownloadingPDF(true);
        try {
            // Get user info from token
            const token = localStorage.getItem("token");
            let userInfo = { firstName: "User", lastName: "", username: "", userId: "" };
            
            if (token) {
                try {
                    const { jwtDecode } = await import("jwt-decode");
                    const decoded = jwtDecode(token);
                    userInfo = {
                        firstName: decoded.firstName || "User",
                        lastName: decoded.lastName || "",
                        username: decoded.username || "",
                        userId: decoded.userId || ""
                    };
                } catch (error) {
                    console.warn('Could not decode token for PDF');
                }
            }

            // Fetch all transactions for PDF
            let allTransactions = [];
            try {
                const response = await apiClient.get('/account/transactions?limit=1000');
                allTransactions = response.data.transactions || [];
            } catch (apiError) {
                console.warn('Failed to fetch transactions, generating PDF without transaction data:', apiError);
            }

            // Create PDF
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(18);
            doc.setTextColor(59, 130, 246);
            doc.text('QuickPe Wallet Statement', 20, 28);
            
            // User info in compact table format
            const userTableData = [
                ['Account Holder', `${userInfo.firstName} ${userInfo.lastName}`.trim()],
                ['Email', userInfo.username || 'N/A'],
                ['User ID', userInfo.userId || 'N/A'],
                ['Generated', `${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`]
            ];

            autoTable(doc, {
                startY: 38,
                head: [['Field', 'Details']],
                body: userTableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: 50
                },
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },
                    1: { cellWidth: 130 }
                },
                margin: { left: 20, right: 20 }
            });

            const userTableEndY = doc.lastAutoTable.finalY + 10;

            // Transaction table
            let finalY;
            if (allTransactions.length > 0) {
                const tableData = allTransactions.map((transaction, index) => [
                    (index + 1).toString(),
                    transaction.transactionId || `TXN${Date.now()}${index}`,
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
                    `Rs. ${Number(transaction.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`,
                    transaction.description || 'Money Transfer'
                ]);

                autoTable(doc, {
                    startY: userTableEndY,
                    head: [['S.No.', 'Transaction ID', 'Date', 'Time', 'Description', 'Type', 'Amount', 'Reference']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [59, 130, 246],
                        textColor: 255,
                        fontSize: 9,
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: 50
                    },
                    columnStyles: {
                        0: { cellWidth: 12 },
                        1: { cellWidth: 22 },
                        2: { cellWidth: 18 },
                        3: { cellWidth: 16 },
                        4: { cellWidth: 40 },
                        5: { cellWidth: 16 },
                        6: { cellWidth: 20 },
                        7: { cellWidth: 20 }
                    },
                    margin: { left: 20, right: 20 }
                });

                finalY = doc.lastAutoTable.finalY;
            } else {
                finalY = userTableEndY + 15;
                doc.setFontSize(11);
                doc.setTextColor(150, 150, 150);
                doc.text('No transactions found for this account.', 20, finalY);
                doc.setFontSize(9);
                doc.text('Start using QuickPe to send and receive money!', 20, finalY + 12);
            }

            // Summary section - compact
            const totalReceived = allTransactions
                .filter(t => t.type === 'received')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            
            const totalSent = allTransactions
                .filter(t => t.type === 'sent')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            // Get current balance
            let currentBalance = 0;
            try {
                const balanceResponse = await apiClient.get('/account/balance');
                currentBalance = balanceResponse.data.balance || 0;
            } catch (error) {
                console.warn('Could not fetch balance for PDF');
            }

            // Compact summary box
            const summaryY = finalY + 12;
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.5);
            doc.rect(20, summaryY, 170, 25);
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(59, 130, 246);
            doc.text('ACCOUNT SUMMARY', 25, summaryY + 8);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Received: Rs. ${totalReceived.toLocaleString('en-IN')}`, 25, summaryY + 15);
            doc.text(`Total Sent: Rs. ${totalSent.toLocaleString('en-IN')}`, 25, summaryY + 20);
            doc.text(`Current Balance: Rs. ${currentBalance.toLocaleString('en-IN')}`, 115, summaryY + 15);
            doc.text(`Total Transactions: ${allTransactions.length}`, 115, summaryY + 20);

            const summaryEndY = summaryY + 25;

            // Check if footer will fit on current page
            const pageHeight = doc.internal.pageSize.height;
            const footerHeight = 40;
            
            let footerStartY;
            if (summaryEndY + footerHeight > pageHeight - 25) {
                doc.addPage();
                footerStartY = 30;
            } else {
                footerStartY = summaryEndY + 15;
            }
            
            // Professional Footer Section
            // Top border line
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(1);
            doc.line(20, footerStartY, 190, footerStartY);
            
            // Footer background (subtle)
            doc.setFillColor(248, 250, 252);
            doc.rect(20, footerStartY + 1, 170, 35, 'F');
            
            // Three-column professional layout
            const leftCol = 25;
            const centerCol = 85;
            const rightCol = 145;
            
            // Left Column - Developer Info
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text('DEVELOPED BY', leftCol, footerStartY + 10);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(59, 130, 246);
            doc.text('Siddharth Harsh Raj', leftCol, footerStartY + 16);
            
            doc.setFontSize(6);
            doc.setTextColor(100, 116, 139);
            doc.text('Full Stack Developer', leftCol, footerStartY + 21);
            doc.text(new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), leftCol, footerStartY + 26);
            
            // Center Column - Technology Stack
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text('TECHNOLOGY', centerCol, footerStartY + 10);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6);
            doc.setTextColor(100, 116, 139);
            doc.text('React.js • Node.js', centerCol, footerStartY + 16);
            doc.text('MongoDB • Express.js', centerCol, footerStartY + 20);
            doc.text('JWT • Tailwind CSS', centerCol, footerStartY + 24);
            doc.text('Socket.io • jsPDF', centerCol, footerStartY + 28);
            
            // Right Column - Contact Information
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text('CONNECT', rightCol, footerStartY + 10);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6);
            doc.setTextColor(59, 130, 246);
            
            // Professional contact links with proper spacing
            doc.textWithLink('LinkedIn Profile', rightCol, footerStartY + 16, { 
                url: 'https://www.linkedin.com/in/siddharthharshraj/' 
            });
            
            doc.textWithLink('Portfolio Website', rightCol, footerStartY + 20, { 
                url: 'https://siddharth-dev.tech' 
            });
            
            doc.textWithLink('contact@siddharth-dev.tech', rightCol, footerStartY + 24, { 
                url: 'mailto:contact@siddharth-dev.tech' 
            });
            
            // Bottom border and copyright
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(20, footerStartY + 32, 190, footerStartY + 32);
            
            // Centered copyright and security notice
            doc.setFontSize(5);
            doc.setTextColor(148, 163, 184);
            doc.setFont("helvetica", "normal");
            
            const copyrightText = `© ${new Date().getFullYear()} Siddharth Harsh Raj. All rights reserved. | Computer-generated statement - No signature required.`;
            const textWidth = doc.getTextWidth(copyrightText);
            const centerX = (doc.internal.pageSize.width - textWidth) / 2;
            doc.text(copyrightText, centerX, footerStartY + 36);
            
            // Page numbering with professional styling
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(6);
                doc.setTextColor(148, 163, 184);
                doc.setFont("helvetica", "normal");
                
                doc.text(`Page ${i} of ${pageCount}`, 20, pageHeight - 10);
                
                const genText = `Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
                const genTextWidth = doc.getTextWidth(genText);
                doc.text(genText, doc.internal.pageSize.width - genTextWidth - 20, pageHeight - 10);
            }

            const fileName = `QuickPe_Statement_${userInfo.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(`Failed to generate PDF statement: ${error.message}`);
        } finally {
            setDownloadingPDF(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">Loading your transaction history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200 max-w-2xl mx-auto">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading transactions</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={fetchTransactions}
                                className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {copySuccess && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity">
                    {copySuccess}
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {filteredTransactions.length} of {pagination.total} {pagination.total === 1 ? 'transaction' : 'transactions'} shown
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={downloadPDFStatement}
                        disabled={downloadingPDF}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloadingPDF ? (
                            <>
                                <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Statement
                            </>
                        )}
                    </button>
                    <button
                        onClick={fetchTransactions}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search Bar */}
                    <div className="md:col-span-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                            Search Transactions
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="search"
                                placeholder="Search by Transaction ID, Description, or User..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range Filter
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="date"
                                    placeholder="Start Date"
                                    value={dateFilter.startDate}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    placeholder="End Date"
                                    value={dateFilter.endDate}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Actions */}
                {(searchQuery || dateFilter.startDate || dateFilter.endDate) && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {filteredTransactions.length} filtered results
                        </div>
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <SkeletonLoader />
            ) : transactions.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-12 sm:px-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No transactions</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by making your first transaction.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transaction
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <p className="text-lg font-medium">No transactions found</p>
                                            <p className="text-sm">Try adjusting your search or filter criteria</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((transaction) => (
                                    <tr key={transaction._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                                    transaction.type === 'received' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {transaction.type === 'received' ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {transaction.otherUser?.name || 'Unknown User'}
                                                        <span className="md:hidden ml-2 text-xs text-gray-500">
                                                            {formatDate(transaction.timestamp, true)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {transaction.type === 'received' 
                                                            ? `Received from ${transaction.otherUser?.name || 'Unknown User'}`
                                                            : `Transfer to ${transaction.otherUser?.name || 'Unknown User'}`
                                                        }
                                                    </div>
                                                    <div className="flex items-center mt-1 text-xs text-gray-400">
                                                        <span className="font-mono">
                                                            ID: {transaction.transactionId || `TXN${Date.now()}`}
                                                        </span>
                                                        <button
                                                            onClick={() => copyToClipboard(transaction.transactionId || `TXN${Date.now()}`)}
                                                            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors relative"
                                                            title="Copy Transaction ID"
                                                        >
                                                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                                transaction.type === 'received' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {transaction.type === 'received' ? (
                                                    <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                                                        <path d="M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 8 8">
                                                        <path d="M4 0L0 4h3v4h2V4h3L4 0z" />
                                                    </svg>
                                                )}
                                                {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                            {formatDate(transaction.timestamp)}
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                        pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.pages}
                                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                        pagination.page >= pagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{transactions.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                                        </span>{' '}
                                        of <span className="font-medium">{pagination.total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                                pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.pages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.page >= pagination.pages - 2) {
                                                pageNum = pagination.pages - 4 + i;
                                            } else {
                                                pageNum = pagination.page - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        pagination.page === pageNum 
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.pages}
                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                                pagination.page >= pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
