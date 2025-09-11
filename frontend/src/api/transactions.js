import apiClient from './client';

const TransactionService = {
  /**
   * Get paginated transaction history
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Response data with transactions and pagination info
   */
  getTransactions: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(`/account/transactions`, {
        params: { page, limit },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transactions',
      };
    }
  },

  /**
   * Get details of a specific transaction
   * @param {string} transactionId - ID of the transaction
   * @returns {Promise<Object>} - Transaction details
   */
  getTransaction: async (transactionId) => {
    try {
      const response = await apiClient.get(`/account/transactions/${transactionId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transaction',
      };
    }
  },
};

export default TransactionService;
