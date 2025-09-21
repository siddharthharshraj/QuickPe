import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, Check, ArrowRight } from 'lucide-react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

const UpgradePage = () => {
  const { getSubscriptionInfo } = useFeatureFlags();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  
  const plans = {
    basic: {
      name: 'Basic',
      price: '₹99',
      period: '/month',
      features: ['Send & Receive Money', 'Transaction History', 'Basic Analytics', 'Email Support'],
      icon: Star,
      color: 'from-blue-500 to-blue-600'
    },
    premium: {
      name: 'Premium',
      price: '₹299',
      period: '/month',
      features: ['All Basic Features', 'Trade Analytics', 'Portfolio Insights', 'Priority Support'],
      icon: Crown,
      color: 'from-emerald-500 to-emerald-600',
      popular: true
    },
    enterprise: {
      name: 'Enterprise',
      price: '₹999',
      period: '/month',
      features: ['All Premium Features', 'API Access', 'White-label', 'Dedicated Support'],
      icon: Zap,
      color: 'from-purple-500 to-purple-600'
    }
  };

  const handleUpgrade = (planType) => {
    alert(`Upgrading to ${plans[planType].name} plan - Razorpay integration coming soon!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <Crown className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade Your Plan</h1>
          <p className="text-xl text-gray-600">Unlock powerful features for your financial journey</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(plans).map(([key, plan]) => {
            const IconComponent = plan.icon;
            return (
              <motion.div
                key={key}
                className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === key ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'
                }`}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedPlan(key)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handleUpgrade(key)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    Choose {plan.name}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
