const AuthService = require('../services/AuthService');
const { validationResult } = require('express-validator');

class AuthController {
    constructor() {
        this.authService = new AuthService();
    }

    /**
     * User signup
     */
    signup = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const result = await this.authService.signup(req.body);
            
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: result
            });
        } catch (error) {
            console.error('Signup error:', error);
            
            if (error.message === 'User already exists') {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    /**
     * User signin
     */
    signin = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;
            const result = await this.authService.signin(email, password);

            res.json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            console.error('Signin error:', error);
            
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    /**
     * Verify JWT token
     */
    verify = async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const result = await this.authService.verifyToken(token);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Token verification error:', error);
            
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    };

    /**
     * User logout
     */
    logout = async (req, res) => {
        try {
            // For JWT, logout is handled client-side by removing the token
            // Here we can add token blacklisting if needed
            
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    /**
     * Refresh JWT token
     */
    refreshToken = async (req, res) => {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }

            const result = await this.authService.refreshToken(refreshToken);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    };
}

module.exports = AuthController;
