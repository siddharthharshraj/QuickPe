const express = require('express');
const { authMiddleware } = require('../middleware');
const Notification = require('../models/Notification');

const router = express.Router();

// Get all notifications for current user
router.get('/', authMiddleware, async (req, res) => {
    try {
        
        const notifications = await Notification.find({ 
            userId: req.userId 
        }).sort({ createdAt: -1 }).limit(50); // Limit to 50 most recent
        
        res.json(notifications);
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({ 
            message: 'Failed to fetch notifications',
            error: error.message 
        });
    }
});

// Get unread notifications count
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        console.log('🔢 Getting unread count for user:', req.userId);
        
        const count = await Notification.countDocuments({ 
            userId: req.userId, 
            read: false 
        });
        
        console.log('🔢 Unread count:', count);
        res.json({ count });
    } catch (error) {
        console.error('❌ Error getting unread count:', error);
        res.status(500).json({ 
            message: 'Failed to get unread count',
            error: error.message 
        });
    }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        
        const result = await Notification.updateMany(
            { userId: req.userId, read: false },
            { $set: { read: true } }
        );
        
        
        // Emit socket event to update UI
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${req.userId}`).emit('notifications:read-all');
        }
        
        res.json({ 
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount 
        });
    } catch (error) {
        console.error('❌ Error marking notifications as read:', error);
        res.status(500).json({ 
            message: 'Failed to update notifications',
            error: error.message 
        });
    }
});

// Mark specific notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notificationId = req.params.id;
        
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId: req.userId },
            { $set: { read: true } },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.json(notification);
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        res.status(500).json({ 
            message: 'Failed to update notification',
            error: error.message 
        });
    }
});

module.exports = router;
