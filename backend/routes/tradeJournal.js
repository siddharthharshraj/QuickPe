const express = require('express');
const { authMiddleware } = require('../middleware/index');
const TradeJournal = require('../models/TradeJournal');
const TradeJournalLog = require('../models/TradeJournalLog');
const FeatureFlag = require('../models/FeatureFlag');
const User = require('../models/User');
// Simple CSV conversion function (no external dependency needed)
const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
};

const router = express.Router();

// Middleware to check if trade journal feature is enabled for user
const checkTradeJournalFeature = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        const tradeJournalFlag = await FeatureFlag.findOne({ name: 'trade_journal' });
        
        if (!tradeJournalFlag || !tradeJournalFlag.isEnabledForUser(req.userId, user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Trade Journal feature is not enabled for your account'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error checking trade journal feature:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all trades for user with pagination and filters
router.get('/', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const symbol = req.query.symbol;
        const status = req.query.status;
        const tradeType = req.query.tradeType;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const skip = (page - 1) * limit;

        let query = { userId: req.userId };

        // Apply filters
        if (symbol) {
            query.symbol = { $regex: symbol, $options: 'i' };
        }
        if (status) {
            query.status = status;
        }
        if (tradeType) {
            query.tradeType = tradeType;
        }
        if (startDate || endDate) {
            query.entryDate = {};
            if (startDate) query.entryDate.$gte = new Date(startDate);
            if (endDate) query.entryDate.$lte = new Date(endDate);
        }

        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sortObj = {};
        sortObj[sortBy] = sortOrder;

        const trades = await TradeJournal.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await TradeJournal.countDocuments(query);
        
        // Log portfolio view action
        await TradeJournalLog.logAction(
            req.userId,
            null,
            'PORTFOLIO_EXPORTED',
            {
                metadata: {
                    filterCriteria: query,
                    resultCount: trades.length,
                    totalRecords: total
                }
            },
            req
        );

        // Calculate summary statistics for all user trades (not just filtered ones)
        const mongoose = require('mongoose');
        const stats = await TradeJournal.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            {
                $group: {
                    _id: null,
                    totalTrades: { $sum: 1 },
                    totalPnL: { $sum: '$pnl' },
                    winningTrades: {
                        $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] }
                    },
                    losingTrades: {
                        $sum: { $cond: [{ $lt: ['$pnl', 0] }, 1, 0] }
                    },
                    avgHoldingPeriod: { $avg: '$holdingPeriod' },
                    totalInvested: {
                        $sum: { 
                            $multiply: [
                                { $toDouble: '$entryPrice' }, 
                                { $toDouble: '$quantity' }
                            ] 
                        }
                    }
                }
            }
        ]);

        const summary = stats[0] || {
            totalTrades: 0,
            totalPnL: 0,
            winningTrades: 0,
            losingTrades: 0,
            avgHoldingPeriod: 0,
            totalInvested: 0
        };

        // Ensure we have the correct total count and invested amount
        if (summary.totalTrades === 0) {
            const totalCount = await TradeJournal.countDocuments({ userId: req.userId });
            summary.totalTrades = totalCount;
        }
        
        // Recalculate total invested if it's 0 but we have trades
        if (summary.totalInvested === 0 && summary.totalTrades > 0) {
            const investmentStats = await TradeJournal.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
                {
                    $group: {
                        _id: null,
                        totalInvested: {
                            $sum: { 
                                $multiply: [
                                    { $toDouble: '$entryPrice' }, 
                                    { $toDouble: '$quantity' }
                                ] 
                            }
                        }
                    }
                }
            ]);
            summary.totalInvested = investmentStats[0]?.totalInvested || 0;
        }

        summary.winRate = summary.totalTrades > 0 ? 
            parseFloat(((summary.winningTrades / summary.totalTrades) * 100).toFixed(2)) : 0;

        res.json({
            success: true,
            trades,
            summary,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching trades:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single trade by ID
router.get('/:id', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const trade = await TradeJournal.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found'
            });
        }

        res.json({
            success: true,
            trade
        });
    } catch (error) {
        console.error('Error fetching trade:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create new trade
router.post('/', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const {
            symbol,
            tradeType,
            quantity,
            entryPrice,
            entryDate,
            strategy,
            notes,
            tags,
            sector,
            marketCap,
            stopLoss,
            target,
            brokerage,
            taxes
        } = req.body;

        // Validation
        if (!symbol || !tradeType || !quantity || !entryPrice || !entryDate) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: symbol, tradeType, quantity, entryPrice, entryDate'
            });
        }

        const trade = new TradeJournal({
            userId: req.userId,
            symbol: symbol.toUpperCase(),
            tradeType,
            quantity,
            entryPrice,
            entryDate: new Date(entryDate),
            strategy,
            notes,
            tags: tags || [],
            sector,
            marketCap,
            stopLoss,
            target,
            brokerage: brokerage || 0,
            taxes: taxes || 0
        });

        await trade.save();
        
        // Log trade creation
        await TradeJournalLog.logAction(
            req.userId,
            trade._id,
            'TRADE_CREATED',
            {
                newData: trade.toObject(),
                impact: {
                    portfolioValue: trade.entryPrice * trade.quantity,
                    tradeCount: 1
                }
            },
            req
        );

        res.status(201).json({
            success: true,
            message: 'Trade created successfully',
            trade
        });
    } catch (error) {
        console.error('Error creating trade:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update trade
router.put('/:id', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const trade = await TradeJournal.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found'
            });
        }

        // Update allowed fields
        const allowedFields = [
            'symbol', 'tradeType', 'quantity', 'entryPrice', 'exitPrice',
            'entryDate', 'exitDate', 'strategy', 'notes', 'tags', 'sector',
            'marketCap', 'stopLoss', 'target', 'brokerage', 'taxes', 'status'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'symbol') {
                    trade[field] = req.body[field].toUpperCase();
                } else if (field === 'entryDate' || field === 'exitDate') {
                    trade[field] = req.body[field] ? new Date(req.body[field]) : null;
                } else {
                    trade[field] = req.body[field];
                }
            }
        });

        await trade.save();

        res.json({
            success: true,
            message: 'Trade updated successfully',
            trade
        });
    } catch (error) {
        console.error('Error updating trade:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Close trade (set exit price and date)
router.put('/:id/close', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const { exitPrice, exitDate, quantity: closeQuantity, closeType = 'FULL' } = req.body;
        
        const trade = await TradeJournal.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        
        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found'
            });
        }
        
        if (trade.status === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'Trade is already closed'
            });
        }
        
        const quantityToClose = closeType === 'PARTIAL' ? closeQuantity : trade.quantity;
        
        if (closeType === 'PARTIAL' && quantityToClose >= trade.quantity) {
            return res.status(400).json({
                success: false,
                message: 'Partial close quantity cannot be greater than or equal to total quantity'
            });
        }
        
        // Calculate P&L for closed quantity
        const pnl = trade.tradeType === 'BUY' 
            ? (exitPrice - trade.entryPrice) * quantityToClose
            : (trade.entryPrice - exitPrice) * quantityToClose;
            
        const pnlPercentage = ((pnl / (trade.entryPrice * quantityToClose)) * 100);
        
        // Calculate holding period in days
        const entryDate = new Date(trade.entryDate);
        const exit = new Date(exitDate);
        const holdingPeriod = Math.ceil((exit - entryDate) / (1000 * 60 * 60 * 24));
        
        if (closeType === 'FULL') {
            // Close entire position
            trade.exitPrice = exitPrice;
            trade.exitDate = exitDate;
            trade.status = 'CLOSED';
            trade.pnl = pnl;
            trade.pnlPercentage = pnlPercentage;
            trade.holdingPeriod = holdingPeriod;
            trade.realizedPnL = pnl;
            
            await trade.save();
            
            res.json({
                success: true,
                message: 'Trade closed successfully',
                trade,
                closedQuantity: quantityToClose,
                realizedPnL: pnl
            });
        } else {
            // Partial close - create new closed trade and update original
            const closedTrade = new TradeJournal({
                userId: trade.userId,
                symbol: trade.symbol,
                tradeType: trade.tradeType,
                quantity: quantityToClose,
                entryPrice: trade.entryPrice,
                exitPrice: exitPrice,
                entryDate: trade.entryDate,
                exitDate: exitDate,
                strategy: trade.strategy,
                notes: `Partial close of ${trade.symbol} (${quantityToClose}/${trade.quantity})`,
                tags: trade.tags,
                sector: trade.sector,
                marketCap: trade.marketCap,
                status: 'CLOSED',
                pnl: pnl,
                pnlPercentage: pnlPercentage,
                holdingPeriod: holdingPeriod,
                realizedPnL: pnl,
                parentTradeId: trade._id
            });
            
            await closedTrade.save();
            
            // Update original trade
            trade.quantity = trade.quantity - quantityToClose;
            trade.notes = `${trade.notes} | Partial close: ${quantityToClose} shares @ ₹${exitPrice}`;
            await trade.save();
            
            res.json({
                success: true,
                message: 'Trade partially closed successfully',
                originalTrade: trade,
                closedTrade: closedTrade,
                closedQuantity: quantityToClose,
                realizedPnL: pnl,
                remainingQuantity: trade.quantity
            });
        }
    } catch (error) {
        console.error('Error closing trade:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close trade'
        });
    }
});

