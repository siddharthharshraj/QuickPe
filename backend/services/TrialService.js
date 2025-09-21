const User = require('../models/User');
const PaymentAnalytics = require('../models/PaymentAnalytics');

class TrialService {
  /**
   * Check trial status for a user
   * @param {string} userId - User ID
   * @returns {Object} Trial status information
   */
  async checkTrialStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize trial if not set
      if (!user.subscription.trialEndDate) {
        user.subscription.trialStartDate = new Date();
        user.subscription.trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        user.subscription.status = 'trial';
        await user.save();
      }

      const now = new Date();
      const trialEnd = new Date(user.subscription.trialEndDate);
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

      const status = {
        isActive: now < trialEnd,
        daysLeft: Math.max(0, daysLeft),
        trialStartDate: user.subscription.trialStartDate,
        trialEndDate: user.subscription.trialEndDate,
        status: user.subscription.status
      };

      // Update status if trial expired
      if (!status.isActive && user.subscription.status === 'trial') {
        user.subscription.status = 'expired';
        await user.save();
        status.status = 'expired';
      }

      return status;
    } catch (error) {
      throw new Error(`Error checking trial status: ${error.message}`);
    }
  }

  /**
   * Extend trial period for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to extend
   * @returns {Date} New trial end date
   */
  async extendTrial(userId, days) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const currentEndDate = user.subscription.trialEndDate || new Date();
      const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      user.subscription.trialEndDate = newEndDate;
      user.subscription.status = 'trial';
      await user.save();

      // Log the extension
      await PaymentAnalytics.create({
        userId,
        metricType: 'trial',
        amount: 0,
        status: 'success',
        metadata: {
          action: 'trial_extended',
          daysExtended: days,
          newEndDate: newEndDate
        }
      });

      return newEndDate;
    } catch (error) {
      throw new Error(`Error extending trial: ${error.message}`);
    }
  }

  /**
   * Convert trial user to paid subscription
   * @param {string} userId - User ID
   * @param {Object} planData - Subscription plan data
   * @returns {Object} Updated user object
   */
  async convertToSubscription(userId, planData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const subscriptionEndDate = new Date();
      if (planData.billingCycle === 'yearly') {
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      } else {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      }

      // Update subscription
      user.subscription.status = 'active';
      user.subscription.plan = planData.plan;
      user.subscription.subscriptionStartDate = new Date();
      user.subscription.subscriptionEndDate = subscriptionEndDate;
      user.subscription.billingCycle = planData.billingCycle;
      user.subscription.razorpaySubscriptionId = planData.razorpaySubscriptionId;
      user.subscription.razorpayCustomerId = planData.razorpayCustomerId;

      // Update feature flags based on plan
      this.updateFeatureFlags(user, planData.plan);

      await user.save();

      // Log the conversion
      await PaymentAnalytics.create({
        userId,
        metricType: 'subscription',
        amount: planData.amount || 0,
        planType: planData.plan,
        billingCycle: planData.billingCycle,
        status: 'success',
        razorpayPaymentId: planData.razorpayPaymentId,
        metadata: {
          action: 'trial_converted',
          previousStatus: 'trial'
        }
      });

      return user;
    } catch (error) {
      throw new Error(`Error converting to subscription: ${error.message}`);
    }
  }

  /**
   * Update feature flags based on plan
   * @param {Object} user - User object
   * @param {string} plan - Plan type
   */
  updateFeatureFlags(user, plan) {
    const planFeatures = {
      basic: {
        canSendMoney: true,
        canReceiveMoney: true,
        canViewAnalytics: true,
        canExportHistory: true,
        canUseTradeAnalytics: false
      },
      premium: {
        canSendMoney: true,
        canReceiveMoney: true,
        canViewAnalytics: true,
        canExportHistory: true,
        canUseTradeAnalytics: true
      },
      enterprise: {
        canSendMoney: true,
        canReceiveMoney: true,
        canViewAnalytics: true,
        canExportHistory: true,
        canUseTradeAnalytics: true
      }
    };

    // Preserve admin flags
    const isAdmin = user.featureFlags?.isAdmin || user.isAdmin;
    const adminLevel = user.featureFlags?.adminLevel || 0;

    user.featureFlags = { 
      ...user.featureFlags, 
      ...planFeatures[plan],
      isAdmin,
      adminLevel
    };
  }

  /**
   * Cancel subscription and revert to trial/expired
   * @param {string} userId - User ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Updated user object
   */
  async cancelSubscription(userId, reason = 'user_requested') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.subscription.status = 'cancelled';
      
      // Reset feature flags to trial level
      user.featureFlags = {
        ...user.featureFlags,
        canSendMoney: false,
        canReceiveMoney: false,
        canViewAnalytics: false,
        canExportHistory: true,
        canUseTradeAnalytics: false
      };

      await user.save();

      // Log the cancellation
      await PaymentAnalytics.create({
        userId,
        metricType: 'churn',
        amount: 0,
        status: 'success',
        metadata: {
          action: 'subscription_cancelled',
          reason: reason,
          previousPlan: user.subscription.plan
        }
      });

      return user;
    } catch (error) {
      throw new Error(`Error cancelling subscription: ${error.message}`);
    }
  }

  /**
   * Get trial statistics for admin dashboard
   * @returns {Object} Trial statistics
   */
  async getTrialStatistics() {
    try {
      const totalTrialUsers = await User.countDocuments({ 'subscription.status': 'trial' });
      const expiredTrials = await User.countDocuments({ 'subscription.status': 'expired' });
      const activeSubscriptions = await User.countDocuments({ 'subscription.status': 'active' });
      
      // Calculate conversion rate
      const totalTrialsStarted = await PaymentAnalytics.countDocuments({ metricType: 'trial' });
      const conversions = await PaymentAnalytics.countDocuments({ 
        metricType: 'subscription',
        'metadata.action': 'trial_converted'
      });
      
      const conversionRate = totalTrialsStarted > 0 ? (conversions / totalTrialsStarted) * 100 : 0;

      return {
        totalTrialUsers,
        expiredTrials,
        activeSubscriptions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalTrialsStarted,
        conversions
      };
    } catch (error) {
      throw new Error(`Error getting trial statistics: ${error.message}`);
    }
  }

  /**
   * Initialize trial for new user
   * @param {string} userId - User ID
   * @returns {Object} Trial information
   */
  async initializeTrial(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Set trial dates
      user.subscription.trialStartDate = new Date();
      user.subscription.trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      user.subscription.status = 'trial';

      // Set trial feature flags
      user.featureFlags = {
        ...user.featureFlags,
        canSendMoney: false,
        canReceiveMoney: false,
        canViewAnalytics: false,
        canExportHistory: true,
        canUseTradeAnalytics: false
      };

      await user.save();

      // Log trial start
      await PaymentAnalytics.create({
        userId,
        metricType: 'trial',
        amount: 0,
        status: 'success',
        metadata: {
          action: 'trial_started'
        }
      });

      return {
        trialStartDate: user.subscription.trialStartDate,
        trialEndDate: user.subscription.trialEndDate,
        daysLeft: 7
      };
    } catch (error) {
      throw new Error(`Error initializing trial: ${error.message}`);
    }
  }
}

module.exports = new TrialService();
