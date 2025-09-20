const User = require('../models/User');

class UserRepository {
    async create(userData) {
        return await User.create(userData);
    }

    async findById(id, options = {}) {
        return await User.findById(id, null, options);
    }

    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async updateBalance(userId, newBalance, options = {}) {
        return await User.findByIdAndUpdate(
            userId, 
            { balance: newBalance }, 
            { new: true, ...options }
        );
    }

    async updateLastLogin(userId) {
        return await User.findByIdAndUpdate(
            userId,
            { lastLogin: new Date() },
            { new: true }
        );
    }

    async updatePassword(userId, hashedPassword) {
        return await User.findByIdAndUpdate(
            userId,
            { password: hashedPassword },
            { new: true }
        );
    }

    async findAll(filters = {}, options = {}) {
        return await User.find(filters, null, options);
    }

    async updateProfile(userId, updateData) {
        return await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );
    }
}

module.exports = UserRepository;
