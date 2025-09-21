// Global App State Manager - Single Source of Truth
import { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  user: null,
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  loading: false,
  memoryStats: { used: 0, trend: 'stable' }
};

// Action types
const ACTIONS = {
  SET_USER: 'SET_USER',
  SET_SOCKET: 'SET_SOCKET',
  SET_CONNECTION: 'SET_CONNECTION',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  MARK_ALL_NOTIFICATIONS_READ: 'MARK_ALL_NOTIFICATIONS_READ',
  SET_LOADING: 'SET_LOADING',
  UPDATE_MEMORY_STATS: 'UPDATE_MEMORY_STATS'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    case ACTIONS.SET_SOCKET:
      return { ...state, socket: action.payload };
    case ACTIONS.SET_CONNECTION:
      return { ...state, isConnected: action.payload };
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n._id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case ACTIONS.MARK_ALL_NOTIFICATIONS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.UPDATE_MEMORY_STATS:
      return { ...state, memoryStats: action.payload };
    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Memory monitoring (very lightweight)
  useEffect(() => {
    const checkMemory = () => {
      if (performance.memory) {
        const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
        dispatch({
          type: ACTIONS.UPDATE_MEMORY_STATS,
          payload: {
            used,
            trend: used > 200 ? 'high' : 'stable'
          }
        });
      }
    };

    // Check memory every 60 seconds (not every 10 like before)
    const interval = setInterval(checkMemory, 60000);
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, []);

  // Actions
  const actions = {
    setUser: (user) => dispatch({ type: ACTIONS.SET_USER, payload: user }),
    setSocket: (socket) => dispatch({ type: ACTIONS.SET_SOCKET, payload: socket }),
    setConnection: (connected) => dispatch({ type: ACTIONS.SET_CONNECTION, payload: connected }),
    addNotification: (notification) => dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification }),
    markNotificationRead: (id) => dispatch({ type: ACTIONS.MARK_NOTIFICATION_READ, payload: id }),
    markAllNotificationsRead: () => dispatch({ type: ACTIONS.MARK_ALL_NOTIFICATIONS_READ }),
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading })
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use app state
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Global socket manager (singleton)
class GlobalSocketManager {
  constructor() {
    this.socket = null;
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  init(userId) {
    if (this.isInitialized) return;

    console.log('🌐 Initializing global socket manager for user:', userId);
    this.isInitialized = true;

    // This will be handled by the GlobalSocketConnection component
    // We just ensure we don't create multiple connections
  }

  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isInitialized = false;
    this.eventListeners.clear();
  }
}

export const globalSocketManager = new GlobalSocketManager();
