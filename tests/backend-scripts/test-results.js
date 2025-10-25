const express = require('express').default || require('express');;
const fs = require('fs/promises').default || require('fs/promises');;
const path = require('path').default || require('path');;
const { fileURLToPath } = require('url');;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get the latest test results
router.get('/latest', async (req, res) => {
    try {
        // Look for the most recent test results file
        const files = await fs.readdir(__dirname + '/../../')
            .then(files => files.filter(file => file.startsWith('real-test-results-') && file.endsWith('.json'))
            .sort()
            .reverse());

        if (files.length === 0) {
            return res.status(404).json({
                error: 'No test results found',
                message: 'Run the performance test first: node real-performance-test.js'
            });
        }

        const latestFile = files[0];
        const filePath = path.join(__dirname, '../../', latestFile);
        const data = await fs.readFile(filePath, 'utf8');
        const testResults = JSON.parse(data);

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
router.get('/all', async (req, res) => {
    try {
        const files = await fs.readdir(__dirname + '/../../')
            .then(files => files.filter(file => file.startsWith('real-test-results-') && file.endsWith('.json'))
            .sort()
            .reverse());

        const results = await Promise.all(files.map(async file => {
            const filePath = path.join(__dirname, '../../', file);
            const data = await fs.readFile(filePath, 'utf8');
            const testResults = JSON.parse(data);
            return {
                filename: file,
                timestamp: testResults.metadata.timestamp,
                duration: testResults.metadata.duration,
                overallScore: testResults.finalMetrics ? 
                    Math.round((testResults.finalMetrics.uptime / 100) * 100) : 0
            };
        }));

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
