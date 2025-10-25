/**
 * Analytics Routes V2 - Production Grade
 * Clean, modular routing with proper middleware
 */

const express = require('express');
const { authMiddleware } = require('../middleware/index');
const analyticsController = require('../controllers/AnalyticsController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/analytics/comprehensive
 * @desc    Get comprehensive analytics (all data in one call)
 * @access  Private
 * @query   timeRange: week|month|quarter|year|all (default: month)
 */
router.get('/comprehensive', analyticsController.getComprehensiveAnalytics);

/**
 * @route   GET /api/v1/analytics/overview
 * @desc    Get analytics overview (alias for comprehensive - backward compatibility)
 * @access  Private
 * @query   timeRange: week|month|quarter|year|all (default: month)
 */
router.get('/overview', analyticsController.getComprehensiveAnalytics);

/**
 * @route   GET /api/v1/analytics/summary
 * @desc    Get summary statistics only (lightweight)
 * @access  Private
 * @query   timeRange: week|month|quarter|year (default: month)
 */
router.get('/summary', analyticsController.getSummary);

/**
 * @route   GET /api/v1/analytics/trends
 * @desc    Get monthly trends
 * @access  Private
 * @query   months: number of months (default: 6)
 */
router.get('/trends', analyticsController.getTrends);

/**
 * @route   GET /api/v1/analytics/insights
 * @desc    Get AI-powered insights
 * @access  Private
 * @query   timeRange: week|month|quarter|year (default: month)
 */
router.get('/insights', analyticsController.getInsights);

/**
 * @route   POST /api/v1/analytics/clear-cache
 * @desc    Clear analytics cache for current user
 * @access  Private
 */
router.post('/clear-cache', analyticsController.clearCache);

/**
 * @route   GET /api/v1/analytics/health
 * @desc    Health check for analytics service
 * @access  Private
 */
router.get('/health', analyticsController.healthCheck);

module.exports = router;
