const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Get the latest test results
router.get('/latest', (req, res) => {
    try {
        // Look for the most recent test results file
        const files = fs.readdirSync(__dirname + '/../../')
            .filter(file => file.startsWith('real-test-results-') && file.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length === 0) {
            return res.status(404).json({
                error: 'No test results found',
                message: 'Run the performance test first: node real-performance-test.js'
            });
        }

        const latestFile = files[0];
        const filePath = path.join(__dirname, '../../', latestFile);
        const testResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        res.json(testResults);
    } catch (error) {
        console.error('Error reading test results:', error);
        res.status(500).json({
            error: 'Failed to load test results',
            message: error.message
        });
    }
});

// Get all available test results
router.get('/all', (req, res) => {
    try {
        const files = fs.readdirSync(__dirname + '/../../')
            .filter(file => file.startsWith('real-test-results-') && file.endsWith('.json'))
            .sort()
            .reverse();

        const results = files.map(file => {
            const filePath = path.join(__dirname, '../../', file);
            const testResults = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return {
                filename: file,
                timestamp: testResults.metadata.timestamp,
                duration: testResults.metadata.duration,
                overallScore: testResults.finalMetrics ? 
                    Math.round((testResults.finalMetrics.uptime / 100) * 100) : 0
            };
        });

        res.json(results);
    } catch (error) {
        console.error('Error reading test results:', error);
        res.status(500).json({
            error: 'Failed to load test results',
            message: error.message
        });
    }
});

module.exports = router;
