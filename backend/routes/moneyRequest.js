const express = require('express');
const mongoose = require('mongoose');
const MoneyRequest = require('../models/MoneyRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { authMiddleware } = require('../middleware/index');
const analyticsService = require('../services/AnalyticsService');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/v1/money-requests/create
 * Create a new money request
 */
router.post('/create', async (req, res) => {
    try {
        const { toQuickpeId, amount, description } = req.body;
        const requesterId = req.userId;
        
        // Validation
        if (!toQuickpeId) {
            return res.status(400).json({
                success: false,
                message: "Recipient QuickPe ID is required",
                code: "QUICKPE_ID_REQUIRED"
            });
        }
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required",
                code: "INVALID_AMOUNT"
            });
        }
        
        if (amount > 80000) {
            return res.status(400).json({
                success: false,
                message: "Maximum request amount is ₹80,000",
                code: "AMOUNT_EXCEEDS_MAX",
                maxAmount: 80000
            });
        }
        
        // Get requester and requestee
        const requester = await User.findById(requesterId);
        const requestee = await User.findOne({ quickpeId: toQuickpeId });
        
        if (!requester) {
            return res.status(404).json({
                success: false,
                message: "Requester not found",
                code: "REQUESTER_NOT_FOUND"
            });
        }
        
        if (!requestee) {
            return res.status(404).json({
                success: false,
                message: "Recipient not found. Please check QuickPe ID.",
                code: "REQUESTEE_NOT_FOUND"
            });
        }
        
        // Cannot request from yourself
        if (requester._id.toString() === requestee._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Cannot request money from yourself",
                code: "SELF_REQUEST_NOT_ALLOWED"
            });
        }
        
        // Check if requestee is active
        if (!requestee.isActive) {
            return res.status(403).json({
                success: false,
                message: "Recipient account is deactivated",
                code: "REQUESTEE_INACTIVE"
            });
        }
        
        // Check daily limit (₹80,000 per person per day)
        const limitCheck = await MoneyRequest.checkDailyLimit(
            requesterId,
            requestee._id,
            amount
        );
        
        if (!limitCheck.allowed) {
            return res.status(400).json({
                success: false,
                message: `Daily request limit of ₹80,000 to this person would be exceeded`,
                code: "DAILY_REQUEST_LIMIT_EXCEEDED",
                dailyLimit: limitCheck.limit,
                usedToday: limitCheck.currentTotal,
                remaining: limitCheck.remaining,
                requestedAmount: amount
            });
        }
        
        // Create money request
        const moneyRequest = new MoneyRequest({
            requesterId: requester._id,
            requesterName: `${requester.firstName} ${requester.lastName}`,
            requesterQuickpeId: requester.quickpeId,
            requesteeId: requestee._id,
            requesteeName: `${requestee.firstName} ${requestee.lastName}`,
            requesteeQuickpeId: requestee.quickpeId,
            amount,
            description: description || `Money request from ${requester.firstName}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        
        await moneyRequest.save();
        
        // Create notification for requestee (User B)
        const notification = new Notification({
            userId: requestee._id,
            type: 'MONEY_REQUEST_RECEIVED',
            title: 'Money Request Received',
            message: `${requester.firstName} ${requester.lastName} requested ₹${amount.toLocaleString()}`,
            data: {
                requestId: moneyRequest._id,
                requesterId: requester._id,
                requesterName: `${requester.firstName} ${requester.lastName}`,
                amount,
                description
            },
            isRead: false
        });
        
        await notification.save();
        
        // Create audit log
        try {
            const auditLog = new AuditLog({
                userId: requesterId.toString(),
                action: 'MONEY_REQUEST_CREATED',
                details: {
                    requestId: moneyRequest.requestId,
                    to: requestee.quickpeId,
                    toName: `${requestee.firstName} ${requestee.lastName}`,
                    amount,
                    description,
                    timestamp: new Date()
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
            await auditLog.save();
        } catch (auditError) {
            console.error('Audit log failed:', auditError.message);
        }
        
        // Emit real-time event to requestee
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${requestee._id}`).emit('money-request:new', {
                request: moneyRequest,
                notification
            });
        }
        
        res.status(201).json({
            success: true,
            message: "Money request sent successfully",
            data: {
                request: moneyRequest,
                expiresIn: '24 hours'
            }
        });
        
    } catch (error) {
        console.error('Create money request error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to create money request",
            error: error.message
        });
    }
});

/**
 * GET /api/v1/money-requests/received
 * Get money requests received by current user (User B)
 */
router.get('/received', async (req, res) => {
    try {
        console.log('📥 GET /received - User:', req.userId);
        const { status = 'pending', page = 1, limit = 10 } = req.query;
        console.log('📥 Query params:', { status, page, limit });
        
        const query = { requesteeId: req.userId };
        if (status !== 'all') {
            query.status = status;
        }
        console.log('📥 MongoDB query:', query);
        
        const requests = await MoneyRequest.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();
        
        const total = await MoneyRequest.countDocuments(query);
        console.log('📥 Found requests:', requests.length, 'Total:', total);
        
        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get received requests error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch requests"
        });
    }
});

