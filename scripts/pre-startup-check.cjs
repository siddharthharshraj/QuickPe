#!/usr/bin/env node

/**
 * Pre-Startup Check Script for QuickPe
 * Runs comprehensive verification before starting the application
 * Ensures all routes, connections, and dependencies are properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PreStartupChecker {
    constructor() {
        this.checks = [];
        this.errors = [];
        this.warnings = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            header: '\x1b[35m',
            reset: '\x1b[0m'
        };
        
        const timestamp = new Date().toLocaleTimeString();
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    addCheck(name, status, details = '') {
        this.checks.push({ name, status, details });
        if (status) {
            this.log(`✅ ${name}`, 'success');
        } else {
            this.log(`❌ ${name}`, 'error');
            this.errors.push(`${name}: ${details}`);
        }
    }

    addWarning(message) {
        this.warnings.push(message);
        this.log(`⚠️  ${message}`, 'warning');
    }

    checkFileExists(filePath, description) {
        const exists = fs.existsSync(filePath);
        this.addCheck(`${description} exists`, exists, exists ? '' : `File not found: ${filePath}`);
        return exists;
    }

    checkDirectoryStructure() {
        this.log('🔍 Checking Directory Structure...', 'header');
        
        const requiredDirs = [
            'backend',
            'frontend',
            'backend/controllers',
            'backend/services', 
            'backend/repositories',
            'backend/routes',
            'backend/models',
            'backend/middleware',
            'backend/config',
            'frontend/src',
            'frontend/src/components',
            'frontend/src/pages',
            'frontend/src/services',
            'scripts',
            'docs'
        ];

        requiredDirs.forEach(dir => {
            const dirPath = path.join(__dirname, '..', dir);
            this.addCheck(`Directory: ${dir}`, fs.existsSync(dirPath));
        });
    }

    checkBackendArchitecture() {
        this.log('🔍 Checking Backend Architecture...', 'header');
        
        // Check Controllers
        const controllers = [
            'backend/controllers/AuthController.js',
            'backend/controllers/TransactionController.js',
            'backend/controllers/UserController.js'
        ];

        controllers.forEach(controller => {
            this.checkFileExists(path.join(__dirname, '..', controller), `Controller: ${path.basename(controller)}`);
        });

        // Check Services
        const services = [
            'backend/services/AuthService.js',
            'backend/services/TransactionService.js',
            'backend/services/UserService.js',
            'backend/services/NotificationService.js'
        ];

        services.forEach(service => {
            this.checkFileExists(path.join(__dirname, '..', service), `Service: ${path.basename(service)}`);
        });

        // Check Repositories
        const repositories = [
            'backend/repositories/UserRepository.js',
            'backend/repositories/TransactionRepository.js',
            'backend/repositories/NotificationRepository.js',
            'backend/repositories/AuditRepository.js'
        ];

        repositories.forEach(repo => {
            this.checkFileExists(path.join(__dirname, '..', repo), `Repository: ${path.basename(repo)}`);
        });

        // Check Configuration
        this.checkFileExists(path.join(__dirname, '..', 'backend/config/database.js'), 'Database Configuration');
        this.checkFileExists(path.join(__dirname, '..', 'backend/middleware/validation.js'), 'Validation Middleware');
    }

    checkRouteConnections() {
        this.log('🔍 Checking Route Connections...', 'header');
        
        const serverPath = path.join(__dirname, '..', 'backend/server.js');
        if (this.checkFileExists(serverPath, 'Server.js')) {
            const serverContent = fs.readFileSync(serverPath, 'utf8');
            
            const requiredImports = [
                'userRoutes',
                'accountRoutes', 
                'authRoutes',
                'analyticsRoutes',
                'notificationRoutes',
                'auditRoutes'
            ];

            requiredImports.forEach(route => {
                const hasImport = serverContent.includes(route);
                this.addCheck(`Route Import: ${route}`, hasImport, hasImport ? '' : 'Missing route import in server.js');
            });

            // Check if routes are properly mounted
            const routeMounts = [
                'app.use(\'/user\'',
                'app.use(\'/account\'',
                'app.use(\'/auth\'',
                'app.use(\'/analytics\'',
                'app.use(\'/notifications\'',
                'app.use(\'/audit\''
            ];

            routeMounts.forEach(mount => {
                const hasMounting = serverContent.includes(mount);
                this.addCheck(`Route Mounting: ${mount}`, hasMounting, hasMounting ? '' : 'Route not properly mounted');
            });
        }
    }

    checkDependencyConnections() {
        this.log('🔍 Checking Dependency Connections...', 'header');
        
        // Check if services properly import repositories
        const serviceFiles = [
            { file: 'backend/services/AuthService.js', deps: ['UserRepository', 'AuditRepository'] },
            { file: 'backend/services/TransactionService.js', deps: ['TransactionRepository', 'UserRepository'] },
            { file: 'backend/services/UserService.js', deps: ['UserRepository', 'AuditRepository'] }
        ];

        serviceFiles.forEach(({ file, deps }) => {
            const filePath = path.join(__dirname, '..', file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                deps.forEach(dep => {
                    const hasDep = content.includes(dep);
                    this.addCheck(`${path.basename(file)} imports ${dep}`, hasDep);
                });
            }
        });

        // Check if controllers properly import services
        const controllerFiles = [
            { file: 'backend/controllers/AuthController.js', deps: ['AuthService'] },
            { file: 'backend/controllers/TransactionController.js', deps: ['TransactionService'] },
            { file: 'backend/controllers/UserController.js', deps: ['UserService'] }
        ];

        controllerFiles.forEach(({ file, deps }) => {
            const filePath = path.join(__dirname, '..', file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                deps.forEach(dep => {
                    const hasDep = content.includes(dep);
                    this.addCheck(`${path.basename(file)} imports ${dep}`, hasDep);
                });
            }
        });
    }

    checkEnvironmentConfiguration() {
        this.log('🔍 Checking Environment Configuration...', 'header');
        
        // Check backend .env
        const backendEnvPath = path.join(__dirname, '..', 'backend/.env');
        if (this.checkFileExists(backendEnvPath, 'Backend .env file')) {
            const envContent = fs.readFileSync(backendEnvPath, 'utf8');
            
            const requiredVars = [
                'MONGODB_URI',
                'JWT_SECRET',
                'PORT',
                'NODE_ENV'
            ];

            requiredVars.forEach(varName => {
                const hasVar = envContent.includes(varName);
                this.addCheck(`Environment Variable: ${varName}`, hasVar);
            });
        }

        // Check package.json files
        this.checkFileExists(path.join(__dirname, '..', 'backend/package.json'), 'Backend package.json');
        this.checkFileExists(path.join(__dirname, '..', 'frontend/package.json'), 'Frontend package.json');
        this.checkFileExists(path.join(__dirname, '..', 'package.json'), 'Root package.json');
    }

    checkFrontendConnections() {
        this.log('🔍 Checking Frontend Connections...', 'header');
        
        // Check API client
        const apiClientPath = path.join(__dirname, '..', 'frontend/src/services/api.js');
        if (this.checkFileExists(apiClientPath, 'Frontend API Client')) {
            const content = fs.readFileSync(apiClientPath, 'utf8');
            const hasCorrectPort = content.includes('5001');
            this.addCheck('API Client configured for port 5001', hasCorrectPort);
        }

        // Check socket client
        const socketPath = path.join(__dirname, '..', 'frontend/src/sockets/useSocket.js');
        if (this.checkFileExists(socketPath, 'Frontend Socket Client')) {
            const content = fs.readFileSync(socketPath, 'utf8');
            const hasCorrectPort = content.includes('5001');
            this.addCheck('Socket Client configured for port 5001', hasCorrectPort);
        }

        // Check protected routes
        this.checkFileExists(path.join(__dirname, '..', 'frontend/src/components/ProtectedRoute.jsx'), 'Protected Route Component');
    }

    checkDatabaseModels() {
        this.log('🔍 Checking Database Models...', 'header');
        
        const models = [
            'backend/models/User.js',
            'backend/models/Transaction.js',
            'backend/models/Notification.js',
            'backend/models/AuditLog.js'
        ];

        models.forEach(model => {
            const modelPath = path.join(__dirname, '..', model);
            if (this.checkFileExists(modelPath, `Model: ${path.basename(model)}`)) {
                const content = fs.readFileSync(modelPath, 'utf8');
                const hasSchema = content.includes('mongoose.Schema');
                const hasExport = content.includes('module.exports');
                
                this.addCheck(`${path.basename(model)} has Schema`, hasSchema);
                this.addCheck(`${path.basename(model)} has Export`, hasExport);
            }
        });
    }

    checkTestingFramework() {
        this.log('🔍 Checking Testing Framework...', 'header');
        
        this.checkFileExists(path.join(__dirname, '..', 'backend/tests/setup.js'), 'Test Setup');
        this.checkFileExists(path.join(__dirname, '..', 'backend/tests/services/AuthService.test.js'), 'AuthService Tests');
        
        // Check if Jest is configured
        const backendPackagePath = path.join(__dirname, '..', 'backend/package.json');
        if (fs.existsSync(backendPackagePath)) {
            const packageContent = fs.readFileSync(backendPackagePath, 'utf8');
            const hasJest = packageContent.includes('jest');
            this.addCheck('Jest testing framework configured', hasJest);
        }
    }

    checkNodeVersion() {
        this.log('🔍 Checking Node.js Version...', 'header');
        
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        const isValidVersion = majorVersion >= 18;
        
        this.addCheck(`Node.js version >= 18 (current: ${nodeVersion})`, isValidVersion);
    }

    checkMongoDBStatus() {
        this.log('🔍 Checking MongoDB Status...', 'header');
        
        try {
            execSync('pgrep mongod', { stdio: 'ignore' });
            this.addCheck('MongoDB process running', true);
        } catch (error) {
            this.addCheck('MongoDB process running', false, 'MongoDB is not running. Please start MongoDB service.');
        }
    }

    generateReport() {
        const duration = Date.now() - this.startTime;
        
        this.log('═'.repeat(80), 'header');
        this.log('📊 PRE-STARTUP CHECK REPORT', 'header');
        this.log('═'.repeat(80), 'header');
        
        const totalChecks = this.checks.length;
        const passedChecks = this.checks.filter(c => c.status).length;
        const failedChecks = totalChecks - passedChecks;
        
        this.log(`Total Checks: ${totalChecks}`, 'info');
        this.log(`Passed: ${passedChecks}`, 'success');
        this.log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'error' : 'success');
        this.log(`Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'success');
        this.log(`Duration: ${duration}ms`, 'info');
        
        if (this.errors.length > 0) {
            this.log('\n🚨 CRITICAL ISSUES:', 'error');
            this.errors.forEach(error => this.log(`  • ${error}`, 'error'));
        }
        
        if (this.warnings.length > 0) {
            this.log('\n⚠️  WARNINGS:', 'warning');
            this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
        }
        
        this.log('═'.repeat(80), 'header');
        
        if (this.errors.length === 0) {
            this.log('🎉 All critical checks passed! QuickPe is ready to start.', 'success');
            this.log('📋 Check STARTUP_CHECKLIST.md for complete startup instructions.', 'info');
            return true;
        } else {
            this.log('❌ Critical issues found. Please fix before starting.', 'error');
            this.log('📋 See STARTUP_CHECKLIST.md for troubleshooting guide.', 'warning');
            return false;
        }
    }

    async runAllChecks() {
        this.log('🚀 Starting QuickPe Pre-Startup Check...', 'header');
        this.log('═'.repeat(80), 'header');
        
        this.checkNodeVersion();
        this.checkMongoDBStatus();
        this.checkDirectoryStructure();
        this.checkBackendArchitecture();
        this.checkRouteConnections();
        this.checkDependencyConnections();
        this.checkEnvironmentConfiguration();
        this.checkFrontendConnections();
        this.checkDatabaseModels();
        this.checkTestingFramework();
        
        const success = this.generateReport();
        process.exit(success ? 0 : 1);
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new PreStartupChecker();
    checker.runAllChecks().catch(error => {
        console.error('Pre-startup check failed:', error);
        process.exit(1);
    });
}

module.exports = PreStartupChecker;
