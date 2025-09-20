# QuickPe Startup Checklist

## 🚀 Pre-Startup Verification Checklist

### 1. Environment Setup ✅
- [ ] **Node.js Version**: Ensure Node.js >= 18.0.0 is installed
- [ ] **MongoDB**: Verify MongoDB is running on localhost:27017
- [ ] **Environment Variables**: Check .env files exist and are properly configured
- [ ] **Dependencies**: All npm packages installed in both frontend and backend

### 2. Database Verification ✅
- [ ] **MongoDB Connection**: Database accessible at `mongodb://localhost:27017/quickpe`
- [ ] **Database Collections**: User, Transaction, Notification, AuditLog collections exist
- [ ] **Test Users**: Verify test users are available
- [ ] **Admin User**: admin@quickpe.com exists with proper permissions

### 3. Backend Services ✅
- [ ] **Port Availability**: Port 5001 is available for backend
- [ ] **Route Connections**: All API routes properly connected
- [ ] **Middleware**: Authentication, validation, error handling middleware active
- [ ] **Socket.io**: Real-time connection setup verified

### 4. Frontend Services ✅
- [ ] **Port Availability**: Port 5173 is available for frontend
- [ ] **API Client**: Frontend API client configured for port 5001
- [ ] **Socket Connection**: Socket.io client properly configured
- [ ] **Protected Routes**: Authentication routes working

### 5. Integration Testing ✅
- [ ] **Authentication Flow**: Login/logout working end-to-end
- [ ] **Real-time Features**: Socket.io events functioning
- [ ] **Database Operations**: CRUD operations working
- [ ] **File Uploads**: PDF generation and exports working

## 🔧 Automated Verification Scripts

### Quick Start Command
```bash
# Run comprehensive startup verification
npm run verify:startup
```

### Individual Verification Scripts
```bash
# Database connection and health
npm run verify:database

# API routes and endpoints
npm run verify:routes

# Real-time socket connections
npm run verify:sockets

# Authentication system
npm run verify:auth

# Full system integration
npm run verify:integration
```

## 📋 Manual Verification Steps

### Step 1: Database Check
```bash
# Check MongoDB status
mongosh --eval "db.runCommand('ping')"

# Verify QuickPe database
mongosh quickpe --eval "show collections"

# Check user count
mongosh quickpe --eval "db.users.countDocuments()"
```

### Step 2: Backend Health Check
```bash
# Start backend in development mode
cd backend && npm run dev

# Verify health endpoint
curl http://localhost:5001/health

# Test authentication endpoint
curl -X POST http://localhost:5001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@quickpe.com","password":"admin@quickpe2025"}'
```

### Step 3: Frontend Connection Test
```bash
# Start frontend in development mode
cd frontend && npm run dev

# Verify frontend loads at http://localhost:5173
# Test login functionality
# Verify dashboard loads with real data
```

### Step 4: Real-time Features Test
```bash
# Run real-time verification script
node scripts/utilities/test-dashboard-realtime.cjs

# Verify Socket.io connection in browser console
# Test money transfer notifications
# Check balance updates in real-time
```

## 🚨 Common Issues & Solutions

### Database Connection Issues
```bash
# Issue: MongoDB not running
# Solution: Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Issue: Database not found
# Solution: Run initialization script
node scripts/initialize-quickpe.js
```

### Port Conflicts
```bash
# Issue: Port 5001 in use
# Solution: Kill process using port
lsof -ti:5001 | xargs kill -9

# Issue: Port 5173 in use  
# Solution: Kill process using port
lsof -ti:5173 | xargs kill -9
```

### Authentication Issues
```bash
# Issue: JWT secret not set
# Solution: Check .env file has JWT_SECRET

# Issue: Admin user not found
# Solution: Run admin creation script
node scripts/create-admin.js
```

### Socket.io Connection Issues
```bash
# Issue: Socket connection failed
# Solution: Verify CORS settings in backend
# Check frontend socket client configuration
```

## 📊 Health Check Endpoints

### Backend Health Checks
- **General Health**: `GET /health`
- **Database Health**: `GET /health/database`
- **Authentication Health**: `GET /health/auth`
- **Socket Health**: `GET /health/socket`

### Expected Responses
```json
{
  "status": "healthy",
  "timestamp": "2025-01-21T02:32:44.000Z",
  "services": {
    "database": "connected",
    "authentication": "active",
    "socket": "running"
  },
  "version": "1.0.0"
}
```

## 🔄 Startup Sequence

### Recommended Order
1. **Start MongoDB** (if not running)
2. **Run Database Verification** (`npm run verify:database`)
3. **Start Backend Server** (`cd backend && npm run dev`)
4. **Verify Backend Health** (`curl http://localhost:5001/health`)
5. **Start Frontend Server** (`cd frontend && npm run dev`)
6. **Run Integration Tests** (`npm run verify:integration`)
7. **Access Application** (`http://localhost:5173`)

### Automated Startup Script
```bash
# Use the comprehensive startup script
node scripts/start-project.js
```

## ✅ Success Criteria

### Backend Ready ✅
- [ ] Server running on port 5001
- [ ] Database connected successfully
- [ ] All routes responding correctly
- [ ] Socket.io server active
- [ ] Health checks passing

### Frontend Ready ✅
- [ ] Application running on port 5173
- [ ] API client connected to backend
- [ ] Socket.io client connected
- [ ] Authentication flow working
- [ ] Dashboard loading with real data

### Integration Ready ✅
- [ ] Login/logout functioning
- [ ] Money transfers working
- [ ] Real-time notifications active
- [ ] PDF exports generating
- [ ] Admin dashboard accessible

## 🛠️ Troubleshooting Commands

### Reset Everything
```bash
# Stop all services
pkill -f "node.*server.js"
pkill -f "vite"

# Clear node modules and reinstall
rm -rf backend/node_modules frontend/node_modules
cd backend && npm install
cd ../frontend && npm install

# Reset database (if needed)
mongosh quickpe --eval "db.dropDatabase()"
node scripts/initialize-quickpe.js
```

### Quick Fix Commands
```bash
# Fix permission issues
chmod +x scripts/*.js
chmod +x scripts/utilities/*.js

# Update dependencies
cd backend && npm update
cd ../frontend && npm update

# Clear npm cache
npm cache clean --force
```

## 📝 Pre-Deployment Checklist

### Production Readiness
- [ ] Environment variables configured for production
- [ ] Database connection strings updated
- [ ] CORS settings configured for production domains
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Backup procedures in place

### Security Checklist
- [ ] JWT secrets are strong and unique
- [ ] Database access restricted
- [ ] Rate limiting configured
- [ ] Input validation active
- [ ] Error messages don't expose sensitive data

### Performance Checklist
- [ ] Database indexes optimized
- [ ] Connection pooling configured
- [ ] Compression enabled
- [ ] Caching strategies implemented
- [ ] Static assets optimized

---

**Note**: Run this checklist before every startup to ensure smooth, error-free operation of the QuickPe application.