/**
 * GET /api/v1/money-requests/sent
 * Get money requests sent by current user (User A)
 */
router.get('/sent', async (req, res) => {
    try {
        console.log('📤 GET /sent - User:', req.userId);
        const { status = 'all', page = 1, limit = 10 } = req.query;
        console.log('📤 Query params:', { status, page, limit });
        
        const query = { requesterId: req.userId };
        if (status !== 'all') {
            query.status = status;
        }
        console.log('📤 MongoDB query:', query);
        
        const requests = await MoneyRequest.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();
        
        const total = await MoneyRequest.countDocuments(query);
        console.log('📤 Found requests:', requests.length, 'Total:', total);
        
        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get sent requests error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch requests"
        });
    }
});

/**
 * POST /api/v1/money-requests/:requestId/approve
 * Approve a money request and transfer money
 */
router.post('/:requestId/approve', async (req, res) => {
    try {
        const { requestId } = req.params;
        const requesteeId = req.userId;
        
        // Get money request
        const moneyRequest = await MoneyRequest.findById(requestId);
        
        if (!moneyRequest) {
            console.log('❌ Money request not found');
            return res.status(404).json({
                success: false,
                message: "Money request not found"
            });
        }
        
        console.log('📋 Request details:', {
            from: moneyRequest.requesterName,
            to: moneyRequest.requesteeName,
            amount: moneyRequest.amount,
            status: moneyRequest.status
        });
        
        // Verify requestee
        if (moneyRequest.requesteeId.toString() !== requesteeId.toString()) {
            console.log('❌ Unauthorized - wrong user');
            return res.status(403).json({
                success: false,
                message: "Unauthorized to approve this request"
            });
        }
        
        // Check if can respond
        if (!moneyRequest.canRespond()) {
            console.log('❌ Cannot respond - expired or already responded');
            return res.status(400).json({
                success: false,
                message: moneyRequest.isExpired() ? "Request has expired" : "Request already responded to",
                code: moneyRequest.isExpired() ? "REQUEST_EXPIRED" : "ALREADY_RESPONDED"
            });
        }
        
        // Get users
        const requestee = await User.findById(requesteeId);
        const requester = await User.findById(moneyRequest.requesterId);
        
        console.log('👤 Requestee balance:', requestee.balance);
        console.log('💰 Amount to transfer:', moneyRequest.amount);
        
        // Check balance
        if (requestee.balance < moneyRequest.amount) {
            console.log('❌ Insufficient balance');
            return res.status(400).json({
                success: false,
                message: "Insufficient balance to approve request"
            });
        }
        
        console.log('💸 Starting money transfer...');
        
        // Transfer money (atomic operations)
        const updatedRequestee = await User.findByIdAndUpdate(
            requesteeId,
            { $inc: { balance: -moneyRequest.amount } },
            { new: true }
        );
        
        const updatedRequester = await User.findByIdAndUpdate(
            moneyRequest.requesterId,
            { $inc: { balance: moneyRequest.amount } },
            { new: true }
        );
        
        console.log('✅ Balances updated');
        console.log('   Requestee new balance:', updatedRequestee.balance);
        console.log('   Requester new balance:', updatedRequester.balance);
        
        // Create transactions
        console.log('📝 Creating transaction records...');
        
        const debitTransaction = new Transaction({
            userId: requesteeId,
            type: 'debit',
            amount: moneyRequest.amount,
            description: `Money sent to ${moneyRequest.requesterName} (Request approved)`,
            category: 'Transfer',
            status: 'completed',
            balance: updatedRequestee.balance,
            recipient: moneyRequest.requesterName,
            toUserId: moneyRequest.requesterId
        });
        await debitTransaction.save();
        console.log('✅ Debit transaction created:', debitTransaction._id);
        
        const creditTransaction = new Transaction({
            userId: moneyRequest.requesterId,
            type: 'credit',
            amount: moneyRequest.amount,
            description: `Money received from ${moneyRequest.requesteeName} (Request approved)`,
            category: 'Transfer',
            status: 'completed',
            balance: updatedRequester.balance,
            sender: moneyRequest.requesteeName,
            fromUserId: requesteeId
        });
        await creditTransaction.save();
        console.log('✅ Credit transaction created:', creditTransaction._id);
        
        // Update money request
        await moneyRequest.approve(debitTransaction._id);
        await moneyRequest.save();
        console.log('✅ Money request marked as approved');
        
        // Create notifications
        console.log('🔔 Creating notifications...');
        
        const requesteeNotification = new Notification({
            userId: requesteeId,
            type: 'MONEY_REQUEST_APPROVED',
            title: 'Request Approved',
            message: `You sent ₹${moneyRequest.amount.toLocaleString()} to ${moneyRequest.requesterName}`,
            isRead: false
        });
        await requesteeNotification.save();
        
        const requesterNotification = new Notification({
            userId: moneyRequest.requesterId,
            type: 'MONEY_REQUEST_APPROVED',
            title: 'Request Approved',
            message: `${moneyRequest.requesteeName} sent you ₹${moneyRequest.amount.toLocaleString()}`,
            isRead: false
        });
        await requesterNotification.save();
        console.log('✅ Notifications created');
        
        // Create audit log
        try {
            const auditLog = new AuditLog({
                userId: requesteeId,
                action: 'MONEY_REQUEST_APPROVED',
                category: 'money_request',
                details: {
                    requestId: moneyRequest._id,
                    amount: moneyRequest.amount,
                    requester: moneyRequest.requesterName,
                    requestee: moneyRequest.requesteeName,
                    transactionId: debitTransaction._id
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
            await auditLog.save();
            console.log('✅ Audit log created');
        } catch (auditError) {
            console.error('⚠️ Audit log failed:', auditError.message);
        }
        
        // Clear analytics cache for both users
        analyticsService.clearCache(requesteeId.toString());
        analyticsService.clearCache(moneyRequest.requesterId.toString());
        
        // Emit real-time events
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${requesteeId}`).emit('transaction:new', {
                transaction: debitTransaction,
                balance: updatedRequestee.balance
            });
            
            io.to(`user_${moneyRequest.requesterId}`).emit('transaction:new', {
                transaction: creditTransaction,
                balance: updatedRequester.balance
            });
            
            io.to(`user_${moneyRequest.requesterId}`).emit('money-request:approved', {
                request: moneyRequest
            });
        }
        
        res.json({
            success: true,
            message: "Money request approved successfully",
            data: {
                request: moneyRequest,
                transaction: debitTransaction,
                newBalance: updatedRequestee.balance
            }
        });
        
    } catch (error) {
        console.error('❌ Approve request error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to approve request",
            error: error.message
        });
    }
});

/**
 * POST /api/v1/money-requests/:requestId/reject
 * Reject a money request
 */
router.post('/:requestId/reject', async (req, res) => {
    try {
        console.log('❌ POST /reject - Request ID:', req.params.requestId);
        const { requestId } = req.params;
        const { reason } = req.body;
        const requesteeId = req.userId;
        
        const moneyRequest = await MoneyRequest.findById(requestId);
        
        if (!moneyRequest) {
            console.log('❌ Money request not found');
            return res.status(404).json({
                success: false,
                message: "Money request not found"
            });
        }
        
        console.log('📋 Rejecting request from:', moneyRequest.requesterName, 'Amount:', moneyRequest.amount);
        console.log('📝 Reason:', reason || 'No reason provided');
        
        if (moneyRequest.requesteeId.toString() !== requesteeId.toString()) {
            console.log('❌ Unauthorized - wrong user');
            return res.status(403).json({
                success: false,
                message: "Unauthorized to reject this request"
            });
        }
        
        if (!moneyRequest.canRespond()) {
            console.log('❌ Cannot respond - expired or already responded');
            return res.status(400).json({
                success: false,
                message: "Request cannot be rejected"
            });
        }
        
        await moneyRequest.reject(reason || 'No reason provided');
        console.log('✅ Money request marked as rejected');
        
        // Create audit log
        try {
            const auditLog = new AuditLog({
                userId: requesteeId,
                action: 'MONEY_REQUEST_REJECTED',
                category: 'money_request',
                details: {
                    requestId: moneyRequest._id,
                    amount: moneyRequest.amount,
                    requester: moneyRequest.requesterName,
                    requestee: moneyRequest.requesteeName,
                    reason: reason || 'No reason provided'
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
            await auditLog.save();
            console.log('✅ Audit log created');
        } catch (auditError) {
            console.error('⚠️ Audit log failed:', auditError.message);
        }
        
        // Notify requester
        const notification = new Notification({
            userId: moneyRequest.requesterId,
            type: 'MONEY_REQUEST_REJECTED',
            title: 'Request Rejected',
            message: `${moneyRequest.requesteeName} rejected your request for ₹${moneyRequest.amount.toLocaleString()}`,
            isRead: false
        });
        await notification.save();
        console.log('✅ Notification sent to requester');
        
        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${moneyRequest.requesterId}`).emit('money-request:rejected', {
                request: moneyRequest
            });
        }
        
        res.json({
            success: true,
            message: "Money request rejected",
            data: { request: moneyRequest }
        });
        
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to reject request"
        });
    }
});

/**
 * POST /api/v1/money-requests/:requestId/cancel
 * Cancel a money request (by requester)
 */
router.post('/:requestId/cancel', async (req, res) => {
    try {
        const { requestId } = req.params;
        const requesterId = req.userId;
        
        const moneyRequest = await MoneyRequest.findById(requestId);
        
        if (!moneyRequest) {
            return res.status(404).json({
                success: false,
                message: "Money request not found"
            });
        }
        
        if (moneyRequest.requesterId.toString() !== requesterId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to cancel this request"
            });
        }
        
        if (moneyRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Only pending requests can be cancelled"
            });
        }
        
        await moneyRequest.cancel();
        
        res.json({
            success: true,
            message: "Money request cancelled",
            data: { request: moneyRequest }
        });
        
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel request"
        });
    }
});

module.exports = router;
