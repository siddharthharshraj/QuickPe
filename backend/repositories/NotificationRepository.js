const Notification = require('../models/Notification');

class NotificationRepository {
    async create(notificationData, options = {}) {
        return await Notification.create([notificationData], options);
    }

    async findByUserId(userId, options = {}) {
        return await Notification.find({ userId }, null, options)
            .sort({ createdAt: -1 });
    }

    async markAsRead(notificationId, userId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
    }

    async markAllAsRead(userId) {
        return await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }

    async getUnreadCount(userId) {
        return await Notification.countDocuments({ userId, isRead: false });
    }

    async deleteById(notificationId, userId) {
        return await Notification.findOneAndDelete({ _id: notificationId, userId });
    }
}

module.exports = NotificationRepository;
