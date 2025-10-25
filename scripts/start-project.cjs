#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting QuickPe Project Setup...\n');

// Create backend .env file
const backendEnvContent = `# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/quickpe

# JWT Configuration
JWT_SECRET=quickpe-super-secret-jwt-key-2025-production-ready

# Server Configuration
PORT=5001
NODE_ENV=development

# Gmail Configuration for Contact Form
GMAIL_USER=contact@siddharth-dev.tech
GMAIL_APP_PASSWORD=kzzbgfbuqrdqutmq

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
`;

const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');

try {
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('✅ Created backend/.env file');
} catch (error) {
    console.log('⚠️  Backend .env file already exists or error creating it');
}

// Function to run command and return promise
function runCommand(command, args, cwd, description) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔄 ${description}...`);
        const process = spawn(command, args, { 
            cwd, 
            stdio: 'inherit',
            shell: true 
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${description} completed`);
                resolve();
            } else {
                console.log(`❌ ${description} failed with code ${code}`);
                reject(new Error(`${description} failed`));
            }
        });
    });
}

async function setupProject() {
    try {
        // Run connection verification first
        console.log('\n🔍 Running pre-startup verification...');
        await runCommand('node', ['scripts/verify-connections.cjs'], process.cwd(), 'Verifying connections');
        
        // Install backend dependencies
        await runCommand('npm', ['install'], path.join(__dirname, '..', 'backend'), 'Installing backend dependencies');
        
        // Install frontend dependencies
        await runCommand('npm', ['install'], path.join(__dirname, '..', 'frontend'), 'Installing frontend dependencies');
        
        // Reset admin password
        await runCommand('node', ['scripts/resetAdminPassword.js'], path.join(__dirname, '..', 'backend'), 'Resetting admin password');
        
        console.log('\n🎉 Project setup completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Start MongoDB: mongod');
        console.log('2. Start backend: cd backend && npm run dev');
        console.log('3. Start frontend: cd frontend && npm run dev');
        console.log('\n🔐 Admin Login Credentials:');
        console.log('   Email: admin@quickpe.com');
        console.log('   Password: admin@quickpe2025');
        console.log('\n🌐 URLs:');
        console.log('   Frontend: http://localhost:5173');
        console.log('   Backend: http://localhost:5001');
        console.log('   Admin Dashboard: http://localhost:5173/admin');
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setupProject();
