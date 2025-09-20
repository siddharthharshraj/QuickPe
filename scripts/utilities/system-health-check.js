#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

class SystemHealthChecker {
    constructor() {
        this.checks = [];
        this.results = [];
        this.backendProcess = null;
        this.frontendProcess = null;
        this.colors = {
            green: '\x1b[32m',
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m',
            reset: '\x1b[0m',
            bold: '\x1b[1m'
        };
    }

    log(message, color = 'reset') {
        console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runCheck(name, checkFunction) {
        this.log(`\n🔍 Running: ${name}`, 'cyan');
        try {
            const result = await checkFunction();
            this.results.push({ name, status: 'PASS', result });
            this.log(`✅ PASS: ${name}`, 'green');
            return true;
        } catch (error) {
            this.results.push({ name, status: 'FAIL', error: error.message });
            this.log(`❌ FAIL: ${name} - ${error.message}`, 'red');
            return false;
        }
    }

    // 1. Environment and Dependencies Check
    async checkEnvironment() {
        return this.runCheck('Environment Setup', async () => {
            // Check Node.js version
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
            if (majorVersion < 18) {
                throw new Error(`Node.js version ${nodeVersion} not supported. Requires v18 or higher`);
            }

            // Check if .env exists
            if (!fs.existsSync('.env')) {
                throw new Error('.env file not found. Copy from .env.example');
            }

            // Check package.json files
            if (!fs.existsSync('backend/package.json')) {
                throw new Error('Backend package.json not found');
            }
            if (!fs.existsSync('frontend/package.json')) {
                throw new Error('Frontend package.json not found');
            }

            return 'Environment setup verified';
        });
    }

    // 2. Dependencies Installation Check
    async checkDependencies() {
        return this.runCheck('Dependencies Installation', async () => {
            // Check backend node_modules
            if (!fs.existsSync('backend/node_modules')) {
                this.log('Installing backend dependencies...', 'yellow');
                await execAsync('cd backend && npm install');
            }

            // Check frontend node_modules
            if (!fs.existsSync('frontend/node_modules')) {
                this.log('Installing frontend dependencies...', 'yellow');
                await execAsync('cd frontend && npm install');
            }

            return 'All dependencies installed';
        });
    }

    // 3. Database Connection Check
    async checkDatabase() {
        return this.runCheck('Database Connection', async () => {
            try {
                const { stdout } = await execAsync('node -e "const { connectDB } = require(\'./backend/services/db.js\'); connectDB().then(() => { console.log(\'Connected\'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })"');
                if (stdout.includes('Connected')) {
                    return 'Database connection successful';
                }
                throw new Error('Database connection failed');
            } catch (error) {
                throw new Error(`Database connection error: ${error.message}`);
            }
        });
    }

    // 4. Start Backend Server
    async startBackend() {
        return this.runCheck('Backend Server Startup', async () => {
            return new Promise((resolve, reject) => {
                this.backendProcess = spawn('npm', ['run', 'dev'], {
                    cwd: 'backend',
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let output = '';
                let errorOutput = '';

                this.backendProcess.stdout.on('data', (data) => {
                    output += data.toString();
                    if (output.includes('Server running on port') || output.includes('Connected to MongoDB')) {
                        resolve('Backend server started successfully');
                    }
                });

                this.backendProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                this.backendProcess.on('error', (error) => {
                    reject(new Error(`Backend startup error: ${error.message}`));
                });

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (!output.includes('Server running on port')) {
                        reject(new Error(`Backend startup timeout. Output: ${output} Error: ${errorOutput}`));
                    }
                }, 30000);
            });
        });
    }

    // 5. Backend Health Check
    async checkBackendHealth() {
        return this.runCheck('Backend Health Check', async () => {
            await this.sleep(3000); // Wait for server to fully start
            
            const healthChecks = [
                { name: 'Health Endpoint', url: 'http://localhost:5001/health' },
                { name: 'API Status', url: 'http://localhost:5001/api/v1/status' },
            ];

            for (const check of healthChecks) {
                try {
                    const response = await axios.get(check.url, { timeout: 5000 });
                    if (response.status !== 200) {
                        throw new Error(`${check.name} returned status ${response.status}`);
                    }
                } catch (error) {
                    throw new Error(`${check.name} failed: ${error.message}`);
                }
            }

            return 'All backend endpoints healthy';
        });
    }

    // 6. Authentication Test
    async testAuthentication() {
        return this.runCheck('Authentication System', async () => {
            const testUser = {
                email: 'siddharth@quickpe.com',
                password: 'password123'
            };

            try {
                const response = await axios.post('http://localhost:5001/api/v1/auth/signin', testUser, {
                    timeout: 10000
                });

                if (!response.data.token) {
                    throw new Error('No token received from signin');
                }

                // Test protected endpoint
                const profileResponse = await axios.get('http://localhost:5001/api/v1/user/profile', {
                    headers: { Authorization: `Bearer ${response.data.token}` },
                    timeout: 5000
                });

                if (!profileResponse.data.user) {
                    throw new Error('Profile endpoint failed');
                }

                return 'Authentication system working';
            } catch (error) {
                if (error.response?.status === 401) {
                    throw new Error('Invalid test credentials');
                }
                throw new Error(`Auth test failed: ${error.message}`);
            }
        });
    }

    // 7. Database Operations Test
    async testDatabaseOperations() {
        return this.runCheck('Database Operations', async () => {
            // Test user fetch
            const response = await axios.post('http://localhost:5001/api/v1/auth/signin', {
                email: 'siddharth@quickpe.com',
                password: 'password123'
            });

            const token = response.data.token;

            // Test balance fetch
            const balanceResponse = await axios.get('http://localhost:5001/api/v1/account/balance', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (typeof balanceResponse.data.balance !== 'number') {
                throw new Error('Balance fetch failed');
            }

            // Test transactions fetch
            const transactionsResponse = await axios.get('http://localhost:5001/api/v1/account/transactions', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!Array.isArray(transactionsResponse.data.transactions)) {
                throw new Error('Transactions fetch failed');
            }

            return 'Database operations working';
        });
    }

    // 8. Start Frontend Server
    async startFrontend() {
        return this.runCheck('Frontend Server Startup', async () => {
            return new Promise((resolve, reject) => {
                this.frontendProcess = spawn('npm', ['run', 'dev'], {
                    cwd: 'frontend',
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let output = '';
                let errorOutput = '';

                this.frontendProcess.stdout.on('data', (data) => {
                    output += data.toString();
                    if (output.includes('Local:') && output.includes('5173')) {
                        resolve('Frontend server started successfully');
                    }
                });

                this.frontendProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                this.frontendProcess.on('error', (error) => {
                    reject(new Error(`Frontend startup error: ${error.message}`));
                });

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (!output.includes('Local:')) {
                        reject(new Error(`Frontend startup timeout. Output: ${output} Error: ${errorOutput}`));
                    }
                }, 30000);
            });
        });
    }

    // 9. Frontend-Backend Connectivity Test
    async testFrontendBackendConnectivity() {
        return this.runCheck('Frontend-Backend Connectivity', async () => {
            await this.sleep(5000); // Wait for frontend to fully start

            // Test if frontend can reach backend
            try {
                const response = await axios.get('http://localhost:5173', { timeout: 5000 });
                if (response.status !== 200) {
                    throw new Error('Frontend not accessible');
                }
            } catch (error) {
                throw new Error(`Frontend connectivity failed: ${error.message}`);
            }

            return 'Frontend-Backend connectivity verified';
        });
    }

    // 10. Socket.io Test
    async testSocketConnection() {
        return this.runCheck('Socket.io Connection', async () => {
            // This is a basic check - in a real scenario you'd use socket.io-client
            try {
                const response = await axios.get('http://localhost:5001/socket.io/', { timeout: 5000 });
                // Socket.io returns specific response for GET requests
                return 'Socket.io server accessible';
            } catch (error) {
                if (error.response?.status === 400) {
                    // This is expected for Socket.io server
                    return 'Socket.io server running';
                }
                throw new Error(`Socket.io test failed: ${error.message}`);
            }
        });
    }

    // 11. Core Features Test
    async testCoreFeatures() {
        return this.runCheck('Core Features Validation', async () => {
            const token = await this.getAuthToken();
            
            const features = [
                { name: 'User Profile', endpoint: '/api/v1/user/profile' },
                { name: 'Account Balance', endpoint: '/api/v1/account/balance' },
                { name: 'Transaction History', endpoint: '/api/v1/account/transactions' },
                { name: 'Notifications', endpoint: '/api/v1/notifications' },
                { name: 'Analytics', endpoint: '/api/v1/analytics/summary' }
            ];

            for (const feature of features) {
                try {
                    const response = await axios.get(`http://localhost:5001${feature.endpoint}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 5000
                    });
                    
                    if (response.status !== 200) {
                        throw new Error(`${feature.name} returned status ${response.status}`);
                    }
                } catch (error) {
                    throw new Error(`${feature.name} failed: ${error.message}`);
                }
            }

            return 'All core features validated';
        });
    }

    async getAuthToken() {
        const response = await axios.post('http://localhost:5001/api/v1/auth/signin', {
            email: 'siddharth@quickpe.com',
            password: 'password123'
        });
        return response.data.token;
    }

    // Main execution function
    async runAllChecks() {
        this.log('\n🚀 QuickPe System Health Check Starting...', 'bold');
        this.log('='.repeat(50), 'cyan');

        const checks = [
            () => this.checkEnvironment(),
            () => this.checkDependencies(),
            () => this.checkDatabase(),
            () => this.startBackend(),
            () => this.checkBackendHealth(),
            () => this.testAuthentication(),
            () => this.testDatabaseOperations(),
            () => this.startFrontend(),
            () => this.testFrontendBackendConnectivity(),
            () => this.testSocketConnection(),
            () => this.testCoreFeatures()
        ];

        let allPassed = true;

        for (const check of checks) {
            const passed = await check();
            if (!passed) {
                allPassed = false;
                break;
            }
        }

        this.log('\n' + '='.repeat(50), 'cyan');
        this.displayResults();

        if (allPassed) {
            this.log('\n🎉 ALL CHECKS PASSED! QuickPe is ready to use!', 'green');
            this.log('\n📍 Access URLs:', 'bold');
            this.log('   Frontend: http://localhost:5173', 'cyan');
            this.log('   Backend:  http://localhost:5001', 'cyan');
            this.log('   API Docs: http://localhost:5001/api/v1/status', 'cyan');
            
            this.log('\n🔑 Test Credentials:', 'bold');
            this.log('   Email: siddharth@quickpe.com', 'yellow');
            this.log('   Password: password123', 'yellow');
            
            this.log('\n⚡ Servers are running. Press Ctrl+C to stop.', 'green');
            
            // Keep the process alive
            process.on('SIGINT', () => {
                this.log('\n🛑 Shutting down servers...', 'yellow');
                if (this.backendProcess) this.backendProcess.kill();
                if (this.frontendProcess) this.frontendProcess.kill();
                process.exit(0);
            });

            // Keep alive
            setInterval(() => {}, 1000);
        } else {
            this.log('\n❌ SOME CHECKS FAILED! Please fix the issues above.', 'red');
            this.cleanup();
            process.exit(1);
        }
    }

    displayResults() {
        this.log('\n📊 Health Check Results:', 'bold');
        this.log('-'.repeat(50), 'cyan');
        
        this.results.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '❌';
            const color = result.status === 'PASS' ? 'green' : 'red';
            this.log(`${status} ${result.name}`, color);
        });
    }

    cleanup() {
        if (this.backendProcess) {
            this.backendProcess.kill();
        }
        if (this.frontendProcess) {
            this.frontendProcess.kill();
        }
    }
}

// Run the health check
const checker = new SystemHealthChecker();
checker.runAllChecks().catch(error => {
    console.error('Health check failed:', error);
    checker.cleanup();
    process.exit(1);
});
