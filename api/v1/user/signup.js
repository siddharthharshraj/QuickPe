import { connectDB, User, Account } from '../../../backend/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const signupSchema = z.object({
    username: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string().min(6)
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
        console.log('📝 Signup attempt:', req.body);
        
        await connectDB();
        
        const validation = signupSchema.safeParse(req.body);
        if (!validation.success) {
            console.log('❌ Validation failed:', validation.error);
            return res.status(400).json({
                success: false,
                message: "Invalid inputs",
                errors: validation.error.issues
            });
        }

        const { username, password, firstName, lastName } = validation.data;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('❌ User already exists:', username);
            return res.status(409).json({
                success: false,
                message: "Email already taken"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            username,
            password: hashedPassword,
            firstName,
            lastName
        });

        await Account.create({
            userId: user._id,
            balance: 1 + Math.random() * 10000
        });

        const token = jwt.sign({
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username
        }, process.env.JWT_SECRET);
        
        console.log('✅ Signup successful for:', username);
        
        return res.json({
            success: true,
            message: "User created successfully",
            token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username
            }
        });
        
    } catch (error) {
        console.error('❌ Signup error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
