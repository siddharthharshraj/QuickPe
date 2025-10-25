const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actor_user_id: {
        type: String,
        required: true,
        index: true
    },
    action_type: {
        type: String,
        required: true,
        index: true,
        enum: [
            'user_created',
            'user_updated',
            'user_deleted',
            'transaction_created',
            'transaction_updated',
            'money_sent',
            'money_received',
            'money_requested',
            'balance_updated',
            'quickpe_id_assigned',
            'email_updated',
            'login',
            'logout',
            'password_changed',
            'notification_created',
            'audit_log_viewed',
            'money_added',
            'profile_viewed',
            'dashboard_accessed',
            'pdf_exported'
        ]
    },
    entity_type: {
        type: String,
        required: false,
        enum: ['user', 'transaction', 'account', 'notification', 'system']
    },
    entity_id: {
        type: String,
        required: false
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ip_address: {
        type: String,
        required: false
    },
    user_agent: {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // We're using created_at manually
});

// Indexes for performance
auditLogSchema.index({ actor_user_id: 1, created_at: -1 });
auditLogSchema.index({ action_type: 1, created_at: -1 });
auditLogSchema.index({ entity_type: 1, entity_id: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
