#!/usr/bin/env node

const mongoose = require('mongoose');
const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class StartupVerifier {
    constructor() {
        this.results = {
            environment: false,
            database: false,
            backend: false,
            frontend: false,
            integration: false
        };
        this.errors = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async verifyEnvironment() {
        this.log('🔍 Verifying Environment Setup...', 'info');
        
        try {
            // Check Node.js version
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
            
            if (majorVersion < 18) {
                throw new Error(`Node.js version ${nodeVersion} is too old. Requires >= 18.0.0`);
            }
            this.log(`✅ Node.js version: ${nodeVersion}`, 'success');

            // Check if MongoDB is running
            try {
                execSync('pgrep mongod', { stdio: 'ignore' });
                this.log('✅ MongoDB process is running', 'success');
            } catch (error) {
                throw new Error('MongoDB is not running. Please start MongoDB service.');
            }

            // Check environment files
            const backendEnvPath = path.join(__dirname, '../backend/.env');
            const frontendEnvPath = path.join(__dirname, '../frontend/.env');
            
            if (!fs.existsSync(backendEnvPath)) {
                this.log('⚠️  Backend .env file not found', 'warning');
            } else {
                this.log('✅ Backend .env file exists', 'success');
            }

            // Check package.json files
            const backendPackagePath = path.join(__dirname, '../backend/package.json');
            const frontendPackagePath = path.join(__dirname, '../frontend/package.json');
            
            if (!fs.existsSync(backendPackagePath)) {
                throw new Error('Backend package.json not found');
            }
            if (!fs.existsSync(frontendPackagePath)) {
                throw new Error('Frontend package.json not found');
            }
            
            this.log('✅ Package.json files exist', 'success');
            this.results.environment = true;
            
        } catch (error) {
            this.log(`❌ Environment check failed: ${error.message}`, 'error');
            this.errors.push(`Environment: ${error.message}`);
        }
    }

    async verifyDatabase() {
        this.log('🔍 Verifying Database Connection...', 'info');
        
        try {
            const connectionString = 'mongodb://localhost:27017/quickpe';
            await mongoose.connect(connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000
            });
            
            this.log('✅ Database connection successful', 'success');
            
            // Check collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            
            const requiredCollections = ['users', 'transactions', 'notifications', 'auditlogs'];
            const missingCollections = requiredCollections.filter(name => 
                !collectionNames.includes(name)
            );
            
            if (missingCollections.length > 0) {
                this.log(`⚠️  Missing collections: ${missingCollections.join(', ')}`, 'warning');
            } else {
                this.log('✅ All required collections exist', 'success');
            }
            
            // Check for test users
            const userCount = await mongoose.connection.db.collection('users').countDocuments();
            if (userCount === 0) {
                this.log('⚠️  No users found in database', 'warning');
            } else {
                this.log(`✅ Found ${userCount} users in database`, 'success');
            }
            
            await mongoose.disconnect();
            this.results.database = true;
            
        } catch (error) {
            this.log(`❌ Database check failed: ${error.message}`, 'error');
            this.errors.push(`Database: ${error.message}`);
        }
    }

    async verifyBackend() {
        this.log('🔍 Verifying Backend Services...', 'info');
        
        try {
            // Check if backend is running
            try {
                const response = await axios.get('http://localhost:5001/health', {
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    this.log('✅ Backend health check passed', 'success');
                    this.log(`✅ Backend response: ${JSON.stringify(response.data)}`, 'info');
                } else {
                    throw new Error(`Backend health check returned status ${response.status}`);
                }
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Backend server is not running on port 5001');
                }
                throw error;
            }
            
            // Test authentication endpoint
            try {
                const authResponse = await axios.post('http://localhost:5001/auth/verify', {}, {
                    headers: { 'Authorization': 'Bearer invalid-token' },
                    timeout: 5000
                });
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    this.log('✅ Authentication endpoint responding correctly', 'success');
                } else {
                    throw new Error('Authentication endpoint not responding properly');
                }
            }
            
            this.results.backend = true;
            
        } catch (error) {
            this.log(`❌ Backend check failed: ${error.message}`, 'error');
            this.errors.push(`Backend: ${error.message}`);
        }
    }

    async verifyFrontend() {
        this.log('🔍 Verifying Frontend Services...', 'info');
        
        try {
            // Check if frontend is running
            try {
                const response = await axios.get('http://localhost:5173', {
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    this.log('✅ Frontend server is running', 'success');
                } else {
                    throw new Error(`Frontend returned status ${response.status}`);
                }
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Frontend server is not running on port 5173');
                }
                throw error;
            }
            
            this.results.frontend = true;
            
        } catch (error) {
            this.log(`❌ Frontend check failed: ${error.message}`, 'error');
            this.errors.push(`Frontend: ${error.message}`);
        }
    }

    async verifyIntegration() {
        this.log('🔍 Verifying Integration...', 'info');
        
        try {
            // Test admin login
            const loginResponse = await axios.post('http://localhost:5001/auth/signin', {
                email: 'admin@quickpe.com',
                password: 'admin@quickpe2025'
            }, {
                timeout: 10000
            });
            
            if (loginResponse.data.success) {
                this.log('✅ Admin login successful', 'success');
                
                const token = loginResponse.data.data.token;
                
                // Test protected route
                const profileResponse = await axios.get('http://localhost:5001/auth/verify', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 5000
                });
                
                if (profileResponse.data.success) {
                    this.log('✅ Protected route access successful', 'success');
                } else {
                    throw new Error('Protected route access failed');
                }
                
            } else {
                throw new Error('Admin login failed');
            }
            
            this.results.integration = true;
            
        } catch (error) {
            this.log(`❌ Integration check failed: ${error.message}`, 'error');
            this.errors.push(`Integration: ${error.message}`);
        }
    }

    async runAllChecks() {
        this.log('🚀 Starting QuickPe Startup Verification...', 'info');
        this.log('=' .repeat(60), 'info');
        
        await this.verifyEnvironment();
        await this.verifyDatabase();
        await this.verifyBackend();
        await this.verifyFrontend();
        await this.verifyIntegration();
        
        this.generateReport();
    }

    generateReport() {
        this.log('=' .repeat(60), 'info');
        this.log('📊 VERIFICATION REPORT', 'info');
        this.log('=' .repeat(60), 'info');
        
        const checks = [
            { name: 'Environment Setup', status: this.results.environment },
            { name: 'Database Connection', status: this.results.database },
            { name: 'Backend Services', status: this.results.backend },
            { name: 'Frontend Services', status: this.results.frontend },
            { name: 'Integration Tests', status: this.results.integration }
        ];
        
        checks.forEach(check => {
            const status = check.status ? '✅ PASS' : '❌ FAIL';
            const color = check.status ? 'success' : 'error';
            this.log(`${check.name}: ${status}`, color);
        });
        
        const passedChecks = checks.filter(c => c.status).length;
        const totalChecks = checks.length;
        
        this.log('=' .repeat(60), 'info');
        this.log(`OVERALL RESULT: ${passedChecks}/${totalChecks} checks passed`, 
                 passedChecks === totalChecks ? 'success' : 'error');
        
        if (this.errors.length > 0) {
            this.log('\n🚨 ERRORS FOUND:', 'error');
            this.errors.forEach(error => this.log(`  • ${error}`, 'error'));
            this.log('\n📋 Please check the STARTUP_CHECKLIST.md for solutions.', 'warning');
        } else {
            this.log('\n🎉 All checks passed! QuickPe is ready to use.', 'success');
        }
        
        process.exit(this.errors.length > 0 ? 1 : 0);
    }
}

// Run verification if called directly
if (require.main === module) {
    const verifier = new StartupVerifier();
    verifier.runAllChecks().catch(error => {
        console.error('Verification failed:', error);
        process.exit(1);
    });
}

module.exports = StartupVerifier;
