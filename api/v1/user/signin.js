import { connectDB, User } from '../../../backend/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const signinSchema = z.object({
    username: z.string().email(),
    password: z.string()
});

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        console.log(' Signin attempt:', req.body);
        
        await connectDB();
        
        const validation = signinSchema.safeParse(req.body);
        if (!validation.success) {
            console.log(' Validation failed:', validation.error);
            return res.status(400).json({
                success: false,
                message: "Invalid inputs",
                errors: validation.error.issues
            });
        }

        const { username, password } = validation.data;
        const user = await User.findOne({ username });
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            console.log(' Invalid credentials for:', username);
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign({
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username
        }, process.env.JWT_SECRET);
        
        console.log(' Signin successful for:', username);
        
        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username
            }
        });
        
    } catch (error) {
        console.error(' Signin error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
