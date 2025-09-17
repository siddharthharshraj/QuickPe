const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isEnabled: {
        type: Boolean,
        default: false
    },
    enabledForUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    disabledForUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    enabledForRoles: [{
        type: String,
        enum: ['user', 'admin', 'premium']
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Method to check if feature is enabled for a specific user
featureFlagSchema.methods.isEnabledForUser = function(userId, userRole = 'user') {
    // If globally disabled and user not in enabled list
    if (!this.isEnabled && !this.enabledForUsers.includes(userId)) {
        return false;
    }
    
    // If user is explicitly disabled
    if (this.disabledForUsers.includes(userId)) {
        return false;
    }
    
    // If user is explicitly enabled
    if (this.enabledForUsers.includes(userId)) {
        return true;
    }
    
    // If role is enabled
    if (this.enabledForRoles.includes(userRole)) {
        return true;
    }
    
    // Default to global setting
    return this.isEnabled;
};

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
