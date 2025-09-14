import express from 'express';
import { authMiddleware } from '../middleware/index.js';
// Remove Transaction import since it's causing issues
// import Transaction from '../models/Transaction.js';
// Remove User import since it's causing issues
// import { User as UserModel } from '../models/User.js';

const router = express.Router();

// Mock notifications for Railway deployment (simplified)
const mockNotifications = [];

// Generate notifications from recent transactions - disabled for now
const generateNotificationsFromTransactions = async (userId) => {
    try {
        // Return empty array since Transaction import is causing issues
        return [];
    } catch (error) {
        console.error('Error generating notifications from transactions:', error);
        return [];
    }
};

// Export function to add notifications
export const addNotification = (notification) => {
    mockNotifications.push(notification);
};

// Mark all notifications as read for a user
router.post('/mark-all-read', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId.toString();
        
        // Mark all notifications as read for this user
        mockNotifications.forEach(notification => {
            if (notification.userId === userId) {
                notification.read = true;
            }
        });
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read'
        });
    }
});

// Get notifications for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Get mock notifications
        const mockNotifs = mockNotifications.filter(n => n.userId === req.userId.toString());
        
        // Generate notifications from recent transactions
        const transactionNotifs = await generateNotificationsFromTransactions(req.userId);
        
        // Combine and sort all notifications
        const allNotifications = [...mockNotifs, ...transactionNotifs];
        const sortedNotifications = allNotifications.sort((a, b) => 
            new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
        );
        
        res.json({
            notifications: sortedNotifications.slice(0, 20) // Limit to 20 most recent
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
            if (notification.userId === req.userId.toString()) {
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
