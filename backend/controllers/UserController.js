const UserService = require('../services/UserService');
const { validationResult } = require('express-validator');

class UserController {
    constructor() {
        this.userService = new UserService();
    }

    /**
     * Get user profile
     */
    getProfile = async (req, res) => {
        try {
            const userId = req.userId;
            const user = await this.userService.getUserProfile(userId);

            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }
    };

    /**
     * Update user profile
     */
    updateProfile = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.userId;
            const updateData = req.body;

            const user = await this.userService.updateProfile(userId, updateData);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { user }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    };

    /**
     * Get user balance
     */
    getBalance = async (req, res) => {
        try {
            const userId = req.userId;
            const balance = await this.userService.getUserBalance(userId);

            res.json({
                success: true,
                data: { balance }
            });
        } catch (error) {
            console.error('Get balance error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to fetch balance'
            });
        }
    };

    /**
     * Get all users (for send money functionality)
     */
    getAllUsers = async (req, res) => {
        try {
            const userId = req.userId;
            const { search, page = 1, limit = 10 } = req.query;

            const result = await this.userService.getAllUsers({
                excludeUserId: userId,
                search,
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get all users error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users'
            });
        }
    };

    /**
     * Change password
     */
    changePassword = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.userId;
            const { currentPassword, newPassword } = req.body;

            await this.userService.changePassword(userId, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            
            if (error.message === 'Current password is incorrect') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to change password'
            });
        }
    };

    /**
     * Deactivate account
     */
    deactivateAccount = async (req, res) => {
        try {
            const userId = req.userId;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required to deactivate account'
                });
            }

            await this.userService.deactivateAccount(userId, password);

            res.json({
                success: true,
                message: 'Account deactivated successfully'
            });
        } catch (error) {
            console.error('Deactivate account error:', error);
            
            if (error.message === 'Invalid password') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to deactivate account'
            });
        }
    };
}

module.exports = UserController;
