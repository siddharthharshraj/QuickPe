import express from 'express';
import { authMiddleware } from '../middleware/index.js';

const router = express.Router();

// Mock notifications for Railway deployment (simplified)
const mockNotifications = [];

// Get notifications for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Return mock notifications for now
        const notifications = mockNotifications.filter(n => n.userId === req.userId);
        
        res.json({
            notifications: notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error('Notification fetch error:', error);
        res.status(500).json({
            message: "Failed to fetch notifications"
        });
    }
});

// Mark notifications as read
router.put('/mark-read', authMiddleware, async (req, res) => {
    try {
        // Mark all notifications as read for the user
        mockNotifications.forEach(notification => {
            if (notification.userId === req.userId) {
                notification.read = true;
            }
        });

        res.json({
            message: "Notifications marked as read"
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({
            message: "Failed to mark notifications as read"
        });
    }
});

// Create a notification (for testing)
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { message, type = 'info' } = req.body;
        
        const notification = {
            _id: Date.now().toString(),
            userId: req.userId,
            type,
            message,
            read: false,
            createdAt: new Date()
        };
        
        mockNotifications.push(notification);
        
        res.json({
            message: "Notification created",
            notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            message: "Failed to create notification"
        });
    }
});

export default router;
