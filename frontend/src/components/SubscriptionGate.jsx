import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, Zap, Star, ArrowRight } from 'lucide-react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

const SubscriptionModal = ({ onClose, feature }) => {
  const [selectedPlan, setSelectedPlan] = useState('basic');
  
  const plans = {
    basic: {
      name: 'Basic',
      price: '₹99',
      period: '/month',
      yearlyPrice: '₹999',
      features: [
        'Send & Receive Money',
        'Transaction History',
        'Basic Analytics',
        'Email Support'
      ],
      icon: Star,
      color: 'from-blue-500 to-blue-600'
    },
    premium: {
      name: 'Premium',
      price: '₹299',
      period: '/month',
      yearlyPrice: '₹2,999',
      features: [
        'All Basic Features',
        'Advanced Trade Analytics',
        'Portfolio Insights',
        'Priority Support',
        'Export Reports'
      ],
      icon: Crown,
      color: 'from-emerald-500 to-emerald-600',
      popular: true
    },
    enterprise: {
      name: 'Enterprise',
      price: '₹999',
      period: '/month',
      yearlyPrice: '₹9,999',
      features: [
        'All Premium Features',
        'API Access',
        'White-label Solution',
        'Dedicated Support',
        'Custom Integrations'
      ],
      icon: Zap,
      color: 'from-purple-500 to-purple-600'
    }
  };

  const handleUpgrade = () => {
    // Dummy implementation - will be replaced with Razorpay
    alert(`Upgrading to ${plans[selectedPlan].name} plan - Razorpay integration coming soon!`);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
              <p className="text-gray-600 mt-1">Unlock premium features and boost your financial journey</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(plans).map(([key, plan]) => {
              const IconComponent = plan.icon;
              return (
                <motion.div
                  key={key}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPlan === key
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedPlan(key)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                      <div className="text-sm text-gray-500">
                        or {plan.yearlyPrice}/year (save 20%)
                      </div>
                    </div>
                    
                    <ul className="space-y-2 text-left">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 font-medium"
            >
              Upgrade to {plans[selectedPlan].name}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trial Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>All plans come with a 7-day free trial. Cancel anytime.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SubscriptionGate = ({ feature, children, fallback, className = '' }) => {
  const { checkFeature, getSubscriptionInfo } = useFeatureFlags();
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const hasAccess = checkFeature(feature);
  const subscriptionInfo = getSubscriptionInfo;

  if (hasAccess) {
    return children;
  }

  const getFeatureName = (feature) => {
    const featureNames = {
      canSendMoney: 'Send Money',
      canReceiveMoney: 'Receive Money',
      canViewAnalytics: 'Analytics Dashboard',
      canUseTradeAnalytics: 'Trade Analytics',
      canExportHistory: 'Export History'
    };
    return featureNames[feature] || 'This Feature';
  };

  const getUpgradeMessage = () => {
    if (subscriptionInfo?.isExpired) {
      return 'Your trial has expired. Upgrade to continue using QuickPe.';
    }
    if (subscriptionInfo?.isTrialActive) {
      return `${subscriptionInfo.trialDaysLeft} days left in trial. Upgrade for full access.`;
    }
    return 'Upgrade your plan to unlock this feature.';
  };

  return (
    <>
      <div className={`subscription-gate ${className}`}>
        {fallback || (
          <motion.div
            className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {getFeatureName(feature)} Locked
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-md">
              {getUpgradeMessage()}
            </p>
            
            <motion.button
              onClick={() => setShowUpgrade(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
            </motion.button>
            
            {subscriptionInfo?.isTrialActive && (
              <p className="text-sm text-emerald-600 mt-3">
                ⏰ {subscriptionInfo.trialDaysLeft} days left in your free trial
              </p>
            )}
          </motion.div>
        )}
      </div>
      
      {showUpgrade && (
        <SubscriptionModal 
          onClose={() => setShowUpgrade(false)} 
          feature={feature}
        />
      )}
    </>
  );
};

export default SubscriptionGate;