// Delete trade
router.delete('/:id', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const trade = await TradeJournal.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found'
            });
        }

        res.json({
            success: true,
            message: 'Trade deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting trade:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get trade analytics
router.get('/analytics/summary', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const analytics = await TradeJournal.aggregate([
            { $match: { userId: req.userId } },
            {
                $facet: {
                    overview: [
                        {
                            $group: {
                                _id: null,
                                totalTrades: { $sum: 1 },
                                totalPnL: { $sum: '$pnl' },
                                totalInvested: { $sum: { $multiply: ['$entryPrice', '$quantity'] } },
                                winningTrades: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
                                losingTrades: { $sum: { $cond: [{ $lt: ['$pnl', 0] }, 1, 0] } },
                                avgHoldingPeriod: { $avg: '$holdingPeriod' },
                                maxProfit: { $max: '$pnl' },
                                maxLoss: { $min: '$pnl' }
                            }
                        }
                    ],
                    bySymbol: [
                        {
                            $group: {
                                _id: '$symbol',
                                count: { $sum: 1 },
                                totalPnL: { $sum: '$pnl' },
                                avgPnL: { $avg: '$pnl' }
                            }
                        },
                        { $sort: { totalPnL: -1 } },
                        { $limit: 10 }
                    ],
                    byMonth: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: '$entryDate' },
                                    month: { $month: '$entryDate' }
                                },
                                trades: { $sum: 1 },
                                pnl: { $sum: '$pnl' }
                            }
                        },
                        { $sort: { '_id.year': -1, '_id.month': -1 } },
                        { $limit: 12 }
                    ],
                    bySector: [
                        {
                            $match: { sector: { $exists: true, $ne: null } }
                        },
                        {
                            $group: {
                                _id: '$sector',
                                count: { $sum: 1 },
                                totalPnL: { $sum: '$pnl' }
                            }
                        },
                        { $sort: { totalPnL: -1 } }
                    ]
                }
            }
        ]);

        const result = analytics[0];
        const overview = result.overview[0] || {};
        
        // Calculate additional metrics
        overview.winRate = overview.totalTrades > 0 ? 
            ((overview.winningTrades / overview.totalTrades) * 100).toFixed(2) : 0;
        overview.avgPnL = overview.totalTrades > 0 ? 
            (overview.totalPnL / overview.totalTrades).toFixed(2) : 0;
        overview.roi = overview.totalInvested > 0 ? 
            ((overview.totalPnL / overview.totalInvested) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            analytics: {
                overview,
                bySymbol: result.bySymbol,
                byMonth: result.byMonth,
                bySector: result.bySector
            }
        });
    } catch (error) {
        console.error('Error fetching trade analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Export trades to CSV with real-time data
router.get('/export/csv', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('firstName lastName email quickpeId');
        const trades = await TradeJournal.find({ userId: req.userId })
            .sort({ entryDate: -1 })
            .lean();

        if (trades.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No trades found to export'
            });
        }

        // Calculate portfolio summary
        const summary = await TradeJournal.aggregate([
            { $match: { userId: req.userId } },
            {
                $group: {
                    _id: null,
                    totalTrades: { $sum: 1 },
                    totalPnL: { $sum: '$pnl' },
                    totalInvested: { $sum: { $multiply: ['$entryPrice', '$quantity'] } },
                    winningTrades: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } }
                }
            }
        ]);

        const portfolioSummary = summary[0] || {};
        const winRate = portfolioSummary.totalTrades > 0 ? 
            ((portfolioSummary.winningTrades / portfolioSummary.totalTrades) * 100).toFixed(2) : 0;

        // Prepare CSV data with QuickPe branding header
        const csvData = [];
        
        // Header information
        csvData.push({
            'QuickPe Trade Journal Export': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        csvData.push({
            'QuickPe Trade Journal Export': `Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        csvData.push({
            'QuickPe Trade Journal Export': `User: ${user.firstName} ${user.lastName} (${user.email})`,
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        csvData.push({
            'QuickPe Trade Journal Export': `QuickPe ID: ${user.quickpeId}`,
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        csvData.push({
            'QuickPe Trade Journal Export': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        // Portfolio Summary
        csvData.push({
            'QuickPe Trade Journal Export': 'PORTFOLIO SUMMARY',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        csvData.push({
            'QuickPe Trade Journal Export': `Total Trades: ${portfolioSummary.totalTrades || 0}`,
            '': `Total P&L: ₹${(portfolioSummary.totalPnL || 0).toLocaleString()}`,
            '': `Win Rate: ${winRate}%`,
            '': `Total Invested: ₹${(portfolioSummary.totalInvested || 0).toLocaleString()}`,
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        csvData.push({
            'QuickPe Trade Journal Export': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });

        // Column headers
        csvData.push({
            'QuickPe Trade Journal Export': 'Symbol',
            '': 'Type',
            '': 'Quantity',
            '': 'Entry Price',
            '': 'Exit Price',
            '': 'Entry Date',
            '': 'Exit Date',
            '': 'P&L',
            '': 'P&L %',
            '': 'Status',
            '': 'Strategy',
            '': 'Sector',
            '': 'Notes'
        });

        // Trade data
        trades.forEach(trade => {
            csvData.push({
                'QuickPe Trade Journal Export': trade.symbol,
                '': trade.tradeType,
                '': trade.quantity,
                '': `₹${trade.entryPrice}`,
                '': trade.exitPrice ? `₹${trade.exitPrice}` : '-',
                '': new Date(trade.entryDate).toLocaleDateString('en-IN'),
                '': trade.exitDate ? new Date(trade.exitDate).toLocaleDateString('en-IN') : '-',
                '': `₹${(trade.pnl || 0).toFixed(2)}`,
                '': `${(trade.pnlPercentage || 0).toFixed(2)}%`,
                '': trade.status,
                '': trade.strategy || '-',
                '': trade.sector || '-',
                '': trade.notes || '-'
            });
        });

        // Footer
        csvData.push({
            'QuickPe Trade Journal Export': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        csvData.push({
            'QuickPe Trade Journal Export': 'Powered by QuickPe - Your Digital Wallet',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });
        
        csvData.push({
            'QuickPe Trade Journal Export': 'Developed by: Siddharth Harsh Raj | contact@siddharth-dev.tech',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': '',
            '': ''
        });

        // Convert to CSV
        const csv = convertToCSV(csvData);

        // Log export action
        await TradeJournalLog.logAction(
            req.userId,
            null,
            'PORTFOLIO_EXPORTED',
            {
                metadata: {
                    exportFormat: 'CSV',
                    recordCount: trades.length,
                    portfolioSummary
                }
            },
            req
        );

        // Set response headers
        const filename = `QuickPe_TradeJournal_${user.quickpeId}_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('X-QuickPe-Export', 'TradeJournal');
        
        res.send(csv);

    } catch (error) {
        console.error('Error exporting trade journal:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get trade journal activity logs
router.get('/logs', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const logs = await TradeJournalLog.find({ userId: req.userId })
            .populate('tradeId', 'symbol tradeType status')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await TradeJournalLog.countDocuments({ userId: req.userId });

        // Get activity summary
        const activitySummary = await TradeJournalLog.getUserActivitySummary(req.userId);

        res.json({
            success: true,
            logs,
            activitySummary,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching trade journal logs:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Export trades to JSON with real-time data
router.get('/export/json', authMiddleware, checkTradeJournalFeature, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('firstName lastName email quickpeId balance');
        const trades = await TradeJournal.find({ userId: req.userId })
            .sort({ entryDate: -1 })
            .lean();

        // Calculate real-time portfolio summary
        const summary = await TradeJournal.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            {
                $group: {
                    _id: null,
                    totalTrades: { $sum: 1 },
                    totalPnL: { $sum: '$pnl' },
                    totalRealizedPnL: { $sum: '$realizedPnL' },
                    winningTrades: {
                        $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] }
                    },
                    losingTrades: {
                        $sum: { $cond: [{ $lt: ['$pnl', 0] }, 1, 0] }
                    },
                    totalInvested: {
                        $sum: { 
                            $multiply: [
                                { $toDouble: '$entryPrice' }, 
                                { $toDouble: '$quantity' }
                            ] 
                        }
                    },
                    avgHoldingPeriod: { $avg: '$holdingPeriod' }
                }
            }
        ]);

        const portfolioSummary = summary[0] || {
            totalTrades: 0,
            totalPnL: 0,
            totalRealizedPnL: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalInvested: 0,
            avgHoldingPeriod: 0
        };

        portfolioSummary.winRate = portfolioSummary.totalTrades > 0 ? 
            ((portfolioSummary.winningTrades / portfolioSummary.totalTrades) * 100) : 0;

        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                user: {
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    quickpeId: user.quickpeId,
                    currentBalance: user.balance
                },
                summary: portfolioSummary
            },
            trades: trades.map(trade => ({
                id: trade._id,
                symbol: trade.symbol,
                tradeType: trade.tradeType,
                quantity: trade.quantity,
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                entryDate: trade.entryDate,
                exitDate: trade.exitDate,
                status: trade.status,
                pnl: trade.pnl || 0,
                pnlPercentage: trade.pnlPercentage || 0,
                realizedPnL: trade.realizedPnL || 0,
                holdingPeriod: trade.holdingPeriod || 0,
                strategy: trade.strategy,
                sector: trade.sector,
                notes: trade.notes,
                createdAt: trade.createdAt,
                updatedAt: trade.updatedAt
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="quickpe-trades-${user.quickpeId}-${new Date().toISOString().split('T')[0]}.json"`);
        
        res.json(exportData);
    } catch (error) {
        console.error('Error exporting trades to JSON:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export trades'
        });
    }
});

// Get real-time market data (placeholder for Indian market integration)
router.get('/market-data', async (req, res) => {
    try {
        // This would integrate with actual Indian market APIs like NSE/BSE
        // For now, returning mock data structure
        const marketData = {
            status: 'OPEN', // OPEN, CLOSED, PRE_OPEN, POST_CLOSE
            timestamp: new Date().toISOString(),
            indices: {
                nifty50: {
                    value: 19674.25,
                    change: 156.75,
                    changePercent: 0.80
                },
                sensex: {
                    value: 65953.48,
                    change: 528.17,
                    changePercent: 0.81
                }
            },
            topGainers: [
                { symbol: 'RELIANCE', price: 3306.26, change: -25.20, changePercent: -0.76, sector: 'Oil & Gas' },
                { symbol: 'TCS', price: 1482.54, change: 27.45, changePercent: 1.94, sector: 'IT Services' },
                { symbol: 'HDFCBANK', price: 1249.67, change: 13.10, changePercent: 1.06, sector: 'Banking' }
            ],
            topLosers: [
                { symbol: 'INFY', price: 2450.35, change: 19.35, changePercent: 0.80, sector: 'IT Services' },
                { symbol: 'HINDUNILVR', price: 2086.71, change: -38.90, changePercent: -1.88, sector: 'FMCG' },
                { symbol: 'ICICIBANK', price: 2225.95, change: 31.45, changePercent: 1.43, sector: 'Banking' }
            ]
        };

        res.json({
            success: true,
            data: marketData
        });
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market data'
        });
    }
});

module.exports = router;
