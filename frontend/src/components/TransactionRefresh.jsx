import { useEffect } from 'react';

/**
 * Simple component to trigger transaction updates after successful operations
 */
export const TransactionRefresh = ({ onTransactionComplete }) => {
  useEffect(() => {
    if (onTransactionComplete) {
      // Listen for successful transactions
      const handleTransactionSuccess = (event) => {
        console.log('Transaction completed, triggering refresh:', event.detail);
        
        // Dispatch custom event for immediate UI updates
        window.dispatchEvent(new CustomEvent('transactionUpdate', { 
          detail: event.detail 
        }));
        
        // Call callback if provided
        if (onTransactionComplete) {
          onTransactionComplete();
        }
      };

      window.addEventListener('transactionSuccess', handleTransactionSuccess);
      
      return () => {
        window.removeEventListener('transactionSuccess', handleTransactionSuccess);
      };
    }
  }, [onTransactionComplete]);

  return null; // This component doesn't render anything
};

export default TransactionRefresh;
