const mongoose = require('mongoose');

const paymentAnalyticsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  metricType: { 
    type: String, 
    enum: ['subscription', 'trial', 'churn', 'revenue'], 
    required: true 
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: { 
    type: String, 
    default: 'INR' 
  },
  planType: {
    type: String,
    enum: ['basic', 'premium', 'enterprise']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly']
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  },
  razorpayPaymentId: String,
  status: { 
    type: String, 
    enum: ['success', 'failed', 'pending'], 
    default: 'pending' 
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
paymentAnalyticsSchema.index({ userId: 1, createdAt: -1 });
paymentAnalyticsSchema.index({ metricType: 1, paymentDate: -1 });
paymentAnalyticsSchema.index({ planType: 1, status: 1 });

// Clear any existing model to avoid schema conflicts
if (mongoose.models.PaymentAnalytics) {
    delete mongoose.models.PaymentAnalytics;
}

const PaymentAnalytics = mongoose.model('PaymentAnalytics', paymentAnalyticsSchema);

module.exports = PaymentAnalytics;
