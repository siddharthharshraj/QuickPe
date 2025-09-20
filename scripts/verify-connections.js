#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ConnectionVerifier {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.connections = {
            routes: [],
            services: [],
            repositories: [],
            controllers: []
        };
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        console.log(`${colors[type]}${message}${colors.reset}`);
    }

    async verifyBackendConnections() {
        this.log('🔍 Verifying Backend Connections...', 'info');
        
        // Check if all required files exist
        const requiredFiles = [
            'backend/server.js',
            'backend/config/database.js',
            'backend/controllers/AuthController.js',
            'backend/controllers/TransactionController.js',
            'backend/controllers/UserController.js',
            'backend/services/AuthService.js',
            'backend/services/TransactionService.js',
            'backend/services/UserService.js',
            'backend/services/NotificationService.js',
            'backend/repositories/UserRepository.js',
            'backend/repositories/TransactionRepository.js',
            'backend/repositories/NotificationRepository.js',
            'backend/repositories/AuditRepository.js'
        ];

        requiredFiles.forEach(file => {
            const filePath = path.join(__dirname, '..', file);
            if (!fs.existsSync(filePath)) {
                this.issues.push(`Missing file: ${file}`);
            } else {
                this.log(`✅ Found: ${file}`, 'success');
            }
        });

        // Verify route connections
        await this.verifyRouteConnections();
        
        // Verify service dependencies
        await this.verifyServiceDependencies();
        
        // Verify repository connections
        await this.verifyRepositoryConnections();
    }

    async verifyRouteConnections() {
        this.log('🔍 Verifying Route Connections...', 'info');
        
        const routesDir = path.join(__dirname, '..', 'backend', 'routes');
        if (!fs.existsSync(routesDir)) {
            this.issues.push('Routes directory not found');
            return;
        }

        const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
        
        routeFiles.forEach(file => {
            const filePath = path.join(routesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if routes are properly exported
            if (!content.includes('module.exports')) {
                this.issues.push(`Route file ${file} missing module.exports`);
            }
            
            // Check if express router is used
            if (!content.includes('express.Router()')) {
                this.warnings.push(`Route file ${file} might not be using express.Router()`);
            }
            
            this.log(`✅ Route file: ${file}`, 'success');
        });

        // Verify server.js includes all routes
        const serverPath = path.join(__dirname, '..', 'backend', 'server.js');
        if (fs.existsSync(serverPath)) {
            const serverContent = fs.readFileSync(serverPath, 'utf8');
            
            const expectedRoutes = [
                'userRoutes',
                'accountRoutes',
                'authRoutes',
                'analyticsRoutes',
                'notificationRoutes',
                'auditRoutes'
            ];

            expectedRoutes.forEach(route => {
                if (!serverContent.includes(route)) {
                    this.warnings.push(`Server.js might be missing ${route} import`);
                }
            });
        }
    }

    async verifyServiceDependencies() {
        this.log('🔍 Verifying Service Dependencies...', 'info');
        
        const servicesDir = path.join(__dirname, '..', 'backend', 'services');
        if (!fs.existsSync(servicesDir)) {
            this.issues.push('Services directory not found');
            return;
        }

        const serviceFiles = fs.readdirSync(servicesDir).filter(file => file.endsWith('.js'));
        
        serviceFiles.forEach(file => {
            const filePath = path.join(servicesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if services have proper repository imports
            if (file.includes('Auth') && !content.includes('UserRepository')) {
                this.warnings.push(`${file} might be missing UserRepository import`);
            }
            
            if (file.includes('Transaction') && !content.includes('TransactionRepository')) {
                this.warnings.push(`${file} might be missing TransactionRepository import`);
            }
            
            // Check if services are properly exported as classes
            if (!content.includes('class ') || !content.includes('module.exports')) {
                this.issues.push(`Service ${file} should export a class`);
            }
            
            this.log(`✅ Service file: ${file}`, 'success');
        });
    }

    async verifyRepositoryConnections() {
        this.log('🔍 Verifying Repository Connections...', 'info');
        
        const repositoriesDir = path.join(__dirname, '..', 'backend', 'repositories');
        if (!fs.existsSync(repositoriesDir)) {
            this.issues.push('Repositories directory not found');
            return;
        }

        const repoFiles = fs.readdirSync(repositoriesDir).filter(file => file.endsWith('.js'));
        
        repoFiles.forEach(file => {
            const filePath = path.join(repositoriesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if repositories have proper model imports
            const modelName = file.replace('Repository.js', '');
            if (!content.includes(`require('../models/${modelName}')`)) {
                this.warnings.push(`${file} might be missing ${modelName} model import`);
            }
            
            // Check if repositories are properly exported as classes
            if (!content.includes('class ') || !content.includes('module.exports')) {
                this.issues.push(`Repository ${file} should export a class`);
            }
            
            this.log(`✅ Repository file: ${file}`, 'success');
        });
    }

    async verifyFrontendConnections() {
        this.log('🔍 Verifying Frontend Connections...', 'info');
        
        // Check API client configuration
        const apiClientPath = path.join(__dirname, '..', 'frontend', 'src', 'services', 'api.js');
        if (fs.existsSync(apiClientPath)) {
            const content = fs.readFileSync(apiClientPath, 'utf8');
            
            if (!content.includes('5001')) {
                this.warnings.push('API client might not be configured for port 5001');
            }
            
            this.log('✅ API client configuration found', 'success');
        } else {
            this.issues.push('Frontend API client not found');
        }

        // Check socket configuration
        const socketPath = path.join(__dirname, '..', 'frontend', 'src', 'sockets', 'useSocket.js');
        if (fs.existsSync(socketPath)) {
            const content = fs.readFileSync(socketPath, 'utf8');
            
            if (!content.includes('5001')) {
                this.warnings.push('Socket client might not be configured for port 5001');
            }
            
            this.log('✅ Socket client configuration found', 'success');
        } else {
            this.warnings.push('Frontend socket client not found');
        }

        // Check protected routes
        const protectedRoutePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'ProtectedRoute.jsx');
        if (fs.existsSync(protectedRoutePath)) {
            this.log('✅ Protected route component found', 'success');
        } else {
            this.issues.push('Protected route component not found');
        }
    }

    async verifyDatabaseModels() {
        this.log('🔍 Verifying Database Models...', 'info');
        
        const modelsDir = path.join(__dirname, '..', 'backend', 'models');
        if (!fs.existsSync(modelsDir)) {
            this.issues.push('Models directory not found');
            return;
        }

        const requiredModels = ['User.js', 'Transaction.js', 'Notification.js', 'AuditLog.js'];
        
        requiredModels.forEach(model => {
            const modelPath = path.join(modelsDir, model);
            if (!fs.existsSync(modelPath)) {
                this.issues.push(`Missing model: ${model}`);
            } else {
                const content = fs.readFileSync(modelPath, 'utf8');
                
                if (!content.includes('mongoose.Schema')) {
                    this.issues.push(`Model ${model} missing mongoose.Schema`);
                }
                
                if (!content.includes('module.exports')) {
                    this.issues.push(`Model ${model} missing module.exports`);
                }
                
                this.log(`✅ Model: ${model}`, 'success');
            }
        });
    }

    async verifyEnvironmentConfig() {
        this.log('🔍 Verifying Environment Configuration...', 'info');
        
        // Check backend .env
        const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
        if (fs.existsSync(backendEnvPath)) {
            const content = fs.readFileSync(backendEnvPath, 'utf8');
            
            const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
            requiredVars.forEach(varName => {
                if (!content.includes(varName)) {
                    this.warnings.push(`Backend .env missing ${varName}`);
                }
            });
            
            this.log('✅ Backend .env file found', 'success');
        } else {
            this.warnings.push('Backend .env file not found');
        }

        // Check frontend .env
        const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env');
        if (fs.existsSync(frontendEnvPath)) {
            this.log('✅ Frontend .env file found', 'success');
        } else {
            this.warnings.push('Frontend .env file not found');
        }
    }

    async runAllVerifications() {
        this.log('🚀 Starting Connection Verification...', 'info');
        this.log('=' .repeat(60), 'info');
        
        await this.verifyBackendConnections();
        await this.verifyFrontendConnections();
        await this.verifyDatabaseModels();
        await this.verifyEnvironmentConfig();
        
        this.generateReport();
    }

    generateReport() {
        this.log('=' .repeat(60), 'info');
        this.log('📊 CONNECTION VERIFICATION REPORT', 'info');
        this.log('=' .repeat(60), 'info');
        
        if (this.issues.length === 0 && this.warnings.length === 0) {
            this.log('🎉 All connections verified successfully!', 'success');
            this.log('✅ QuickPe architecture is properly connected.', 'success');
        } else {
            if (this.issues.length > 0) {
                this.log('\n🚨 CRITICAL ISSUES FOUND:', 'error');
                this.issues.forEach(issue => this.log(`  • ${issue}`, 'error'));
            }
            
            if (this.warnings.length > 0) {
                this.log('\n⚠️  WARNINGS:', 'warning');
                this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
            }
            
            this.log('\n📋 Please fix these issues before starting the application.', 'warning');
        }
        
        this.log('=' .repeat(60), 'info');
        
        process.exit(this.issues.length > 0 ? 1 : 0);
    }
}

// Run verification if called directly
if (require.main === module) {
    const verifier = new ConnectionVerifier();
    verifier.runAllVerifications().catch(error => {
        console.error('Connection verification failed:', error);
        process.exit(1);
    });
}

module.exports = ConnectionVerifier;
