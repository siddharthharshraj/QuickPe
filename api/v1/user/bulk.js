import { connectDB, User } from '../../../backend/db.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
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

        const filter = req.query.filter || "";

        const users = await User.find({
            $and: [
                { _id: { $ne: userId } }, // Exclude current user
                {
                    $or: [
                        { "firstName": { "$regex": filter, "$options": "i" } },
                        { "lastName": { "$regex": filter, "$options": "i" } },
                        { "username": { "$regex": filter, "$options": "i" } }
                    ]
                }
            ]
        }).select('_id firstName lastName username').limit(20);

        return res.json({
            success: true,
            users: users.map(user => ({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username
            }))
        });
        
    } catch (error) {
        console.error('User search error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
