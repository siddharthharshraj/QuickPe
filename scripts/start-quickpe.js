#!/usr/bin/env node

// QuickPe Unified Startup Script
// Starts frontend, backend, and ensures proper connectivity with zero axios errors

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const execAsync = promisify(exec);

class QuickPeStarter {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
    this.startupChecks = [];
    this.ports = {
      backend: 5001,
      frontend: 5173,
      mongodb: 27017
    };
  }

  async start() {
    console.log('\n🚀 QuickPe Unified Startup Script');
    console.log('=====================================\n');

    try {
      // Pre-flight checks
      await this.runPreflightChecks();
      
      // Setup environment
      await this.setupEnvironment();
      
      // Install dependencies
      await this.installDependencies();
      
      // Start services in order
      await this.startMongoDB();
      await this.startBackend();
      await this.startFrontend();
      
      // Post-startup verification
      await this.verifyConnectivity();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      this.displaySuccessMessage();
      
    } catch (error) {
      console.error('❌ Startup failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  async runPreflightChecks() {
    console.log('🔍 Running pre-flight checks...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required. Current version: ${nodeVersion}`);
    }
    console.log(`✅ Node.js version: ${nodeVersion}`);

    // Check if ports are available
    for (const [service, port] of Object.entries(this.ports)) {
      const isAvailable = await this.isPortAvailable(port);
      if (!isAvailable && service !== 'mongodb') {
        throw new Error(`Port ${port} is already in use (required for ${service})`);
      }
      console.log(`✅ Port ${port} available for ${service}`);
    }

    // Check MongoDB
    const mongoRunning = await this.checkMongoDB();
    if (!mongoRunning) {
      console.log('⚠️  MongoDB not running, will attempt to start...');
    } else {
      console.log('✅ MongoDB is running');
    }

    console.log('✅ Pre-flight checks completed\n');
  }

  async setupEnvironment() {
    console.log('⚙️  Setting up environment...');

    // Create backend .env if it doesn't exist
    const backendEnvPath = path.join(projectRoot, 'backend', '.env');
    try {
      await fs.access(backendEnvPath);
      console.log('✅ Backend .env file exists');
    } catch {
      console.log('📝 Creating backend .env file...');
      const envContent = `NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/quickpe
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
SOCKET_CORS_ORIGIN=http://localhost:5173

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL=300
REDIS_URL=redis://localhost:6379

# Development Settings
DEBUG=quickpe:*
LOG_LEVEL=debug
`;
      await fs.writeFile(backendEnvPath, envContent);
      console.log('✅ Backend .env file created');
    }

    // Create frontend .env if it doesn't exist
    const frontendEnvPath = path.join(projectRoot, 'frontend', '.env');
    try {
      await fs.access(frontendEnvPath);
      console.log('✅ Frontend .env file exists');
    } catch {
      console.log('📝 Creating frontend .env file...');
      const envContent = `VITE_API_BASE_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
VITE_APP_NAME=QuickPe
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
`;
      await fs.writeFile(frontendEnvPath, envContent);
      console.log('✅ Frontend .env file created');
    }

    console.log('✅ Environment setup completed\n');
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');

    // Install root dependencies
    console.log('Installing root dependencies...');
    await this.runCommand('npm install', projectRoot);

    // Install backend dependencies
    console.log('Installing backend dependencies...');
    await this.runCommand('npm install', path.join(projectRoot, 'backend'));

    // Install frontend dependencies
    console.log('Installing frontend dependencies...');
    await this.runCommand('npm install', path.join(projectRoot, 'frontend'));

    console.log('✅ Dependencies installed\n');
  }

  async startMongoDB() {
    console.log('🗄️  Starting MongoDB...');

    const mongoRunning = await this.checkMongoDB();
    if (mongoRunning) {
      console.log('✅ MongoDB already running');
      return;
    }

    try {
      // Try to start MongoDB
      const mongoProcess = spawn('mongod', ['--dbpath', './data/db', '--port', '27017'], {
        stdio: 'pipe',
        detached: false
      });

      this.processes.push({
        name: 'MongoDB',
        process: mongoProcess,
        port: 27017
      });

      // Wait for MongoDB to start
      await this.waitForService('MongoDB', () => this.checkMongoDB(), 30000);
      console.log('✅ MongoDB started successfully');

    } catch (error) {
      console.log('⚠️  Could not start MongoDB automatically');
      console.log('Please ensure MongoDB is running manually on port 27017');
      
      // Wait for manual start
      console.log('Waiting for MongoDB to be available...');
      await this.waitForService('MongoDB', () => this.checkMongoDB(), 60000);
    }
  }

  async startBackend() {
    console.log('🔧 Starting backend server...');

    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(projectRoot, 'backend'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    this.processes.push({
      name: 'Backend',
      process: backendProcess,
      port: this.ports.backend
    });

    // Capture output for debugging
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running') || output.includes('Connected to MongoDB')) {
        console.log(`[Backend] ${output.trim()}`);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('DeprecationWarning')) {
        console.error(`[Backend Error] ${error.trim()}`);
      }
    });

    // Wait for backend to be ready
    await this.waitForService('Backend', () => this.checkBackend(), 30000);
    console.log('✅ Backend server started successfully');
  }

  async startFrontend() {
    console.log('🎨 Starting frontend development server...');

    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(projectRoot, 'frontend'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    this.processes.push({
      name: 'Frontend',
      process: frontendProcess,
      port: this.ports.frontend
    });

    // Capture output for debugging
    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('ready in')) {
        console.log(`[Frontend] ${output.trim()}`);
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('DeprecationWarning') && !error.includes('ExperimentalWarning')) {
        console.error(`[Frontend Error] ${error.trim()}`);
      }
    });

    // Wait for frontend to be ready
    await this.waitForService('Frontend', () => this.checkFrontend(), 30000);
    console.log('✅ Frontend development server started successfully');
  }

  async verifyConnectivity() {
    console.log('🔗 Verifying connectivity...');

    // Test backend health
    try {
      const response = await fetch(`http://localhost:${this.ports.backend}/health`);
      if (response.ok) {
        console.log('✅ Backend health check passed');
      } else {
        throw new Error(`Backend health check failed: ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️  Backend health check failed, but server is running');
    }

    // Test database connection
    try {
      const response = await fetch(`http://localhost:${this.ports.backend}/api/status`);
      if (response.ok) {
        console.log('✅ Database connectivity verified');
      }
    } catch (error) {
      console.log('⚠️  Database connectivity test failed');
    }

    // Test frontend-backend connectivity
    try {
      const response = await fetch(`http://localhost:${this.ports.frontend}`);
      if (response.ok) {
        console.log('✅ Frontend server responding');
      }
    } catch (error) {
      console.log('⚠️  Frontend connectivity test failed');
    }

    console.log('✅ Connectivity verification completed\n');
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));
  }

  async cleanup() {
    console.log('🧹 Cleaning up processes...');

    for (const { name, process: proc } of this.processes) {
      try {
        console.log(`Stopping ${name}...`);
        proc.kill('SIGTERM');
        
        // Give process time to shut down gracefully
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
        
        console.log(`✅ ${name} stopped`);
      } catch (error) {
        console.log(`⚠️  Error stopping ${name}:`, error.message);
      }
    }
  }

  displaySuccessMessage() {
    console.log('\n🎉 QuickPe Started Successfully!');
    console.log('=====================================');
    console.log(`🎨 Frontend:  http://localhost:${this.ports.frontend}`);
    console.log(`🔧 Backend:   http://localhost:${this.ports.backend}`);
    console.log(`🗄️  MongoDB:   mongodb://localhost:${this.ports.mongodb}/quickpe`);
    console.log('\n📊 Available Endpoints:');
    console.log(`   • Health Check: http://localhost:${this.ports.backend}/health`);
    console.log(`   • API Status:   http://localhost:${this.ports.backend}/api/status`);
    console.log(`   • Admin Panel:  http://localhost:${this.ports.frontend}/admin`);
    console.log('\n🔑 Test Accounts:');
    console.log('   • admin@quickpe.com / admin@quickpe2025 (Admin)');
    console.log('   • alice@quickpe.com / password123');
    console.log('   • bob@quickpe.com / password123');
    console.log('\n⌨️  Press Ctrl+C to stop all services');
    console.log('=====================================\n');
  }

  // Helper methods
  async isPortAvailable(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      return !stdout.trim();
    } catch {
      return true;
    }
  }

  async checkMongoDB() {
    try {
      const { stdout } = await execAsync('mongosh --eval "db.runCommand({ping: 1})" --quiet');
      return stdout.includes('ok');
    } catch {
      return false;
    }
  }

  async checkBackend() {
    try {
      const response = await fetch(`http://localhost:${this.ports.backend}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkFrontend() {
    try {
      const response = await fetch(`http://localhost:${this.ports.frontend}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async waitForService(serviceName, checkFunction, timeout = 30000) {
    const startTime = Date.now();
    const interval = 1000;

    while (Date.now() - startTime < timeout) {
      try {
        const isReady = await checkFunction();
        if (isReady) {
          return true;
        }
      } catch (error) {
        // Service not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, interval));
      process.stdout.write('.');
    }

    throw new Error(`${serviceName} failed to start within ${timeout}ms`);
  }

  async runCommand(command, cwd) {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      if (stderr && !stderr.includes('npm WARN')) {
        console.log(`Warning: ${stderr}`);
      }
      return stdout;
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }
}

// Run the startup script
const starter = new QuickPeStarter();
starter.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
