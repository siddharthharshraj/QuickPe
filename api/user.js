const { connectDB, User } = require('../backend/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const authMiddleware = require('./middleware/auth');
const { generalLimit } = require('./middleware/security');


const updateSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    username: z.string().email().optional()
});

export default async function handler(req, res) {
    // Apply rate limiting
    await new Promise((resolve, reject) => {
        generalLimit(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            resolve(result);
        });
    });

    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://quickpe.siddharth-dev.tech');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();
        
        if (req.method === 'GET' && req.url.includes('/profile')) {
            await new Promise((resolve, reject) => {
                authMiddleware(req, res, (result) => {
                    if (result instanceof Error) {
                        return reject(result);
                    }
                    resolve(result);
                });
            });
            
            const user = await User.findById(req.userId, 'firstName lastName username _id');
            
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    message: "User not found" 
                });
            }

            return res.json({ 
                success: true,
                user 
            });
        }
        
        if (req.method === 'PUT' && req.url.includes('/profile')) {
            await new Promise((resolve, reject) => {
                authMiddleware(req, res, (result) => {
                    if (result instanceof Error) {
                        return reject(result);
                    }
                    resolve(result);
                });
            });
            
            const { firstName, lastName, username } = req.body;

            if (!firstName || !lastName || !username) {
                return res.status(400).json({ 
                    success: false,
                    message: "All fields are required" 
                });
            }

            const existingUser = await User.findOne({
                username: username,
                _id: { $ne: req.userId }
            });

            if (existingUser) {
                return res.status(409).json({ 
                    success: false,
                    message: "Email is already taken by another user" 
                });
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.userId,
                { firstName, lastName, username },
                { new: true, select: 'firstName lastName username _id' }
            );

            if (!updatedUser) {
                return res.status(404).json({ 
                    success: false,
                    message: "User not found" 
                });
            }

            return res.json({
                success: true,
                message: "Profile updated successfully",
                user: updatedUser
            });
        }
        
        if (req.method === 'PUT' && req.url.includes('/change-password')) {
            await new Promise((resolve, reject) => {
                authMiddleware(req, res, (result) => {
                    if (result instanceof Error) {
                        return reject(result);
                    }
                    resolve(result);
                });
            });
            
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    message: "New password must be at least 6 characters long" 
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await User.findByIdAndUpdate(req.userId, { password: hashedPassword });

            return res.json({ 
                success: true,
                message: "Password changed successfully" 
            });
        }
        
        if (req.method === 'GET' && req.url.includes('/bulk')) {
            await new Promise((resolve, reject) => {
                authMiddleware(req, res, (result) => {
                    if (result instanceof Error) {
                        return reject(result);
                    }
                    resolve(result);
                });
            });
            
            const filter = req.query.filter || "";

            let query = { _id: { $ne: req.userId } };
            
            if (filter) {
                query.$or = [
                    { firstName: { $regex: filter, $options: 'i' } },
                    { lastName: { $regex: filter, $options: 'i' } },
                    { username: { $regex: filter, $options: 'i' } }
                ];
            }

            const users = await User.find(query, 'username firstName lastName _id')
                .limit(50)
                .sort({ firstName: 1 });

            return res.json({
                success: true,
                users: users.map(user => ({
                    _id: user._id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName
                }))
            });
        }

        return res.status(404).json({ 
            success: false,
            message: "Route not found" 
        });
        
    } catch (error) {
        console.error('User error:', error);
        
        if (error.message === 'Too Many Requests') {
            return res.status(429).json({
                success: false,
                message: "Too many requests, please try again later"
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
