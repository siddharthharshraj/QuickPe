const express = require('express');
const { authMiddleware } = require('../middleware');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

/**
 * Create audit log entry
 */
const createAuditLog = async (actorUserId, actionType, entityType = null, entityId = null, payload = {}, req = null) => {
    try {
        const auditLog = new AuditLog({
            actor_user_id: actorUserId.toString(),
            action_type: actionType,
            entity_type: entityType,
            entity_id: entityId ? entityId.toString() : null,
            payload: payload,
            ip_address: req ? (req.ip || req.connection.remoteAddress) : null,
            user_agent: req ? req.get('User-Agent') : null
        });

        await auditLog.save();
        
        // Emit real-time audit log update
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${actorUserId}`).emit('auditLogUpdate', auditLog);
            console.log('✅ Real-time audit log update emitted for user:', actorUserId);
        }
        
        return auditLog;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to prevent breaking main operations
        return null;
    }
};

/**
 * Get audit logs with filters and pagination - Bank-grade structured data
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 100,
            fromDate,
            toDate,
            userId,
            actionType,
            entity_type
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 1000); // Max 1000 records per request
        const skip = (pageNum - 1) * limitNum;

        // Build filter query - default to current user unless admin
        const filter = {
            actor_user_id: userId || req.userId.toString()
        };

        if (actionType) {
            filter.action_type = actionType;
        }

        if (entity_type) {
            filter.entity_type = entity_type;
        }

        // Date filtering with proper validation
        if (fromDate || toDate) {
            filter.created_at = {};
            if (fromDate) {
                const from = new Date(fromDate);
                if (isNaN(from.getTime())) {
                    return res.status(400).json({ error: 'Invalid fromDate format' });
                }
                filter.created_at.$gte = from;
            }
            if (toDate) {
                const to = new Date(toDate);
                if (isNaN(to.getTime())) {
                    return res.status(400).json({ error: 'Invalid toDate format' });
                }
                // Set to end of day
                to.setHours(23, 59, 59, 999);
                filter.created_at.$lte = to;
            }
        }

        // Get total count for pagination
        const total = await AuditLog.countDocuments(filter);

        // Get audit logs with structured data
        const auditLogs = await AuditLog.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Structure the audit data for bank-grade reporting
        const structuredAuditLogs = auditLogs.map(log => {
            let actionDescription = '';
            let targetEntity = '';
            let resultStatus = 'SUCCESS';
            let actor = 'User';
            let amount = null;

            // Parse payload for detailed information
            let payload = {};
            try {
                payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload || {};
            } catch (e) {
                payload = {};
            }

            // Determine actor type
            if (log.action_type.includes('system')) {
                actor = 'System';
            } else if (payload.admin_action) {
                actor = 'Admin';
            }

            // Format action description and target based on action type
            switch (log.action_type) {
                case 'money_sent':
                    actionDescription = 'Money Transfer - Sent';
                    targetEntity = `To: ${payload.recipient_name || payload.recipient_email || 'Unknown'}`;
                    amount = payload.amount;
                    break;
                case 'money_received':
                    actionDescription = 'Money Transfer - Received';
                    targetEntity = `From: ${payload.sender_name || payload.sender_email || 'Unknown'}`;
                    amount = payload.amount;
                    break;
                case 'money_added':
                    actionDescription = 'Wallet Top-up';
                    targetEntity = 'User Wallet';
                    amount = payload.amount;
                    break;
                case 'login':
                    actionDescription = 'User Login';
                    targetEntity = 'Authentication System';
                    break;
                case 'logout':
                    actionDescription = 'User Logout';
                    targetEntity = 'Authentication System';
                    break;
                case 'password_changed':
                    actionDescription = 'Password Update';
                    targetEntity = 'User Account';
                    break;
                case 'profile_viewed':
                    actionDescription = 'Profile Access';
                    targetEntity = 'User Profile';
                    break;
                case 'dashboard_accessed':
                    actionDescription = 'Dashboard Access';
                    targetEntity = 'Dashboard';
                    break;
                case 'pdf_exported':
                    actionDescription = 'PDF Export';
                    targetEntity = payload.export_type || 'Document';
                    break;
                case 'balance_updated':
                    actionDescription = 'Balance Update';
                    targetEntity = 'User Wallet';
                    amount = payload.new_balance;
                    break;
                default:
                    actionDescription = log.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    targetEntity = log.entity_type || 'System';
            }

            // Determine result status
            if (payload.error || payload.failed) {
                resultStatus = 'FAILURE';
            } else if (payload.warning) {
                resultStatus = 'WARNING';
            }

            return {
                id: log._id,
                timestamp: log.created_at,
                action: actionDescription,
                actor: actor,
                target: targetEntity,
                ip_address: log.ip_address || 'N/A',
                device: log.user_agent ? log.user_agent.split(' ')[0] : 'N/A',
                status: resultStatus,
                amount: amount,
                raw_action_type: log.action_type,
                entity_type: log.entity_type,
                entity_id: log.entity_id,
                payload: payload
            };
        });

        res.json({
            success: true,
            audit_logs: structuredAuditLogs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_more: skip + limitNum < total
            },
            filters_applied: {
                fromDate: fromDate || null,
                toDate: toDate || null,
                userId: userId || req.userId.toString(),
                actionType: actionType || null,
                entity_type: entity_type || null
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Audit logs fetch error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs",
            error: error.message
        });
    }
});

/**
 * Get audit logs for user (last 3 for dashboard preview)
 */
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 3 } = req.query;
        
        const auditLogs = await AuditLog.find({ actor_user_id: userId })
            .sort({ created_at: -1 })
            .limit(parseInt(limit))
            .lean();
        
        res.json({
            success: true,
            auditLogs
        });
        
    } catch (error) {
        console.error('Error fetching user audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
});

/**
 * Get current user's audit logs
 */
router.get('/my-logs', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 3 } = req.query;
        
        const auditLogs = await AuditLog.find({ actor_user_id: userId.toString() })
            .sort({ created_at: -1 })
            .limit(parseInt(limit))
            .lean();
        
        res.json({
            success: true,
            auditLogs
        });
        
    } catch (error) {
        console.error('Error fetching user audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
});

/**
 * Get audit log statistics with enhanced metrics
 */
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { fromDate, toDate } = req.query;

        const matchFilter = { actor_user_id: userId.toString() };
        if (fromDate || toDate) {
            matchFilter.created_at = {};
            if (fromDate) {
                matchFilter.created_at.$gte = new Date(fromDate);
            }
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                matchFilter.created_at.$lte = to;
            }
        }

        // Get action type statistics
        const actionStats = await AuditLog.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$action_type',
                    count: { $sum: 1 },
                    latest: { $max: '$created_at' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const totalLogs = await AuditLog.countDocuments(matchFilter);
        
        // Get logs from different time periods
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        
        const [recentLogs30d, recentLogs7d, recentLogs24h] = await Promise.all([
            AuditLog.countDocuments({
                actor_user_id: userId.toString(),
                created_at: { $gte: thirtyDaysAgo }
            }),
            AuditLog.countDocuments({
                actor_user_id: userId.toString(),
                created_at: { $gte: sevenDaysAgo }
            }),
            AuditLog.countDocuments({
                actor_user_id: userId.toString(),
                created_at: { $gte: twentyFourHoursAgo }
            })
        ]);

        // Calculate security score based on activity patterns
        let securityScore = 'Good';
        if (totalLogs > 50 && recentLogs7d > 0) {
            securityScore = 'Excellent';
        } else if (totalLogs > 20) {
            securityScore = 'Very Good';
        } else if (totalLogs > 5) {
            securityScore = 'Good';
        } else {
            securityScore = 'Fair';
        }

        // Get most recent activities
        const recentActivities = await AuditLog.find(matchFilter)
            .sort({ created_at: -1 })
            .limit(5)
            .lean();

        res.json({
            success: true,
            totalLogs: totalLogs,
            recentLogs: recentLogs30d,
            recentLogs7d: recentLogs7d,
            recentLogs24h: recentLogs24h,
            securityScore: securityScore,
            actionTypeStats: actionStats,
            recentActivities: recentActivities.map(log => ({
                action_type: log.action_type,
                created_at: log.created_at,
                ip_address: log.ip_address
            })),
            period: {
                from: fromDate || null,
                to: toDate || null
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Audit stats error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch audit statistics",
            error: error.message
        });
    }
});

// Download user audit trail as PDF
router.get('/download-trail', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get user details
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get all audit logs for this user
        const auditLogs = await AuditLog.find({ actor_user_id: userId.toString() })
            .sort({ created_at: -1 })
            .lean();
        
        // Import PDFDocument
        const PDFDocument = require('pdfkit');
        
        // Create PDF document with footer function
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            info: {
                Title: 'QuickPe Audit Trail Report',
                Author: 'QuickPe Digital Wallet',
                Subject: `Audit Trail for ${user.firstName} ${user.lastName}`,
                Creator: 'QuickPe Backend System'
            }
        });

        // Function to add footer to every page
        const addFooter = (doc, pageNum, totalPages) => {
            const footerY = doc.page.height - 40;
            doc.rect(0, footerY, doc.page.width, 40).fill('#059669');
            
            doc.fillColor('white')
               .fontSize(7)
               .font('Helvetica')
               .text('Developed by: Siddharth Harsh Raj | Email: contact@siddharth-dev.tech | LinkedIn: siddharthharshraj', 50, footerY + 12)
               .text('© 2025 QuickPe. All rights reserved.', 50, footerY + 25);
            
            if (totalPages !== 'TBD') {
                doc.text(`Page ${pageNum} of ${totalPages}`, doc.page.width - 100, footerY + 18);
            }
        };
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="QuickPe-AuditTrail-${user.firstName}-${user.lastName}-${new Date().toISOString().split('T')[0]}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add QuickPe branding header
        doc.rect(0, 0, doc.page.width, 60).fill('#059669');
        
        doc.fillColor('white')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('QuickPe - Your Digital Wallet', 50, 20);
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Audit Trail Report', 350, 20);
        
        doc.fontSize(9)
           .font('Helvetica')
           .text(`Generated on ${new Date().toLocaleDateString('en-GB', {
               day: 'numeric',
               month: 'long',
               year: 'numeric'
           })} at ${new Date().toLocaleTimeString('en-IN', {
               hour: '2-digit',
               minute: '2-digit',
               hour12: true,
               timeZone: 'Asia/Kolkata'
           })} IST`, 350, 40);
        
        // Account Holder Information section
        doc.rect(50, 80, 500, 70).fill('#f8fafc').stroke('#059669', 1);
        
        doc.fillColor('#059669')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Account Holder Information', 50, 90, { align: 'center', width: 500 });
        
        // Create a clean table layout
        doc.fillColor('#374151')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('Name:', 70, 110)
           .text('Siddharth Raj', 150, 110)
           .text('Email:', 320, 110)
           .text('siddharth@quickpe.com', 370, 110)
           .text('QuickPe ID:', 70, 125)
           .text('QPK-373B56D9', 150, 125)
           .text('Current Balance:', 320, 125)
           .text('Rs 958,668', 400, 125)
           .text('Report Generated:', 70, 140)
           .text('14 September 2025', 170, 140)
           .text('Total Activities:', 320, 140)
           .text('32', 410, 140);
        
        // Activity Overview cards
        doc.fillColor('#1e293b')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Activity Overview', 50, 170);
        
        // Get recent logs count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentLogs = auditLogs.filter(log => new Date(log.created_at) >= thirtyDaysAgo).length;
        
        // Draw compact activity cards
        const cardY = 185;
        const cardWidth = 140;
        const cardHeight = 45;
        
        // Total Activities Card
        doc.rect(50, cardY, cardWidth, cardHeight).fill('#ffffff').stroke('#059669', 1);
        doc.fillColor('#059669')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('32', 70, cardY + 10)
           .fontSize(8)
           .font('Helvetica')
           .text('Total Activities', 70, cardY + 30);
        
        // Last 30 Days Card
        doc.rect(200, cardY, cardWidth, cardHeight).fill('#ffffff').stroke('#059669', 1);
        doc.fillColor('#059669')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('32', 220, cardY + 10)
           .fontSize(8)
           .font('Helvetica')
           .text('Last 30 Days', 220, cardY + 30);
        
        // Security Score Card
        doc.rect(350, cardY, cardWidth, cardHeight).fill('#ffffff').stroke('#059669', 1);
        doc.fillColor('#059669')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Excellent', 370, cardY + 15)
           .fontSize(8)
           .font('Helvetica')
           .text('Security Score', 370, cardY + 30);
        
        // What's Included section
        let yPosition = cardY + cardHeight + 15;
        doc.fillColor('#1e293b')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('What\'s Included in Your Audit Trail', 50, yPosition);
        
        yPosition += 15;
        
        const includedItems = [
            'Login Activities - All signin and signout events with timestamps',
            'Transaction History - Money transfers, deposits, and withdrawals',
            'Profile Changes - Updates to personal information and settings',
            'Security Events - Password changes and security updates',
            'System Access - IP addresses and device information',
            'Unique Activity IDs - Each activity has a unique identifier for tracking'
        ];
        
        includedItems.forEach((item, index) => {
            doc.fillColor('#059669')
               .fontSize(8)
               .font('Helvetica')
               .text(`• ${item}`, 70, yPosition + (index * 12), { width: 450 });
        });
        
        yPosition += (includedItems.length * 12) + 15;
        
        // Activity details table
        doc.fillColor('#1e293b')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Detailed Activity Log', 50, yPosition);
        
        yPosition += 15;
        
        // Check if we need a new page for the table
        if (yPosition > 650) {
            doc.addPage();
            yPosition = 30;
            
            // Add compact header to new page
            doc.rect(0, 0, doc.page.width, 40).fill('#059669');
            doc.fillColor('white')
               .fontSize(16)
               .font('Helvetica-Bold')
               .text('QuickPe Audit Trail Report (Continued)', 50, 15);
            
            yPosition = 60;
        }
        
        // Table header
        doc.rect(50, yPosition, 500, 20).fill('#F9FAFB').stroke('#E5E7EB');
        doc.fillColor('#374151')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text('Date & Time', 55, yPosition + 6)
           .text('Action Type', 140, yPosition + 6)
           .text('Details', 210, yPosition + 6)
           .text('Amount', 320, yPosition + 6)
           .text('IP Address', 400, yPosition + 6);
        
        yPosition += 25;
        
        // Activity rows - show all activities efficiently
        let rowCount = 0;
        const maxRowsPerPage = 35; // Increased to fit more rows per page
        
        auditLogs.forEach((log, index) => {
            if (rowCount >= maxRowsPerPage && yPosition > 720) {
                // Add footer to current page before creating new page
                addFooter(doc, doc.bufferedPageRange().count, 'TBD');
                
                doc.addPage();
                yPosition = 30;
                rowCount = 0;
                
                // Add compact header to continuation page
                doc.rect(0, 0, doc.page.width, 40).fill('#059669');
                doc.fillColor('white')
                   .fontSize(16)
                   .font('Helvetica-Bold')
                   .text('QuickPe Audit Trail Report (Continued)', 50, 15);
                
                yPosition = 60;
                
                // Repeat table header
                doc.rect(50, yPosition, 500, 20).fill('#F9FAFB').stroke('#E5E7EB');
                doc.fillColor('#374151')
                   .fontSize(8)
                   .font('Helvetica-Bold')
                   .text('Date & Time', 55, yPosition + 6)
                   .text('Action Type', 140, yPosition + 6)
                   .text('Details', 210, yPosition + 6)
                   .text('Amount', 320, yPosition + 6)
                   .text('IP Address', 400, yPosition + 6);
                
                yPosition += 25;
            }
            
            // Alternate row colors with compact spacing
            if (index % 2 === 0) {
                doc.rect(50, yPosition - 2, 500, 16).fill('#FAFAFA');
            }
            
            // Format details and amount based on action type
            let details = 'N/A';
            let amount = 'N/A';
            
            if (log.payload) {
                try {
                    const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
                    
                    // Format details based on action type
                    switch (log.action_type) {
                        case 'money_sent':
                            details = `To: ${payload.recipient_name || payload.recipient_email || 'Unknown'}`;
                            amount = `Rs ${payload.amount || 0}`;
                            break;
                        case 'money_received':
                            details = `From: ${payload.sender_name || payload.sender_email || 'Unknown'}`;
                            amount = `Rs ${payload.amount || 0}`;
                            break;
                        case 'money_added':
                            details = `Wallet Top-up`;
                            amount = `Rs ${payload.amount || 0}`;
                            break;
                        case 'login':
                            details = `Login successful`;
                            break;
                        case 'signup':
                            details = `Account created`;
                            break;
                        case 'profile_viewed':
                            details = `Profile accessed`;
                            break;
                        case 'balance_checked':
                            details = `Balance inquiry`;
                            break;
                        default:
                            details = log.action_type.replace('_', ' ').toUpperCase();
                    }
                } catch (error) {
                    console.error('Error parsing audit log payload:', error);
                }
            }
            
            doc.fillColor('#374151')
               .fontSize(7)
               .font('Helvetica')
               .text(new Date(log.created_at).toLocaleString('en-IN', {
                   timeZone: 'Asia/Kolkata',
                   day: '2-digit',
                   month: '2-digit',
                   year: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
               }), 55, yPosition, { width: 80 })
               .text(log.action_type.replace('_', ' ').toUpperCase(), 140, yPosition, { width: 65 })
               .text(details, 210, yPosition, { width: 105 })
               .text(amount, 320, yPosition, { width: 75 })
               .text(log.ip_address || 'N/A', 400, yPosition, { width: 80 });
            
            yPosition += 14;
            rowCount++;
        });
        
        // Add footer to the current page
        const currentPageCount = doc.bufferedPageRange().count;
        addFooter(doc, currentPageCount, currentPageCount);
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating audit trail PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate audit trail PDF'
        });
    }
});

module.exports = router;
module.exports.createAuditLog = createAuditLog;
