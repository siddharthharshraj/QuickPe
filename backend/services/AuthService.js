const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
// const AuditRepository = require('../repositories/AuditRepository');

class AuthService {
    constructor() {
        this.userRepository = new UserRepository();
        // this.auditRepository = new AuditRepository();
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

        // Create user
        const newUser = await this.userRepository.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            quickpeId,
            balance: 0,
            isActive: true,
            role: 'user'
        });

        // Log audit trail (temporarily disabled)
        // try {
        //     await this.auditRepository.create({
        //         actor_user_id: newUser._id.toString(),
        //         action_type: 'user_created',
        //         resource_type: 'user',
        //         resource_id: newUser._id.toString(),
        //         details: {
        //             email,
        //             quickpeId,
        //             timestamp: new Date()
        //         }
        //     });
        // } catch (auditError) {
        //     console.error('Audit log creation failed, but continuing with signup:', auditError.message);
        //     // Continue with signup even if audit fails
        // }

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

        // Log audit trail (temporarily disabled)
        // try {
        //     const auditData = {
        //         actor_user_id: user._id.toString(),
        //         action_type: 'login',
        //         resource_type: 'user',
        //         resource_id: user._id.toString(),
        //         details: {
        //             email,
        //             timestamp: new Date()
        //         }
        //     };
        //     console.log('Creating audit log with data:', auditData);
        //     await this.auditRepository.create(auditData);
        // } catch (auditError) {
        //     console.error('Audit log creation failed, but continuing with signin:', auditError.message);
        //     // Continue with signin even if audit fails
        // }

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
     */
    generateQuickPeId() {
        const prefix = 'QPK-';
        const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
        return prefix + randomString;
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
