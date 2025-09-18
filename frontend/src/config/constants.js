// Application constants for better maintainability
export const APP_CONFIG = {
  NAME: 'QuickPe',
  VERSION: '1.0.0',
  DESCRIPTION: 'Digital Wallet & Trading Platform',
  AUTHOR: 'Siddharth Harsh Raj',
  EMAIL: 'contact@siddharth-dev.tech',
  LINKEDIN: 'siddharthharshraj'
};

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    VERIFY: '/auth/verify',
    LOGOUT: '/auth/logout'
  },
  ACCOUNT: {
    BALANCE: '/account/balance',
    TRANSACTIONS: '/account/transactions',
    TRANSFER: '/account/transfer',
    DEPOSIT: '/account/deposit'
  },
  ADMIN: {
    USERS: '/admin/users',
    ANALYTICS: '/admin/analytics',
    FEATURE_FLAGS: '/admin/feature-flags',
    SYSTEM_HEALTH: '/admin/system-health'
  },
  TRADE_JOURNAL: {
    ENTRIES: '/trade-journal/entries',
    STATS: '/trade-journal/stats',
    EXPORT: '/trade-journal/export',
    MARKET_DATA: '/trade-journal/market-data'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/mark-read',
    UNREAD_COUNT: '/notifications/unread-count'
  }
};

export const UI_CONSTANTS = {
  COLORS: {
    PRIMARY: '#059669', // Emerald-600
    SECONDARY: '#0d9488', // Teal-600
    SUCCESS: '#10b981', // Emerald-500
    ERROR: '#dc2626', // Red-600
    WARNING: '#f59e0b', // Amber-500
    INFO: '#3b82f6' // Blue-500
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  },
  ANIMATION: {
    DURATION: {
      FAST: '150ms',
      NORMAL: '300ms',
      SLOW: '500ms'
    },
    EASING: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      IN: 'cubic-bezier(0.4, 0, 1, 1)',
      OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};

export const BUSINESS_RULES = {
  TRANSACTION: {
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 100000,
    DAILY_LIMIT: 500000,
    MONTHLY_LIMIT: 2000000
  },
  TRADE_JOURNAL: {
    MAX_ENTRIES_PER_USER: 10000,
    SUPPORTED_EXCHANGES: ['NSE', 'BSE'],
    SUPPORTED_SEGMENTS: ['EQUITY', 'FUTURES', 'OPTIONS'],
    MAX_POSITION_SIZE: 10000000
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    VIRTUAL_SCROLL_THRESHOLD: 50
  },
  CACHE: {
    TTL: {
      BALANCE: 60, // 1 minute
      TRANSACTIONS: 120, // 2 minutes
      MARKET_DATA: 30, // 30 seconds
      USER_PROFILE: 300 // 5 minutes
    }
  }
};

export const ERROR_CODES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  
  // Transaction Errors
  TRANSACTION_INSUFFICIENT_BALANCE: 'TXN_001',
  TRANSACTION_INVALID_AMOUNT: 'TXN_002',
  TRANSACTION_DAILY_LIMIT_EXCEEDED: 'TXN_003',
  TRANSACTION_RECIPIENT_NOT_FOUND: 'TXN_004',
  
  // Trade Journal Errors
  TRADE_INVALID_SYMBOL: 'TRADE_001',
  TRADE_INVALID_QUANTITY: 'TRADE_002',
  TRADE_INVALID_PRICE: 'TRADE_003',
  TRADE_POSITION_LIMIT_EXCEEDED: 'TRADE_004',
  
  // System Errors
  SYSTEM_DATABASE_ERROR: 'SYS_001',
  SYSTEM_EXTERNAL_API_ERROR: 'SYS_002',
  SYSTEM_RATE_LIMIT_EXCEEDED: 'SYS_003',
  SYSTEM_MAINTENANCE_MODE: 'SYS_004'
};

export const FEATURE_FLAGS = {
  TRADE_JOURNAL_ENABLED: 'trade-journal',
  AI_ASSISTANT_ENABLED: 'ai-assistant',
  ADVANCED_ANALYTICS_ENABLED: 'advanced-analytics',
  REAL_TIME_NOTIFICATIONS_ENABLED: 'real-time-notifications',
  MARKET_DATA_WIDGET_ENABLED: 'market-data-widget',
  PREMIUM_FEATURES_ENABLED: 'premium-features'
};

export const INDIAN_MARKET_CONFIG = {
  EXCHANGES: {
    NSE: {
      name: 'National Stock Exchange',
      code: 'NSE',
      timezone: 'Asia/Kolkata',
      tradingHours: {
        start: '09:15',
        end: '15:30'
      }
    },
    BSE: {
      name: 'Bombay Stock Exchange',
      code: 'BSE',
      timezone: 'Asia/Kolkata',
      tradingHours: {
        start: '09:15',
        end: '15:30'
      }
    }
  },
  INDICES: {
    NIFTY50: {
      symbol: 'NIFTY50',
      name: 'Nifty 50',
      exchange: 'NSE'
    },
    SENSEX: {
      symbol: 'SENSEX',
      name: 'BSE Sensex',
      exchange: 'BSE'
    },
    BANKNIFTY: {
      symbol: 'BANKNIFTY',
      name: 'Bank Nifty',
      exchange: 'NSE'
    }
  },
  MARKET_STATUS: {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    PRE_OPEN: 'PRE_OPEN',
    POST_CLOSE: 'POST_CLOSE'
  }
};

export const ACCESSIBILITY = {
  ARIA_LABELS: {
    NAVIGATION: 'Main navigation',
    SEARCH: 'Search transactions',
    FILTER: 'Filter options',
    SORT: 'Sort options',
    PAGINATION: 'Pagination navigation',
    MODAL: 'Dialog',
    NOTIFICATION: 'Notification',
    LOADING: 'Loading content'
  },
  KEYBOARD_SHORTCUTS: {
    SEARCH: 'Ctrl+K',
    HELP: 'Ctrl+H',
    PERFORMANCE_MONITOR: 'Ctrl+Shift+P',
    NAVIGATION: {
      DASHBOARD: 'Alt+D',
      TRANSACTIONS: 'Alt+T',
      TRADE_JOURNAL: 'Alt+J',
      ANALYTICS: 'Alt+A'
    }
  }
};

export default {
  APP_CONFIG,
  API_ENDPOINTS,
  UI_CONSTANTS,
  BUSINESS_RULES,
  ERROR_CODES,
  FEATURE_FLAGS,
  INDIAN_MARKET_CONFIG,
  ACCESSIBILITY
};
