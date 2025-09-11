import { connectDB, Notification } from '../../backend/db.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!['GET', 'PUT'].includes(req.method)) {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        await connectDB();
        
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        if (req.method === 'GET') {
            // Fetch notifications for the user
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .limit(50);

            return res.json({
                success: true,
                notifications
            });
        }

        if (req.method === 'PUT') {
            // Check if this is a read-all request
            const { action } = req.query;
            
            if (action === 'read-all') {
                // Mark all notifications as read
                await Notification.updateMany(
                    { userId, read: false },
                    { $set: { read: true } }
                );

                return res.json({
                    success: true,
                    message: "All notifications marked as read"
                });
            }

            return res.status(400).json({
                success: false,
                message: "Invalid action"
            });
        }
        
    } catch (error) {
        console.error('Notifications error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
