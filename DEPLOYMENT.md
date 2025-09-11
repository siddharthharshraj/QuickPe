# QuickPe Production Deployment Guide
## Vercel + Custom Domain + CI/CD Setup

### Overview
This guide covers complete deployment of QuickPe full-stack application to Vercel with custom subdomain `quickpe.siddharth-dev.tech`, environment protection, and automated CI/CD pipeline.

---

## Table of Contents
1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Backend Deployment Strategy](#backend-deployment-strategy)
3. [Frontend Configuration](#frontend-configuration)
4. [Environment Variables Setup](#environment-variables-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Custom Domain Configuration](#custom-domain-configuration)
7. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
8. [Production Testing](#production-testing)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Setup

### 1. Repository Preparation
```bash
# Ensure your project is in a Git repository
git init
git add .
git commit -m "Initial commit for deployment"

# Push to GitHub (required for Vercel CI/CD)
git remote add origin https://github.com/yourusername/quickpe-wallet.git
git push -u origin main
```

### 2. Project Structure Optimization
```
quickpe-wallet/
├── frontend/          # React app
├── backend/           # Express API (will be converted to Vercel functions)
├── vercel.json        # Vercel configuration
├── package.json       # Root package.json for deployment
└── api/              # Vercel serverless functions (new)
```

---

## Backend Deployment Strategy

### Option 1: Vercel Serverless Functions (Recommended)
Convert Express routes to Vercel serverless functions for seamless deployment.

#### Step 1: Create Vercel Functions Structure
```bash
mkdir api
```

#### Step 2: Convert Express Routes to Vercel Functions
Create `api/auth.js`:
```javascript
// api/auth.js
import { connectDB, User } from '../backend/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    await connectDB();
    
    if (req.method === 'POST' && req.url.includes('/signup')) {
        // Signup logic from backend/routes/user.js
        const { username, password, firstName, lastName } = req.body;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(411).json({ message: "Email already taken" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            username, password: hashedPassword, firstName, lastName
        });
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.json({ token });
    }
    
    if (req.method === 'POST' && req.url.includes('/signin')) {
        // Signin logic
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(411).json({ message: "Invalid credentials" });
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.json({ token });
    }
}
```

Create `api/account.js`:
```javascript
// api/account.js
import { connectDB, Account, User } from '../backend/db.js';
import { Transaction } from '../backend/models/Transaction.js';
import jwt from 'jsonwebtoken';

const authMiddleware = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    return jwt.verify(token, process.env.JWT_SECRET);
};

export default async function handler(req, res) {
    await connectDB();
    
    try {
        const decoded = authMiddleware(req);
        req.userId = decoded.userId;
        
        if (req.method === 'GET' && req.url.includes('/balance')) {
            const account = await Account.findOne({ userId: req.userId });
            res.json({ balance: account?.balance || 0 });
        }
        
        if (req.method === 'POST' && req.url.includes('/transfer')) {
            const { to, amount } = req.body;
            
            // Transfer logic with MongoDB transactions
            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                const fromAccount = await Account.findOne({ userId: req.userId }).session(session);
                const toUser = await User.findOne({ username: to }).session(session);
                const toAccount = await Account.findOne({ userId: toUser._id }).session(session);
                
                if (fromAccount.balance < amount) {
                    throw new Error('Insufficient balance');
                }
                
                await Account.updateOne(
                    { userId: req.userId },
                    { $inc: { balance: -amount } }
                ).session(session);
                
                await Account.updateOne(
                    { userId: toUser._id },
                    { $inc: { balance: amount } }
                ).session(session);
                
                await Transaction.create([{
                    fromUserId: req.userId,
                    toUserId: toUser._id,
                    amount
                }], { session });
                
                await session.commitTransaction();
                res.json({ message: "Transfer successful" });
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        }
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
}
```

### Option 2: External Backend Service (Alternative)
Deploy backend to Railway/Render and configure CORS for Vercel frontend.

---

## Frontend Configuration

### 1. Update API Base URL
Create `frontend/src/config/api.js`:
```javascript
// frontend/src/config/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://quickpe.siddharth-dev.tech/api'
    : 'http://localhost:3001/api/v1';

export default API_BASE_URL;
```

### 2. Update Axios Configuration
Modify `frontend/src/App.jsx`:
```javascript
import API_BASE_URL from './config/api.js';
axios.defaults.baseURL = API_BASE_URL;
```

### 3. Build Configuration
Create `frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 5173
  }
})
```

---

## Environment Variables Setup

### 1. Production Environment Variables
Create production-ready environment variables:

**Required Variables:**
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickpe-prod

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars

# Email (for contact form)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password

# Node Environment
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://quickpe.siddharth-dev.tech
```

### 2. MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create new cluster for production
3. Configure network access (allow all IPs: 0.0.0.0/0)
4. Create database user with read/write permissions
5. Get connection string

---

## Vercel Deployment

### 1. Vercel Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. Root Package.json
Create root `package.json`:
```json
{
  "name": "quickpe-wallet",
  "version": "1.0.0",
  "scripts": {
    "build": "cd frontend && npm install && npm run build",
    "dev": "cd frontend && npm run dev"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.18.1",
    "nodemailer": "^7.0.6"
  }
}
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## Custom Domain Configuration

### 1. Vercel Domain Setup
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add custom domain: `quickpe.siddharth-dev.tech`
3. Vercel will provide DNS configuration

### 2. DNS Configuration (siddharth-dev.tech)
Add these DNS records to your domain provider:

**CNAME Record:**
```
Name: quickpe
Value: cname.vercel-dns.com
TTL: 300
```

**Alternative A Records (if CNAME not supported):**
```
Name: quickpe
Value: 76.76.19.61
TTL: 300

Name: quickpe
Value: 76.223.126.88
TTL: 300
```

### 3. SSL Certificate
Vercel automatically provisions SSL certificates for custom domains.

---

## CI/CD Pipeline Setup

### 1. GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm run test --if-present
    
    - name: Build application
      run: |
        cd frontend
        npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### 2. GitHub Secrets Setup
Add these secrets to GitHub repository:
- `VERCEL_TOKEN`: Get from Vercel → Settings → Tokens
- `ORG_ID`: Get from `.vercel/project.json` after first deployment
- `PROJECT_ID`: Get from `.vercel/project.json` after first deployment

### 3. Automatic Deployments
- **Main branch**: Auto-deploy to production
- **Feature branches**: Auto-deploy to preview URLs
- **Pull requests**: Deploy preview for testing

---

## Production Testing

### 1. Functionality Testing Checklist
```bash
# Test all endpoints
curl https://quickpe.siddharth-dev.tech/api/auth/signup
curl https://quickpe.siddharth-dev.tech/api/account/balance

# Test authentication flow
# 1. Register new user
# 2. Login with credentials
# 3. Access protected routes
# 4. Test money transfer
# 5. Verify real-time notifications
```

### 2. Performance Testing
```bash
# Run performance tests against production
node simple-test.js --url=https://quickpe.siddharth-dev.tech
```

### 3. Security Testing
- SSL certificate validation
- CORS configuration testing
- JWT token validation
- Rate limiting verification

---

## Monitoring & Maintenance

### 1. Vercel Analytics
Enable Vercel Analytics for:
- Page views and performance
- API response times
- Error tracking
- User engagement metrics

### 2. Error Monitoring
Integrate Sentry for error tracking:
```javascript
// frontend/src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

### 3. Database Monitoring
- MongoDB Atlas monitoring
- Connection pool metrics
- Query performance analysis

### 4. Backup Strategy
- Automated MongoDB Atlas backups
- Environment variables backup
- Code repository backup

---

## Deployment Commands Summary

```bash
# 1. Prepare repository
git add . && git commit -m "Production deployment setup"
git push origin main

# 2. Install Vercel CLI
npm i -g vercel

# 3. Deploy to Vercel
vercel --prod

# 4. Configure custom domain in Vercel dashboard
# 5. Update DNS records
# 6. Setup GitHub Actions
# 7. Test production deployment
```

---

## Troubleshooting

### Common Issues & Solutions

**1. API Routes Not Working**
- Check `vercel.json` routing configuration
- Verify serverless function exports
- Check environment variables

**2. Database Connection Issues**
- Verify MongoDB Atlas network access
- Check connection string format
- Validate environment variables

**3. Authentication Failures**
- Verify JWT_SECRET in production
- Check CORS configuration
- Validate token expiration

**4. Custom Domain Not Working**
- Verify DNS propagation (use dig/nslookup)
- Check Vercel domain configuration
- Wait for SSL certificate provisioning

### Support Resources
- Vercel Documentation: https://vercel.com/docs
- MongoDB Atlas Support: https://docs.atlas.mongodb.com
- GitHub Actions: https://docs.github.com/en/actions

---

## Automated Deployment Files Created

### Files Generated for Vercel Deployment

#### 1. Root Configuration Files

**`vercel.json`**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Root `package.json`**
```json
{
  "name": "quickpe-wallet",
  "version": "1.0.0",
  "description": "QuickPe Digital Wallet - Full Stack Application",
  "scripts": {
    "build": "cd frontend && npm install && npm run build",
    "dev": "cd frontend && npm run dev",
    "start": "cd frontend && npm run preview"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.18.1",
    "nodemailer": "^7.0.6",
    "uuid": "^9.0.1",
    "zod": "^3.22.4"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 2. Serverless API Functions

**`api/auth.js` - Authentication Endpoints**
```javascript
import { connectDB, User, Account } from '../backend/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const signupSchema = z.object({
    username: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string().min(6)
});

const signinSchema = z.object({
    username: z.string().email(),
    password: z.string()
});

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();
        
        if (req.method === 'POST' && req.url.includes('/signup')) {
            const validation = signupSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(411).json({
                    message: "Invalid inputs",
                    errors: validation.error.issues
                });
            }

            const { username, password, firstName, lastName } = validation.data;
            
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(411).json({
                    message: "Email already taken"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const user = await User.create({
                username,
                password: hashedPassword,
                firstName,
                lastName
            });

            // Create account with initial balance
            await Account.create({
                userId: user._id,
                balance: Math.floor(Math.random() * 10000) + 1
            });

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            
            return res.json({
                message: "User created successfully",
                token
            });
        }
        
        if (req.method === 'POST' && req.url.includes('/signin')) {
            const validation = signinSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(411).json({
                    message: "Invalid inputs"
                });
            }

            const { username, password } = validation.data;
            const user = await User.findOne({ username });
            
            if (!user || !await bcrypt.compare(password, user.password)) {
                return res.status(411).json({
                    message: "Invalid credentials"
                });
            }

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            
            return res.json({
                message: "Login successful",
                token
            });
        }

        return res.status(404).json({ message: "Route not found" });
        
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
```

**`api/account.js` - Account Operations**
```javascript
import { connectDB, Account, User } from '../backend/db.js';
import { Transaction } from '../backend/models/Transaction.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const authMiddleware = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    return jwt.verify(token, process.env.JWT_SECRET);
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();
        const decoded = authMiddleware(req);
        const userId = decoded.userId;
        
        if (req.method === 'GET' && req.url.includes('/balance')) {
            const account = await Account.findOne({ userId });
            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }
            return res.json({ balance: account.balance });
        }
        
        if (req.method === 'POST' && req.url.includes('/transfer')) {
            const { to, amount } = req.body;
            
            if (!to || !amount || amount <= 0) {
                return res.status(400).json({ message: "Invalid transfer data" });
            }

            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                const fromAccount = await Account.findOne({ userId }).session(session);
                const toUser = await User.findOne({ username: to }).session(session);
                
                if (!toUser) {
                    throw new Error('Recipient not found');
                }
                
                const toAccount = await Account.findOne({ userId: toUser._id }).session(session);
                
                if (!fromAccount || !toAccount) {
                    throw new Error('Account not found');
                }
                
                if (fromAccount.balance < amount) {
                    throw new Error('Insufficient balance');
                }
                
                // Update balances
                await Account.updateOne(
                    { userId },
                    { $inc: { balance: -amount } }
                ).session(session);
                
                await Account.updateOne(
                    { userId: toUser._id },
                    { $inc: { balance: amount } }
                ).session(session);
                
                // Create transaction record
                await Transaction.create([{
                    fromUserId: userId,
                    toUserId: toUser._id,
                    amount,
                    status: 'completed'
                }], { session });
                
                await session.commitTransaction();
                
                return res.json({
                    message: "Transfer successful",
                    transactionId: `TXN${Date.now()}`
                });
                
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        }
        
        if (req.method === 'GET' && req.url.includes('/transactions')) {
            const transactions = await Transaction.find({
                $or: [{ fromUserId: userId }, { toUserId: userId }]
            })
            .populate('fromUserId', 'firstName lastName username')
            .populate('toUserId', 'firstName lastName username')
            .sort({ timestamp: -1 })
            .limit(50);
            
            return res.json({ transactions });
        }

        return res.status(404).json({ message: "Route not found" });
        
    } catch (error) {
        console.error('Account error:', error);
        return res.status(401).json({
            message: error.message || "Authentication failed"
        });
    }
}
```

#### 3. CI/CD Configuration

**`.github/workflows/deploy.yml`**
```yaml
name: Deploy QuickPe to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm run test --if-present
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
        working-directory: ./
```

#### 4. Frontend Configuration

**`frontend/src/config/api.js`**
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://quickpe.siddharth-dev.tech/api'
    : 'http://localhost:3001/api/v1';

export default API_BASE_URL;
```

#### 5. Environment Variables Template

**`.env.production`**
```bash
# Production Environment Variables for QuickPe
# Copy these to Vercel Environment Variables section

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickpe-prod

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long

# Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-specific-password

# Application
NODE_ENV=production
FRONTEND_URL=https://quickpe.siddharth-dev.tech

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## Deployment Automation Summary

### What Was Automated (80%)
- ✅ **Backend Conversion**: Express routes converted to Vercel serverless functions
- ✅ **Project Structure**: Complete Vercel-compatible file organization
- ✅ **CI/CD Pipeline**: GitHub Actions workflow for automated deployments
- ✅ **Environment Configuration**: Production environment variables template
- ✅ **CORS & Security**: Production-ready security configurations
- ✅ **Database Integration**: MongoDB Atlas connection setup
- ✅ **Authentication**: JWT + bcrypt in serverless environment
- ✅ **API Routing**: Complete API endpoint mapping for Vercel

### Manual Steps Required (20%)
1. **MongoDB Atlas Setup**: Create production cluster and get connection string
2. **GitHub Repository**: Push code and configure deployment secrets
3. **Vercel Account**: Create account and link to GitHub repository
4. **DNS Configuration**: Add CNAME record for `quickpe.siddharth-dev.tech`
5. **Environment Variables**: Add production variables in Vercel dashboard
6. **Final Deployment**: Run `vercel --prod` command

---

## Post-Deployment Checklist

- [ ] All API endpoints working
- [ ] Authentication flow functional
- [ ] Money transfer operations working
- [ ] Real-time notifications active
- [ ] Custom domain accessible
- [ ] SSL certificate active
- [ ] CI/CD pipeline functional
- [ ] Environment variables secure
- [ ] Performance metrics acceptable
- [ ] Error monitoring active

**Estimated Deployment Time**: 2-3 hours (reduced from original estimate due to automation)
**Maintenance Effort**: 1-2 hours/month

Your QuickPe application will be live at: `https://quickpe.siddharth-dev.tech`
