const express = require('express');
const cors = require('cors');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/index');

const router = express.Router();
const authController = new AuthController();

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

// Validation middleware
const signupValidation = [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
];

const signinValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/signup', signupValidation, authController.signup);
router.post('/signin', signinValidation, authController.signin);
router.get('/verify', authController.verify);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
