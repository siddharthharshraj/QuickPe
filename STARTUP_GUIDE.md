# 🚀 QuickPe Startup Guide

## Quick Start (Recommended)

### 1. One-Command Setup
```bash
# Navigate to project directory
cd QuickPe

# Run the automated setup script
node start-project.js
```

This script will:
- ✅ Install all backend dependencies
- ✅ Install all frontend dependencies  
- ✅ Create backend `.env` file with proper configuration
- ✅ Reset admin password to `admin@quickpe2025`
- ✅ Verify database connection
- ✅ Display next steps and URLs

### 2. Start Services

**Terminal 1 - Start MongoDB:**
```bash
mongod
```

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Start Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Admin Dashboard**: http://localhost:5173/admin
- **Health Check**: http://localhost:5001/health

---

## 🔐 Login Credentials

### Admin Access
- **Email**: `admin@quickpe.com`
- **Password**: `admin@quickpe2025`
- **Dashboard**: http://localhost:5173/admin

### Test Users
- `alice@quickpe.com` / `password123`
- `bob@quickpe.com` / `password123`
- `charlie@quickpe.com` / `password123`
- `diana@quickpe.com` / `password123`
- `siddharth@quickpe.com` / `password123`

---

## 🎯 Testing Checklist

### ✅ Basic Functionality
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend responds at http://localhost:5001/health
- [ ] Admin login works with `admin@quickpe.com`
- [ ] Test user login works
- [ ] Dashboard displays user data

### ✅ Admin Dashboard Features
- [ ] System Overview tab shows analytics
- [ ] Real-time metrics update every 30 seconds
- [ ] User Management tab displays all users
- [ ] Transaction monitoring shows recent transactions
- [ ] CSV export functionality works
- [ ] User status toggle (activate/deactivate) works
- [ ] System health metrics display correctly

### ✅ User Features
- [ ] Send money between test users
- [ ] Add money to account
- [ ] View transaction history
- [ ] Real-time notifications work
- [ ] Analytics page shows spending insights
- [ ] PDF export functionality

### ✅ Real-time Features
- [ ] Socket.io connection established
- [ ] Real-time transaction notifications
- [ ] Live balance updates
- [ ] Admin dashboard real-time metrics

---

## 🛠 Manual Setup (Alternative)

If you prefer manual setup or the script fails:

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Create Environment File
Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/quickpe
JWT_SECRET=quickpe-super-secret-jwt-key-2025-production-ready
PORT=5001
NODE_ENV=development
GMAIL_USER=contact@siddharth-dev.tech
GMAIL_APP_PASSWORD=kzzbgfbuqrdqutmq
FRONTEND_URL=http://localhost:5173
```

### 3. Reset Admin Password
```bash
cd backend
node scripts/resetAdminPassword.js
```

### 4. Start Services
Follow steps 2-3 from Quick Start above.

---

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```bash
# Make sure MongoDB is running
mongod

# Check if MongoDB is accessible
mongo --eval "db.adminCommand('ismaster')"
```

**2. Port Already in Use**
```bash
# Kill processes on ports 5001 and 5173
lsof -ti:5001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**3. Admin Login Not Working**
```bash
# Reset admin password again
cd backend
node scripts/resetAdminPassword.js
```

**4. Frontend Build Issues**
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**5. Backend API Errors**
```bash
# Check backend logs for errors
cd backend
npm run dev

# Verify environment variables
cat .env
```

### Verification Commands

**Check MongoDB Connection:**
```bash
mongo quickpe --eval "db.users.countDocuments()"
```

**Test API Endpoints:**
```bash
# Health check
curl http://localhost:5001/health

# Admin stats (requires auth token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/v1/admin/stats
```

**Check Socket.io Connection:**
Open browser console at http://localhost:5173 and look for:
```
🌐 Global Socket.IO connection established for user: [userId]
📡 Connection status: Connected
```

---

## 📊 Admin Dashboard Features

### System Overview
- **Real-time Metrics**: Updates every 30 seconds
- **User Growth Analytics**: Daily user registration trends
- **Transaction Volume**: System-wide transaction analytics
- **Top Users**: Highest transaction volume users (30 days)
- **Category Distribution**: Transaction category breakdown
- **System Health**: Success rates and performance metrics

### User Management
- **View All Users**: Complete user list with details
- **User Actions**: Edit, activate/deactivate, delete
- **CSV Export**: Download user data
- **Add New Users**: Create users via admin panel
- **User Statistics**: Balance, transaction count, status

### Transaction Monitoring
- **Recent Transactions**: Latest system transactions
- **Transaction Details**: Amount, status, timestamps
- **Transaction Analytics**: Volume and success rates
- **Real-time Updates**: Live transaction monitoring

### Real-time Metrics
- **Active Users (24h)**: Users active in last 24 hours
- **Transactions (1h)**: Transactions in last hour
- **Volume (1h)**: Transaction volume in last hour
- **Average Transaction**: Mean transaction size
- **System Status**: Operational status and database health

---

## 🎉 Success Indicators

When everything is working correctly, you should see:

### Frontend (http://localhost:5173)
- ✅ Landing page loads with QuickPe branding
- ✅ Login/signup forms work
- ✅ Dashboard shows user data after login
- ✅ Real-time notifications appear
- ✅ Socket connection status shows "Connected"

### Backend (http://localhost:5001)
- ✅ Health endpoint returns status "OK"
- ✅ Database status shows "connected"
- ✅ Console shows "QuickPe Backend running on port 5001"
- ✅ Socket.io connections logged

### Admin Dashboard (http://localhost:5173/admin)
- ✅ Login with admin credentials works
- ✅ System overview shows real data
- ✅ Real-time metrics update automatically
- ✅ User management table populated
- ✅ Transaction monitoring shows activity

### Database
- ✅ MongoDB running on port 27017
- ✅ `quickpe` database exists
- ✅ Collections: users, transactions, notifications, auditlogs
- ✅ Admin user exists with correct password

---

## 🚀 Next Steps

After successful setup:

1. **Explore Admin Features**: Login as admin and test all dashboard features
2. **Test User Flows**: Create transactions between test users
3. **Monitor Real-time Updates**: Watch live metrics and notifications
4. **Export Data**: Test CSV export functionality
5. **Check Analytics**: View system analytics and user insights
6. **Test Security**: Verify admin-only access restrictions

---

## 📞 Support

If you encounter issues:

1. **Check Logs**: Backend console and browser developer tools
2. **Verify Ports**: Ensure 5001 and 5173 are available
3. **Database**: Confirm MongoDB is running and accessible
4. **Environment**: Verify `.env` file exists and is correct
5. **Dependencies**: Ensure all npm packages installed correctly

**Developer Contact:**
- Email: contact@siddharth-dev.tech
- LinkedIn: siddharthharshraj

---

**Happy coding! 🎯**
