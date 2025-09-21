const crypto = require('crypto');
const User = require('../models/User');
const PaymentAnalytics = require('../models/PaymentAnalytics');
const TrialService = require('./TrialService');

class PaymentService {
  constructor() {
    // Dummy Razorpay configuration - will be replaced with real integration
    this.razorpayConfig = {
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_key',
    };
  }

  /**
   * Create subscription (dummy implementation)
   * @param {Object} planData - Subscription plan data
   * @returns {Object} Subscription details
   */
  async createSubscription(planData) {
    try {
      // Dummy subscription creation - simulate Razorpay response
      const dummySubscription = {
        id: `sub_${this.generateDummyId()}`,
        entity: 'subscription',
        plan_id: planData.planId || `plan_${planData.plan}`,
        customer_id: planData.customerId || `cust_${this.generateDummyId()}`,
        status: 'created',
        current_start: Math.floor(Date.now() / 1000),
        current_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000), // 30 days
        ended_at: null,
        quantity: 1,
        notes: {
          plan: planData.plan,
          billing_cycle: planData.billingCycle
        },
        charge_at: Math.floor(Date.now() / 1000) + 86400, // Start tomorrow
        start_at: Math.floor(Date.now() / 1000) + 86400,
        end_at: null,
        auth_attempts: 0,
        total_count: planData.billingCycle === 'yearly' ? 1 : 12,
        paid_count: 0,
        customer_notify: 1,
        created_at: Math.floor(Date.now() / 1000),
        expire_by: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days
        short_url: `https://rzp.io/i/${this.generateDummyId()}`
      };

      console.log('Dummy subscription created:', dummySubscription);
      return dummySubscription;
    } catch (error) {
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Create payment order (dummy implementation)
   * @param {Object} orderData - Order data
   * @returns {Object} Order details
   */
  async createOrder(orderData) {
    try {
      const dummyOrder = {
        id: `order_${this.generateDummyId()}`,
        entity: 'order',
        amount: orderData.amount * 100, // Convert to paise
        amount_paid: 0,
        amount_due: orderData.amount * 100,
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt || `receipt_${Date.now()}`,
        offer_id: null,
        status: 'created',
        attempts: 0,
        notes: orderData.notes || {},
        created_at: Math.floor(Date.now() / 1000)
      };

      console.log('Dummy order created:', dummyOrder);
      return dummyOrder;
    } catch (error) {
      throw new Error(`Order creation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment (dummy implementation)
   * @param {Object} paymentData - Payment verification data
   * @returns {Boolean} Verification result
   */
  verifyPayment(paymentData) {
    try {
      // Dummy verification - in real implementation, this would verify Razorpay signature
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData;
      
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return false;
      }

      // Simulate signature verification
      const expectedSignature = this.generateDummySignature(razorpay_order_id, razorpay_payment_id);
      const isValid = expectedSignature === razorpay_signature;

      console.log('Dummy payment verification:', {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        is_valid: isValid
      });

      return isValid;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Process subscription payment (dummy implementation)
   * @param {string} userId - User ID
   * @param {Object} paymentData - Payment data
   * @returns {Object} Processing result
   */
  async processSubscriptionPayment(userId, paymentData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Simulate payment processing
      const isPaymentValid = this.verifyPayment(paymentData);
      
      if (!isPaymentValid) {
        throw new Error('Payment verification failed');
      }

      // Convert trial to subscription
      const subscriptionData = {
        plan: paymentData.plan,
        billingCycle: paymentData.billingCycle,
        amount: paymentData.amount,
        razorpaySubscriptionId: paymentData.razorpay_subscription_id,
        razorpayCustomerId: paymentData.razorpay_customer_id,
        razorpayPaymentId: paymentData.razorpay_payment_id
      };

      const updatedUser = await TrialService.convertToSubscription(userId, subscriptionData);

      // Log successful payment
      await PaymentAnalytics.create({
        userId,
        metricType: 'subscription',
        amount: paymentData.amount,
        planType: paymentData.plan,
        billingCycle: paymentData.billingCycle,
        status: 'success',
        razorpayPaymentId: paymentData.razorpay_payment_id,
        metadata: {
          action: 'subscription_payment_processed',
          payment_method: 'razorpay_dummy'
        }
      });

      return {
        success: true,
        user: updatedUser,
        message: 'Subscription activated successfully',
        subscription: {
          plan: paymentData.plan,
          status: 'active',
          next_billing: updatedUser.subscription.subscriptionEndDate
        }
      };
    } catch (error) {
      // Log failed payment
      await PaymentAnalytics.create({
        userId,
        metricType: 'subscription',
        amount: paymentData.amount || 0,
        planType: paymentData.plan,
        status: 'failed',
        metadata: {
          action: 'subscription_payment_failed',
          error: error.message
        }
      });

      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Get subscription details (dummy implementation)
   * @param {string} subscriptionId - Subscription ID
   * @returns {Object} Subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      // Dummy subscription fetch
      const dummySubscription = {
        id: subscriptionId,
        entity: 'subscription',
        status: 'active',
        current_start: Math.floor(Date.now() / 1000),
        current_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        paid_count: 1,
        total_count: 12,
        customer_notify: 1,
        created_at: Math.floor(Date.now() / 1000)
      };

      return dummySubscription;
    } catch (error) {
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }
  }

  /**
   * Cancel subscription (dummy implementation)
   * @param {string} subscriptionId - Subscription ID
   * @returns {Object} Cancellation result
   */
  async cancelSubscription(subscriptionId) {
    try {
      // Dummy cancellation
      const cancelledSubscription = {
        id: subscriptionId,
        entity: 'subscription',
        status: 'cancelled',
        ended_at: Math.floor(Date.now() / 1000),
        cancelled_at: Math.floor(Date.now() / 1000)
      };

      console.log('Dummy subscription cancelled:', cancelledSubscription);
      return cancelledSubscription;
    } catch (error) {
      throw new Error(`Subscription cancellation failed: ${error.message}`);
    }
  }

  /**
   * Get payment analytics
   * @param {string} timeframe - Time frame for analytics
   * @returns {Object} Payment analytics data
   */
  async getPaymentAnalytics(timeframe = '30d') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const analytics = await PaymentAnalytics.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              planType: '$planType',
              status: '$status'
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get payment analytics: ${error.message}`);
    }
  }

  // Helper methods for dummy implementation
  generateDummyId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  generateDummySignature(orderId, paymentId) {
    // Dummy signature generation - in real implementation, use Razorpay's HMAC
    const sign = orderId + '|' + paymentId;
    return crypto
      .createHmac('sha256', this.razorpayConfig.key_secret)
      .update(sign.toString())
      .digest('hex');
  }

  /**
   * Get plan pricing
   * @returns {Object} Plan pricing information
   */
  getPlanPricing() {
    return {
      basic: {
        monthly: { amount: 99, currency: 'INR' },
        yearly: { amount: 999, currency: 'INR', discount: 20 }
      },
      premium: {
        monthly: { amount: 299, currency: 'INR' },
        yearly: { amount: 2999, currency: 'INR', discount: 20 }
      },
      enterprise: {
        monthly: { amount: 999, currency: 'INR' },
        yearly: { amount: 9999, currency: 'INR', discount: 20 }
      }
    };
  }
}

module.exports = new PaymentService();
