const NotificationRepository = require('../repositories/NotificationRepository');
const AuditRepository = require('../repositories/AuditRepository');

class NotificationService {
    constructor() {
        this.notificationRepository = new NotificationRepository();
        this.auditRepository = new AuditRepository();
    }

    /**
     * Create a new notification
     */
    async createNotification(notificationData) {
        try {
            const notification = await this.notificationRepository.create(notificationData);
            
            // Log audit trail
            await this.auditRepository.create({
                userId: notificationData.userId,
                action: 'NOTIFICATION_CREATED',
                details: {
                    notificationId: notification._id,
                    type: notificationData.type,
                    title: notificationData.title,
                    timestamp: new Date()
                }
            });

            return notification;
        } catch (error) {
            console.error('Create notification error:', error);
            throw new Error('Failed to create notification');
        }
    }

    /**
     * Get user notifications with pagination
     */
    async getUserNotifications(userId, page = 1, limit = 20) {
        try {
            const options = {
                skip: (page - 1) * limit,
                limit: parseInt(limit)
            };

            const notifications = await this.notificationRepository.findByUserId(userId, options);
            const unreadCount = await this.notificationRepository.getUnreadCount(userId);

            return {
                notifications,
                unreadCount,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: notifications.length === limit
                }
            };
        } catch (error) {
            console.error('Get user notifications error:', error);
            throw new Error('Failed to fetch notifications');
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        try {
            const notification = await this.notificationRepository.markAsRead(notificationId, userId);
            
            if (!notification) {
                throw new Error('Notification not found');
            }

            // Log audit trail
            await this.auditRepository.create({
                userId,
                action: 'NOTIFICATION_READ',
                details: {
                    notificationId,
                    timestamp: new Date()
                }
            });

            return notification;
        } catch (error) {
            console.error('Mark notification as read error:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        try {
            const result = await this.notificationRepository.markAllAsRead(userId);
            
            // Log audit trail
            await this.auditRepository.create({
                userId,
                action: 'ALL_NOTIFICATIONS_READ',
                details: {
                    markedCount: result.modifiedCount,
                    timestamp: new Date()
                }
            });

            return result;
        } catch (error) {
            console.error('Mark all notifications as read error:', error);
            throw new Error('Failed to mark all notifications as read');
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId, userId) {
        try {
            const notification = await this.notificationRepository.deleteById(notificationId, userId);
            
            if (!notification) {
                throw new Error('Notification not found');
            }

            // Log audit trail
            await this.auditRepository.create({
                userId,
                action: 'NOTIFICATION_DELETED',
                details: {
                    notificationId,
                    timestamp: new Date()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Delete notification error:', error);
            throw error;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        try {
            return await this.notificationRepository.getUnreadCount(userId);
        } catch (error) {
            console.error('Get unread count error:', error);
            throw new Error('Failed to get unread count');
        }
    }

    /**
     * Create transaction notification
     */
    async createTransactionNotification(type, userId, data) {
        const notificationTypes = {
            money_sent: {
                title: 'Money Sent',
                message: `You sent ₹${data.amount} to ${data.recipientName}`
            },
            money_received: {
                title: 'Money Received', 
                message: `You received ₹${data.amount} from ${data.senderName}`
            },
            money_added: {
                title: 'Money Added',
                message: `₹${data.amount} has been added to your wallet`
            }
        };

        const notificationConfig = notificationTypes[type];
        if (!notificationConfig) {
            throw new Error('Invalid notification type');
        }

        return await this.createNotification({
            userId,
            type,
            title: notificationConfig.title,
            message: notificationConfig.message,
            data,
            isRead: false
        });
    }
}

module.exports = NotificationService;
