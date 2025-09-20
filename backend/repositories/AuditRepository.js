const AuditLog = require('../models/AuditLog');

class AuditRepository {
    async create(auditData, options = {}) {
        return await AuditLog.create(auditData, options);
    }

    async findByUserId(userId, options = {}) {
        return await AuditLog.find({ userId }, null, options)
            .sort({ createdAt: -1 });
    }

    async findWithFilters(filters, page = 1, limit = 50) {
        const query = AuditLog.find(filters);
        const total = await AuditLog.countDocuments(filters);

        const auditLogs = await query
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return {
            auditLogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getStatistics(userId, startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    userId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            }
        ];

        return await AuditLog.aggregate(pipeline);
    }
}

module.exports = AuditRepository;
