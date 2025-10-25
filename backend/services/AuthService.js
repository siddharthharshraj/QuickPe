const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const AuditRepository = require('../repositories/AuditRepository');

class AuthService {
    constructor() {
        this.userRepository = new UserRepository();
        this.auditRepository = new AuditRepository();
    }

    /**
     * User signup service
     */
    async signup(userData) {
        const { firstName, lastName, email, password, phone } = userData;

        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate QuickPe ID
        const quickpeId = this.generateQuickPeId();

        // Create user with initial balance of ₹10,000
        const newUser = await this.userRepository.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            quickpeId,
            balance: 10000, // Initial balance as per requirements
            isActive: true,
            role: 'user'
        });

        // Log audit trail for signup
        try {
            await this.auditRepository.create({
                userId: newUser._id.toString(),
                action: 'SIGNUP',
                details: {
                    email,
                    quickpeId,
                    initialBalance: 10000,
                    timestamp: new Date()
                },
                ipAddress: null, // Can be passed from controller
                userAgent: null  // Can be passed from controller
            });
        } catch (auditError) {
            console.error('Audit log creation failed, but continuing with signup:', auditError.message);
            // Continue with signup even if audit fails
        }

        // Generate JWT token
        const token = await this.generateToken(newUser._id);

        return {
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                quickpeId: newUser.quickpeId,
                balance: newUser.balance,
                role: newUser.role
            },
            token
        };
    }

    /**
     * User signin service
     */
    async signin(email, password) {
        // Find user by email
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        await this.userRepository.updateLastLogin(user._id);

        // Log audit trail for login
        try {
            await this.auditRepository.create({
                userId: user._id.toString(),
                action: 'LOGIN',
                details: {
                    email,
                    timestamp: new Date()
                },
                ipAddress: null, // Can be passed from controller
                userAgent: null  // Can be passed from controller
            });
        } catch (auditError) {
            console.error('Audit log creation failed, but continuing with signin:', auditError.message);
            // Continue with signin even if audit fails
        }

        // Generate JWT token
        const token = await this.generateToken(user._id);

        return {
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                quickpeId: user.quickpeId,
                balance: user.balance,
                role: user.role,
                isAdmin: user.isAdmin || false
            },
            token
        };
    }

    /**
     * Verify JWT token
     */
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await this.userRepository.findById(decoded.userId);
            
            if (!user || !user.isActive) {
                throw new Error('Invalid token');
            }

            return {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    quickpeId: user.quickpeId,
                    balance: user.balance,
                    role: user.role,
                    isAdmin: user.isAdmin || false
                }
            };
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    /**
     * Refresh JWT token
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await this.userRepository.findById(decoded.userId);
            
            if (!user || !user.isActive) {
                throw new Error('Invalid refresh token');
            }

            const newToken = await this.generateToken(user._id);
            const newRefreshToken = this.generateRefreshToken(user._id);

            return {
                token: newToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Generate JWT token
     */
    async generateToken(userId) {
        // Get user details to include role and admin status in token
        const user = await this.userRepository.findById(userId);
        return jwt.sign(
            { 
                userId,
                role: user.role,
                isAdmin: user.isAdmin || false
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    }

    /**
     * Generate unique QuickPe ID
     * Format: QP{YEAR}{4-DIGIT-UNIQUE-NUMBER}
     * Example: QP20251234
     */
    generateQuickPeId() {
        const year = new Date().getFullYear();
        // Generate 4 random digits (1000-9999)
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        return `QP${year}${randomDigits}`;
    }

    /**
     * Reset password (simple method for testing)
     */
    async resetPassword(email, newPassword) {
        // Find user by email
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        await this.userRepository.updatePassword(user._id, hashedPassword);

        return {
            message: 'Password reset successfully',
            email: user.email
        };
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
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
            action: 'PASSWORD_CHANGE',
            details: {
                timestamp: new Date()
            }
        });

        return { success: true };
    }

    /**
     * Reset password (admin only)
     */
    async resetPassword(userId, newPassword) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await this.userRepository.updatePassword(userId, hashedPassword);

        // Log audit trail
        await this.auditRepository.create({
            userId,
            action: 'PASSWORD_RESET',
            details: {
                timestamp: new Date()
            }
        });

        return { success: true };
    }
}

module.exports = AuthService;
