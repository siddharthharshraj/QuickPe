const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    username: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    quickpeId: {
        type: String,
        unique: true,
        sparse: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
        select: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'India'
        }
    },
    preferences: {
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            showProfile: {
                type: Boolean,
                default: true
            },
            showTransactions: {
                type: Boolean,
                default: false
            }
        }
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    settingsEnabled: {
        type: Boolean,
        default: true
    },
    subscription: {
        status: { 
            type: String, 
            enum: ['trial', 'active', 'expired', 'cancelled'], 
            default: 'trial' 
        },
        plan: { 
            type: String, 
            enum: ['basic', 'premium', 'enterprise'], 
            default: null 
        },
        trialStartDate: { 
            type: Date, 
            default: Date.now 
        },
        trialEndDate: { 
            type: Date, 
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        },
        subscriptionStartDate: Date,
        subscriptionEndDate: Date,
        razorpaySubscriptionId: String,
        razorpayCustomerId: String,
        paymentMethod: String,
        billingCycle: { 
            type: String, 
            enum: ['monthly', 'yearly'], 
            default: 'monthly' 
        }
    },
    featureFlags: {
        canSendMoney: { type: Boolean, default: false },
        canReceiveMoney: { type: Boolean, default: false },
        canViewAnalytics: { type: Boolean, default: false },
        canExportHistory: { type: Boolean, default: true },
        canUseTradeAnalytics: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        adminLevel: { type: Number, default: 0 } // 0=none, 1=basic, 2=super, 3=enterprise
    }
}, {
    timestamps: true,
    // Performance optimizations
    collection: 'users',
    selectPopulatedPaths: false,
    minimize: false
});

// ============= DATABASE OPTIMIZATION INDEXES =============

// Primary search indexes
userSchema.index({ email: 1 }, { unique: true, background: true });
userSchema.index({ quickpeId: 1 }, { unique: true, sparse: true, background: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true, background: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true, background: true });

// Query optimization indexes
userSchema.index({ isActive: 1, role: 1 }, { background: true });
userSchema.index({ 'subscription.status': 1, 'subscription.plan': 1 }, { background: true });
userSchema.index({ isAdmin: 1, 'featureFlags.adminLevel': 1 }, { background: true });
userSchema.index({ lastLogin: -1 }, { background: true });
userSchema.index({ createdAt: -1 }, { background: true });

// Compound indexes for admin queries
userSchema.index({ 
    isActive: 1, 
    'subscription.status': 1, 
    createdAt: -1 
}, { background: true });

// Text search index for user search
userSchema.index({
    firstName: 'text',
    lastName: 'text',
    email: 'text',
    quickpeId: 'text'
}, { 
    background: true,
    weights: {
        quickpeId: 10,
        email: 8,
        firstName: 5,
        lastName: 5
    },
    name: 'user_search_index'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Generate QuickPe ID
userSchema.methods.generateQuickPeId = async function() {
    if (this.quickpeId) return this.quickpeId;
    
    let quickpeId;
    let isUnique = false;
    
    while (!isUnique) {
        const randomNum = Math.floor(Math.random() * 999999) + 1;
        quickpeId = `QP${randomNum.toString().padStart(6, '0')}`;
        
        const existingUser = await mongoose.model('User').findOne({ quickpeId });
        if (!existingUser) {
            isUnique = true;
        }
    }
    
    this.quickpeId = quickpeId;
    return quickpeId;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

userSchema.set('toObject', {
    virtuals: true
});

// Clear any existing model to avoid schema conflicts
if (mongoose.models.User) {
    delete mongoose.models.User;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
