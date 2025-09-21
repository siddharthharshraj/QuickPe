import { useContext, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useFeatureFlags = () => {
  const { user } = useContext(AuthContext);
  
  const getTrialDaysLeft = (user) => {
    if (!user?.subscription?.trialEndDate) return 0;
    
    const now = new Date();
    const trialEnd = new Date(user.subscription.trialEndDate);
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysLeft);
  };

  const checkFeature = useMemo(() => {
    return (feature) => {
      if (!user) return false;
      
      // Admin override - admins can access everything
      if (user.featureFlags?.isAdmin || user.isAdmin) return true;
      
      // Check if user has the specific feature flag
      if (user.featureFlags && user.featureFlags[feature] !== undefined) {
        return user.featureFlags[feature];
      }
      
      // Trial users (7 days)
      if (user.subscription?.status === 'trial') {
        const trialDaysLeft = getTrialDaysLeft(user);
        
        // If trial expired, only allow export
        if (trialDaysLeft <= 0) {
          return feature === 'canExportHistory';
        }
        
        // During trial, only allow export
        return feature === 'canExportHistory';
      }
      
      // Active subscribers
      if (user.subscription?.status === 'active') {
        const planFeatures = {
          basic: [
            'canSendMoney', 
            'canReceiveMoney', 
            'canViewAnalytics', 
            'canExportHistory'
          ],
          premium: [
            'canSendMoney', 
            'canReceiveMoney', 
            'canViewAnalytics', 
            'canExportHistory', 
            'canUseTradeAnalytics'
          ],
          enterprise: [
            'canSendMoney', 
            'canReceiveMoney', 
            'canViewAnalytics', 
            'canExportHistory', 
            'canUseTradeAnalytics'
          ]
        };
        
        const userPlan = user.subscription.plan;
        return planFeatures[userPlan]?.includes(feature) || false;
      }
      
      // Default: no access
      return false;
    };
  }, [user]);

  const getSubscriptionInfo = useMemo(() => {
    if (!user) return null;
    
    const trialDaysLeft = getTrialDaysLeft(user);
    const isTrialActive = user.subscription?.status === 'trial' && trialDaysLeft > 0;
    const isSubscriptionActive = user.subscription?.status === 'active';
    
    return {
      status: user.subscription?.status || 'trial',
      plan: user.subscription?.plan || null,
      trialDaysLeft,
      isTrialActive,
      isSubscriptionActive,
      isExpired: user.subscription?.status === 'expired' || 
                 (user.subscription?.status === 'trial' && trialDaysLeft <= 0),
      billingCycle: user.subscription?.billingCycle || 'monthly'
    };
  }, [user]);

  const getPlanLimitations = useMemo(() => {
    if (!user) return [];
    
    const limitations = [];
    const subscription = getSubscriptionInfo;
    
    if (subscription.isExpired) {
      limitations.push({
        feature: 'Account Expired',
        message: 'Your trial has expired. Upgrade to continue using QuickPe.',
        severity: 'high'
      });
    } else if (subscription.isTrialActive) {
      limitations.push({
        feature: 'Trial Account',
        message: `${subscription.trialDaysLeft} days left in your trial.`,
        severity: 'medium'
      });
    }
    
    if (!checkFeature('canSendMoney')) {
      limitations.push({
        feature: 'Send Money',
        message: 'Upgrade to send money to other users.',
        severity: 'medium'
      });
    }
    
    if (!checkFeature('canUseTradeAnalytics')) {
      limitations.push({
        feature: 'Trade Analytics',
        message: 'Upgrade to Premium for advanced trade analytics.',
        severity: 'low'
      });
    }
    
    return limitations;
  }, [user, checkFeature, getSubscriptionInfo]);

  return { 
    checkFeature, 
    user, 
    getSubscriptionInfo,
    getPlanLimitations,
    isAdmin: user?.featureFlags?.isAdmin || user?.isAdmin || false,
    adminLevel: user?.featureFlags?.adminLevel || 0
  };
};
