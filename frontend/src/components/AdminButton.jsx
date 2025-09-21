import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Shield, UserCheck, Settings } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const AdminButton = ({ className = '' }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [isToggling, setIsToggling] = useState(false);
  
  const isAdmin = user?.featureFlags?.isAdmin || user?.isAdmin || false;
  
  const handleToggle = async () => {
    if (isToggling) return;
    
    // Only allow toggle if user has admin privileges
    if (!user?.isAdmin && !isAdmin) {
      alert('You do not have admin privileges');
      return;
    }
    
    setIsToggling(true);
    
    try {
      // Toggle admin mode in feature flags
      const updatedUser = {
        ...user,
        featureFlags: {
          ...user.featureFlags,
          isAdmin: !isAdmin,
          adminLevel: !isAdmin ? 3 : 0 // Enterprise level admin or none
        }
      };
      
      // Update context
      updateUser(updatedUser);
      
      // Optional: Call API to persist the change
      // await fetch('/api/user/toggle-admin', { method: 'POST' });
      
    } catch (error) {
      console.error('Error toggling admin mode:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Don't show button if user doesn't have admin privileges
  if (!user?.isAdmin && !user?.featureFlags?.isAdmin) {
    return null;
  }

  return (
    <motion.button
      className={`admin-toggle-btn relative inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${className}`}
      onClick={handleToggle}
      disabled={isToggling}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isAdmin ? "admin" : "user"}
      variants={{
        admin: { 
          backgroundColor: "#059669",
          color: "#ffffff",
          boxShadow: "0 0 20px rgba(5, 150, 105, 0.3)"
        },
        user: { 
          backgroundColor: "#f3f4f6", 
          color: "#374151",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        }
      }}
    >
      {/* Animated Icon */}
      <motion.div
        animate={{ 
          rotate: isToggling ? 360 : (isAdmin ? 180 : 0),
          scale: isToggling ? 0.8 : 1
        }}
        transition={{ 
          duration: isToggling ? 0.8 : 0.5,
          ease: "easeInOut"
        }}
        className="relative"
      >
        {isToggling ? (
          <Settings size={20} className="animate-spin" />
        ) : isAdmin ? (
          <Shield size={20} />
        ) : (
          <UserCheck size={20} />
        )}
      </motion.div>

      {/* Animated Text */}
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="hidden sm:inline"
      >
        {isToggling ? 'Switching...' : isAdmin ? 'Admin Mode' : 'User Mode'}
      </motion.span>

      {/* Mobile Text */}
      <span className="sm:hidden">
        {isToggling ? '...' : isAdmin ? 'Admin' : 'User'}
      </span>

      {/* Glow Effect for Admin Mode */}
      {isAdmin && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 opacity-20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Admin Level Indicator */}
      {isAdmin && user?.featureFlags?.adminLevel > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"
          title={`Admin Level ${user.featureFlags.adminLevel}`}
        />
      )}
    </motion.button>
  );
};

export default AdminButton;
