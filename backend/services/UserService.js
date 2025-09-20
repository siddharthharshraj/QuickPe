const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');
const AuditRepository = require('../repositories/AuditRepository');

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
        this.auditRepository = new AuditRepository();
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            quickpeId: user.quickpeId,
            balance: user.balance,
            role: user.role,
            isActive: user.isActive,
            settingsEnabled: user.settingsEnabled !== false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin
        };
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        // Validate that user exists
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
            throw new Error('User not found');
        }

        // Check if settings are enabled for this user
        if (existingUser.settingsEnabled === false) {
            throw new Error('Profile updates are disabled for this account');
        }

        // Filter allowed update fields
        const allowedFields = ['firstName', 'lastName', 'phone'];
        const filteredData = {};
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        });

        // Update user
        const updatedUser = await this.userRepository.updateProfile(userId, filteredData);

        // Log audit trail
        await this.auditRepository.create({
            userId,
            action: 'PROFILE_UPDATED',
            details: {
                updatedFields: Object.keys(filteredData),
                timestamp: new Date()
            }
        });

        return {
            id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            quickpeId: updatedUser.quickpeId,
            balance: updatedUser.balance,
            role: updatedUser.role,
            isActive: updatedUser.isActive,
            settingsEnabled: updatedUser.settingsEnabled !== false,
            updatedAt: updatedUser.updatedAt
        };
    }

    /**
     * Get user balance
     */
    async getUserBalance(userId) {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        return user.balance || 0;
    }

    /**
     * Get all users (excluding current user)
     */
    async getAllUsers({ excludeUserId, search, page = 1, limit = 10 }) {
        const filters = {
            _id: { $ne: excludeUserId },
            isActive: true
        };

        // Add search functionality
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filters.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { quickpeId: searchRegex }
            ];
        }

        const options = {
            skip: (page - 1) * limit,
            limit: parseInt(limit),
            sort: { firstName: 1, lastName: 1 }
        };

        const users = await this.userRepository.findAll(filters, options);
        
        // Format user data for response
        const formattedUsers = users.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            quickpeId: user.quickpeId,
            balance: user.balance
        }));

        return {
            users: formattedUsers,
            pagination: {
                page,
                limit,
                hasMore: users.length === limit
            }
        };
    }

    /**
     * Change user password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Check if settings are enabled for this user
        if (user.settingsEnabled === false) {
            throw new Error('Password changes are disabled for this account');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await this.userRepository.updatePassword(userId, hashedNewPassword);

        // Log audit trail
        await this.auditRepository.create({
            userId,
            action: 'PASSWORD_CHANGED',
            details: {
                timestamp: new Date()
            }
        });

        return { success: true };
    }

    /**
     * Deactivate user account
     */
    async deactivateAccount(userId, password) {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        // Check if user has balance
        if (user.balance > 0) {
            throw new Error('Cannot deactivate account with remaining balance. Please withdraw all funds first.');
        }

        // Deactivate account
        await this.userRepository.updateProfile(userId, { isActive: false });

        // Log audit trail
        await this.auditRepository.create({
            userId,
            action: 'ACCOUNT_DEACTIVATED',
            details: {
                timestamp: new Date()
            }
        });

        return { success: true };
    }

    /**
     * Get user by QuickPe ID
     */
    async getUserByQuickPeId(quickpeId) {
        const user = await this.userRepository.findAll({ quickpeId, isActive: true });
        
        if (!user || user.length === 0) {
            throw new Error('User not found');
        }

        const foundUser = user[0];
        return {
            id: foundUser._id,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            name: `${foundUser.firstName} ${foundUser.lastName}`,
            email: foundUser.email,
            quickpeId: foundUser.quickpeId
        };
    }

    /**
     * Search users by name or QuickPe ID
     */
    async searchUsers(query, excludeUserId) {
        const searchRegex = new RegExp(query, 'i');
        const filters = {
            _id: { $ne: excludeUserId },
            isActive: true,
            $or: [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { quickpeId: searchRegex }
            ]
        };

        const users = await this.userRepository.findAll(filters, { limit: 10 });
        
        return users.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`,
            quickpeId: user.quickpeId,
            email: user.email
        }));
    }
}

module.exports = UserService;
