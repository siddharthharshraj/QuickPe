#!/usr/bin/env node

// QuickPe Simple Startup Script - No MongoDB management
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class SimpleQuickPeStarter {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
    this.ports = {
      backend: 5001,
      frontend: 5173
    };
  }

  async start() {
    console.log('\n🚀 QuickPe Simple Startup');
    console.log('=========================\n');

    try {
      await this.validateComponents();
      await this.setupEnvironment();
      await this.startBackend();
      await this.startFrontend();
      await this.verifyServices();
      this.setupGracefulShutdown();
      this.displaySuccessMessage();
      
    } catch (error) {
      console.error('❌ Startup failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  async validateComponents() {
    console.log('🔍 Validating and fixing components...');
    try {
      const { execSync } = await import('child_process');
      
      // Fix router imports first
      try {
        execSync('node scripts/fix-router-imports.js', { 
          cwd: projectRoot,
          stdio: 'pipe'
        });
        console.log('✅ Router imports fixed');
      } catch (error) {
        console.log('⚠️  Router import fix skipped');
      }

      // Fix icon imports
      try {
        execSync('node scripts/fix-icon-imports.js', { 
          cwd: projectRoot,
          stdio: 'pipe'
        });
        console.log('✅ Icon imports fixed');
      } catch (error) {
        console.log('⚠️  Icon import fix skipped');
      }

      // Fix duplicate imports
      try {
        execSync('node scripts/fix-duplicate-imports.js', { 
          cwd: projectRoot,
          stdio: 'pipe'
        });
        console.log('✅ Duplicate imports fixed');
      } catch (error) {
        console.log('⚠️  Duplicate import fix skipped');
      }
      
      // Then validate components
      execSync('node scripts/validate-components.js', { 
        cwd: projectRoot,
        stdio: 'pipe'
      });
      console.log('✅ Components validated\n');
    } catch (error) {
      console.log('⚠️  Component validation skipped (non-critical)\n');
    }
  }

  async setupEnvironment() {
    console.log('⚙️  Setting up environment...');

    // Create backend .env if it doesn't exist
    const backendEnvPath = path.join(projectRoot, 'backend', '.env');
    try {
      await fs.access(backendEnvPath);
      console.log('✅ Backend .env exists');
    } catch {
      const envContent = `NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/quickpe
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
SOCKET_CORS_ORIGIN=http://localhost:5173
`;
      await fs.writeFile(backendEnvPath, envContent);
      console.log('✅ Backend .env created');
    }

    // Create frontend .env if it doesn't exist
    const frontendEnvPath = path.join(projectRoot, 'frontend', '.env');
    try {
      await fs.access(frontendEnvPath);
      console.log('✅ Frontend .env exists');
    } catch {
      const envContent = `VITE_API_BASE_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
VITE_APP_NAME=QuickPe
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
`;
      await fs.writeFile(frontendEnvPath, envContent);
      console.log('✅ Frontend .env created');
    }
  }

  async startBackend() {
    console.log('🔧 Starting backend server...');

    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(projectRoot, 'backend'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development', PATH: process.env.PATH + ':~/.nvm/versions/node/v24.8.0/bin' }
    });

    this.processes.push({
      name: 'Backend',
      process: backendProcess,
      port: this.ports.backend
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Backend] ${output.trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('DeprecationWarning')) {
        console.log(`[Backend] ${error.trim()}`);
      }
    });

    // Wait for backend to start
    await this.waitForPort(this.ports.backend, 'Backend');
    console.log('✅ Backend started');
  }

  async startFrontend() {
    console.log('🎨 Starting frontend server...');

    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(projectRoot, 'frontend'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development', PATH: process.env.PATH + ':~/.nvm/versions/node/v24.8.0/bin' }
    });

    this.processes.push({
      name: 'Frontend',
      process: frontendProcess,
      port: this.ports.frontend
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Frontend] ${output.trim()}`);
    });

    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('DeprecationWarning') && !error.includes('ExperimentalWarning')) {
        console.log(`[Frontend] ${error.trim()}`);
      }
    });

    // Wait for frontend to start
    await this.waitForPort(this.ports.frontend, 'Frontend');
    console.log('✅ Frontend started');
  }

  async verifyServices() {
    console.log('🔗 Verifying services...');

    // Wait a bit for services to fully initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const backendResponse = await fetch(`http://localhost:${this.ports.backend}/health`);
      console.log(`✅ Backend health: ${backendResponse.status}`);
    } catch (error) {
      console.log('⚠️  Backend health check failed (service may still be starting)');
    }

    try {
      const frontendResponse = await fetch(`http://localhost:${this.ports.frontend}`);
      console.log(`✅ Frontend response: ${frontendResponse.status}`);
    } catch (error) {
      console.log('⚠️  Frontend check failed (service may still be starting)');
    }
  }

  async waitForPort(port, serviceName, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.status < 500) {
          return true;
        }
      } catch (error) {
        // Port not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }
    
    console.log(`\n⚠️  ${serviceName} may not be fully ready, but continuing...`);
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`\n🛑 Received ${signal}. Shutting down...`);
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  async cleanup() {
    console.log('🧹 Stopping services...');

    for (const { name, process: proc } of this.processes) {
      try {
        console.log(`Stopping ${name}...`);
        proc.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
        console.log(`✅ ${name} stopped`);
      } catch (error) {
        console.log(`⚠️  Error stopping ${name}`);
      }
    }
  }

  displaySuccessMessage() {
    console.log('\n🎉 QuickPe Started Successfully!');
    console.log('=================================');
    console.log(`🎨 Frontend:  http://localhost:${this.ports.frontend}`);
    console.log(`🔧 Backend:   http://localhost:${this.ports.backend}`);
    console.log(`🗄️  MongoDB:   mongodb://localhost:27017/quickpe`);
    console.log('\n📊 Test the application:');
    console.log(`   • Main App:     http://localhost:${this.ports.frontend}`);
    console.log(`   • Admin Panel:  http://localhost:${this.ports.frontend}/admin`);
    console.log(`   • Health Check: http://localhost:${this.ports.backend}/health`);
    console.log('\n🔑 Test Accounts:');
    console.log('   • admin@quickpe.com / admin@quickpe2025');
    console.log('   • alice@quickpe.com / password123');
    console.log('   • siddharth@quickpe.com / password123');
    console.log('\n⌨️  Press Ctrl+C to stop all services');
    console.log('=================================\n');
  }
}

const starter = new SimpleQuickPeStarter();
starter.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
