/**
 * Analytics Controller - Production Grade
 * Handles HTTP requests for analytics endpoints
 * Implements proper error handling, validation, and response formatting
 */

const analyticsService = require('../services/AnalyticsService');

class AnalyticsController {
  /**
   * Get comprehensive analytics
   * GET /api/v1/analytics/comprehensive
   */
  async getComprehensiveAnalytics(req, res) {
    try {
      const userId = req.userId;
      const { timeRange = 'month' } = req.query;

      // Validate time range
      const validTimeRanges = ['week', 'month', 'quarter', 'year', 'all'];
      if (!validTimeRanges.includes(timeRange)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time range. Must be one of: week, month, quarter, year, all'
        });
      }

      console.log('Fetching comprehensive analytics', { userId, timeRange });

      const analytics = await analyticsService.getComprehensiveAnalytics(userId, timeRange);

      res.status(200).json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to fetch comprehensive analytics', {
        userId: req.userId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get summary only (lightweight)
   * GET /api/v1/analytics/summary
   */
  async getSummary(req, res) {
    try {
      const userId = req.userId;
      const { timeRange = 'month' } = req.query;

      const analytics = await analyticsService.getComprehensiveAnalytics(userId, timeRange);

      res.status(200).json({
        success: true,
        data: {
          user: analytics.user,
          summary: analytics.summary,
          metadata: analytics.metadata
        }
      });
    } catch (error) {
      console.error('Failed to fetch summary', {
        userId: req.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch summary data'
      });
    }
  }

  /**
   * Get trends only
   * GET /api/v1/analytics/trends
   */
  async getTrends(req, res) {
    try {
      const userId = req.userId;
      const { months = 6 } = req.query;

      const trends = await analyticsService.computeTrends(userId, parseInt(months));

      res.status(200).json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Failed to fetch trends', {
        userId: req.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch trends data'
      });
    }
  }

  /**
   * Get insights only
   * GET /api/v1/analytics/insights
   */
  async getInsights(req, res) {
    try {
      const userId = req.userId;
      const { timeRange = 'month' } = req.query;

      const analytics = await analyticsService.getComprehensiveAnalytics(userId, timeRange);

      res.status(200).json({
        success: true,
        data: analytics.insights
      });
    } catch (error) {
      console.error('Failed to fetch insights', {
        userId: req.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch insights'
      });
    }
  }

  /**
   * Clear analytics cache for user
   * POST /api/v1/analytics/clear-cache
   */
  async clearCache(req, res) {
    try {
      const userId = req.userId;

      analyticsService.clearCache(userId);

      console.log('Analytics cache cleared', { userId });

      res.status(200).json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Failed to clear cache', {
        userId: req.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to clear cache'
      });
    }
  }

  /**
   * Health check for analytics service
   * GET /api/v1/analytics/health
   */
  async healthCheck(req, res) {
    try {
      res.status(200).json({
        success: true,
        service: 'analytics',
        status: 'healthy',
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        service: 'analytics',
        status: 'unhealthy',
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();
