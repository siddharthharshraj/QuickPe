const { connectDB, User, Account } = require('../backend/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { authLimit } = require('./middleware/security');

const signupSchema = z.object({
    username: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string().min(6)
});

const signinSchema = z.object({
    username: z.string().email(),
    password: z.string()
});

export default async function handler(req, res) {
    // Apply rate limiting for auth endpoints
    await new Promise((resolve, reject) => {
        authLimit(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            resolve(result);
        });
    });

    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://quickpe.siddharth-dev.tech');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();
        
        if (req.method === 'POST' && req.url.includes('/signup')) {
            const validation = signupSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid inputs",
                    errors: validation.error.issues
                });
            }

            const { username, password, firstName, lastName } = validation.data;
            
            const existingUser = await User.findOne({ username });
            if (existingUser) {
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
        }
        
        if (req.method === 'POST' && req.url.includes('/signin')) {
            const validation = signinSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid inputs",
                    errors: validation.error.issues
                });
            }

            const { username, password } = validation.data;
            const user = await User.findOne({ username });
            
            if (!user || !await bcrypt.compare(password, user.password)) {
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
        }

        return res.status(404).json({ 
            success: false,
            message: "Route not found" 
        });
        
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
