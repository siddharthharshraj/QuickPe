const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/index');
const Notification = require('../models/Notification');

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
});

// Mark all notifications as read
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.userId,
            read: false
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count'
        });
    }
});

// Create test notification (for debugging)
router.post('/test', authMiddleware, async (req, res) => {
    try {
        const { type = 'TRANSFER_RECEIVED', title = 'Test Notification', message = 'This is a test notification', data = {} } = req.body;
        
        const notification = new Notification({
            userId: req.userId,
            type,
            title,
            message,
            data,
            read: false
        });
        
        await notification.save();
        
        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${req.userId}`).emit('notification:new', {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                timestamp: notification.createdAt,
                transactionId: notification.transactionId,
                read: false,
                type: notification.type,
                data: notification.data
            });
        }
        
        res.json({
            success: true,
            message: 'Test notification created',
            notification
        });
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create test notification'
        });
    }
});

module.exports = router;
