// Feature flags service for controlled feature rollouts
import { FEATURE_FLAGS } from '../config/constants';
import logger from '../utils/logger';

class FeatureFlagService {
  constructor() {
    this.flags = new Map();
    this.subscribers = new Map();
    this.initialized = false;
    this.refreshInterval = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load initial flags from API or localStorage
      await this.loadFlags();
      
      // Set up periodic refresh
      this.startPeriodicRefresh();
      
      this.initialized = true;
      logger.info('Feature flags initialized', { flagCount: this.flags.size });
    } catch (error) {
      logger.error('Failed to initialize feature flags', error);
      // Fall back to default flags
      this.loadDefaultFlags();
    }
  }

  async loadFlags() {
    try {
      // Try to load from API first
      const response = await fetch('/api/admin/feature-flags', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.setFlags(data.flags);
        logger.debug('Feature flags loaded from API', data.flags);
        return;
      }
    } catch (error) {
      logger.warn('Failed to load flags from API, using localStorage', error);
    }

    // Fall back to localStorage
    const storedFlags = localStorage.getItem('featureFlags');
    if (storedFlags) {
      try {
        const flags = JSON.parse(storedFlags);
        this.setFlags(flags);
        logger.debug('Feature flags loaded from localStorage', flags);
        return;
      } catch (error) {
        logger.warn('Invalid stored flags, using defaults', error);
      }
    }

    // Final fallback to defaults
    this.loadDefaultFlags();
  }

  loadDefaultFlags() {
    const defaultFlags = {
      [FEATURE_FLAGS.TRADE_JOURNAL_ENABLED]: true,
      [FEATURE_FLAGS.AI_ASSISTANT_ENABLED]: true,
      [FEATURE_FLAGS.ADVANCED_ANALYTICS_ENABLED]: true,
      [FEATURE_FLAGS.REAL_TIME_NOTIFICATIONS_ENABLED]: true,
      [FEATURE_FLAGS.MARKET_DATA_WIDGET_ENABLED]: true,
      [FEATURE_FLAGS.PREMIUM_FEATURES_ENABLED]: false
    };

    this.setFlags(defaultFlags);
    logger.info('Default feature flags loaded', defaultFlags);
  }

  setFlags(flags) {
    Object.entries(flags).forEach(([key, value]) => {
      const oldValue = this.flags.get(key);
      this.flags.set(key, value);

      // Notify subscribers if value changed
      if (oldValue !== value) {
        this.notifySubscribers(key, value, oldValue);
      }
    });

    // Store in localStorage for offline access
    localStorage.setItem('featureFlags', JSON.stringify(Object.fromEntries(this.flags)));
  }

  isEnabled(flagName) {
    if (!this.initialized) {
      logger.warn('Feature flags not initialized, returning false', { flagName });
      return false;
    }

    const enabled = this.flags.get(flagName) || false;
    logger.debug('Feature flag checked', { flagName, enabled });
    return enabled;
  }

  // Advanced flag evaluation with user context
  isEnabledForUser(flagName, userId = null, userAttributes = {}) {
    const baseEnabled = this.isEnabled(flagName);
    
    if (!baseEnabled) return false;

    // Add user-specific logic here
    const userContext = {
      userId,
      ...userAttributes,
      timestamp: Date.now()
    };

    // Example: Premium features only for premium users
    if (flagName === FEATURE_FLAGS.PREMIUM_FEATURES_ENABLED) {
      return userAttributes.isPremium === true;
    }

    // Example: Gradual rollout based on user ID
    if (flagName === FEATURE_FLAGS.ADVANCED_ANALYTICS_ENABLED && userId) {
      const hash = this.hashUserId(userId);
      const rolloutPercentage = 50; // 50% rollout
      return hash % 100 < rolloutPercentage;
    }

    logger.debug('Feature flag evaluated for user', { flagName, userId, enabled: baseEnabled });
    return baseEnabled;
  }

  // Subscribe to flag changes
  subscribe(flagName, callback) {
    if (!this.subscribers.has(flagName)) {
      this.subscribers.set(flagName, new Set());
    }
    
    this.subscribers.get(flagName).add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(flagName);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(flagName);
        }
      }
    };
  }

  notifySubscribers(flagName, newValue, oldValue) {
    const subscribers = this.subscribers.get(flagName);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(newValue, oldValue, flagName);
        } catch (error) {
          logger.error('Error in feature flag subscriber', error, { flagName });
        }
      });
    }
  }

  // Refresh flags from server
  async refreshFlags() {
    try {
      await this.loadFlags();
      logger.debug('Feature flags refreshed');
    } catch (error) {
      logger.error('Failed to refresh feature flags', error);
    }
  }

  startPeriodicRefresh(intervalMs = 5 * 60 * 1000) { // 5 minutes
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      this.refreshFlags();
    }, intervalMs);
  }

  stopPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Utility methods
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getAllFlags() {
    return Object.fromEntries(this.flags);
  }

  // Development helpers
  overrideFlag(flagName, value) {
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('Flag override attempted in non-development environment');
      return;
    }

    const oldValue = this.flags.get(flagName);
    this.flags.set(flagName, value);
    this.notifySubscribers(flagName, value, oldValue);
    
    logger.info('Feature flag overridden', { flagName, value, oldValue });
  }

  resetFlag(flagName) {
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('Flag reset attempted in non-development environment');
      return;
    }

    this.flags.delete(flagName);
    localStorage.removeItem('featureFlags');
    this.loadDefaultFlags();
    
    logger.info('Feature flag reset', { flagName });
  }

  // Cleanup
  destroy() {
    this.stopPeriodicRefresh();
    this.subscribers.clear();
    this.flags.clear();
    this.initialized = false;
  }
}

// React hook for feature flags
import { useState, useEffect } from 'react';

export const useFeatureFlag = (flagName, userContext = {}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlag = async () => {
      await featureFlagService.initialize();
      const enabled = featureFlagService.isEnabledForUser(
        flagName, 
        userContext.userId, 
        userContext
      );
      setIsEnabled(enabled);
      setLoading(false);
    };

    checkFlag();

    // Subscribe to flag changes
    const unsubscribe = featureFlagService.subscribe(flagName, (newValue) => {
      const enabled = featureFlagService.isEnabledForUser(
        flagName, 
        userContext.userId, 
        userContext
      );
      setIsEnabled(enabled);
    });

    return unsubscribe;
  }, [flagName, userContext.userId]);

  return { isEnabled, loading };
};

// React component for conditional rendering
export const FeatureFlag = ({ flag, userContext = {}, children, fallback = null }) => {
  const { isEnabled, loading } = useFeatureFlag(flag, userContext);

  if (loading) {
    return fallback;
  }

  return isEnabled ? children : fallback;
};

// Create singleton instance
const featureFlagService = new FeatureFlagService();

// Initialize on module load
if (typeof window !== 'undefined') {
  featureFlagService.initialize();
}

// Development tools
if (process.env.NODE_ENV === 'development') {
  window.featureFlags = {
    service: featureFlagService,
    override: (flag, value) => featureFlagService.overrideFlag(flag, value),
    reset: (flag) => featureFlagService.resetFlag(flag),
    getAll: () => featureFlagService.getAllFlags()
  };
}

export default featureFlagService;
