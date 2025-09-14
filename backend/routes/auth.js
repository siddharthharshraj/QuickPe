const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/index');
const { createAuditLog } = require('./audit');

const router = express.Router();

// CORS configuration for auth routes
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
    "https://quickpe-frontend.vercel.app",
    process.env.FRONTEND_URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS to all auth routes
router.use(cors(corsOptions));

// Handle preflight requests explicitly
router.options('*', cors(corsOptions));

// Verify token endpoint
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        // If middleware passes, token is valid
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                name: user.name || `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                quickpeId: user.quickpeId,
                balance: user.balance,
                role: user.role,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during token verification'
        });
    }
});

// Get user profile endpoint
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                name: user.name || `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                quickpeId: user.quickpeId,
                balance: user.balance,
                role: user.role,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
});

// Signin endpoint with no-cache headers
router.post('/signin', async (req, res) => {
    // Set no-cache headers
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    try {
        const { email, password } = req.body;
        console.log('Signin attempt for:', email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Debug password info
        console.log('Stored password hash:', user.password);
        console.log('Input password:', password);
        
        // Check password using direct bcrypt comparison
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Create audit log for login
        await createAuditLog(
            user._id,
            'login',
            'user',
            user._id,
            {
                email: user.email,
                loginTime: new Date().toISOString()
            },
            req
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                quickpeId: user.quickpeId,
                balance: user.balance,
                role: user.role,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signin',
            error: error.message
        });
    }
});

// Signup endpoint
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            email: email.toLowerCase()
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user with username field (password will be hashed by pre-save hook)
        const user = new User({
            firstName,
            lastName,
            username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
            email: email.toLowerCase(),
            phone: phone || `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Generate random phone if not provided
            password: password,
            balance: 19000, // Starting balance
            roles: ['user'],
            isActive: true
        });

        // Generate QuickPe ID
        await user.generateQuickPeId();
        await user.save();

        // Create corresponding Account record
        const Account = require('../models/Account');
        const account = new Account({
            userId: user._id,
            balance: user.balance
        });
        await account.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Create audit log for user creation
        await createAuditLog(
            user._id,
            'user_created',
            'user',
            user._id,
            {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                quickpeId: user.quickpeId,
                signupTime: new Date().toISOString()
            },
            req
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                quickpeId: user.quickpeId,
                balance: user.balance,
                role: user.role,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup'
        });
    }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        // In a more sophisticated setup, you might want to blacklist the token
        // For now, we'll just send a success response
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
});

module.exports = router;
