# QuickPe Quick Start Guide

## 🚀 One Command Startup

**Start the entire QuickPe application with a single command:**

```bash
npm start
```

That's it! This command will:
- ✅ Set up environment variables automatically
- ✅ Start the backend server (port 5001)
- ✅ Start the frontend development server (port 5173)
- ✅ Verify all connections and eliminate axios errors
- ✅ Display all access URLs and test accounts

## 📋 Prerequisites

Before running `npm start`, ensure you have:

1. **Node.js 18+** installed
2. **MongoDB** running on localhost:27017
3. **Git** for cloning the repository

## 🔧 Installation

```bash
# Clone the repository
git clone <repository-url>
cd QuickPe

# Install root dependencies
npm install

# Start QuickPe (this will install all other dependencies automatically)
npm start
```

## 🌐 Access URLs

After running `npm start`, access:

- **🎨 Frontend**: http://localhost:5173
- **🔧 Backend API**: http://localhost:5001
- **📊 Health Check**: http://localhost:5001/health
- **👨‍💼 Admin Panel**: http://localhost:5173/admin

## 🔑 Test Accounts

Use these pre-configured accounts:

| Email | Password | Role | Features |
|-------|----------|------|----------|
| admin@quickpe.com | admin@quickpe2025 | Admin | Full system access, analytics |
| alice@quickpe.com | password123 | User | Transactions, balance management |
| siddharth@quickpe.com | password123 | User | All user features |

## 🛠️ Alternative Commands

If you prefer individual control:

```bash
# Start backend only
npm run dev:backend

# Start frontend only
npm run dev

# Start both with concurrency (alternative method)
npm run dev:full

# Build for production
npm run build:prod

# Analyze bundle size
npm run analyze
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Kill processes on required ports
lsof -ti:5001 | xargs kill -9  # Backend port
lsof -ti:5173 | xargs kill -9  # Frontend port
```

### MongoDB Not Running
```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Or start manually
mongod --dbpath /path/to/your/data/db
```

### Environment Issues
The startup script automatically creates `.env` files, but you can manually create them:

**Backend `.env`:**
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/quickpe
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
CORS_ORIGIN=http://localhost:5173
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
VITE_APP_NAME=QuickPe
```

## 🎯 Features to Test

Once started, test these features:

### 💰 Core Wallet Features
- ✅ User registration and login
- ✅ Add money to wallet
- ✅ Send money between users
- ✅ Real-time balance updates
- ✅ Transaction history

### 📊 Analytics & Reports
- ✅ Financial analytics dashboard
- ✅ PDF export (Analytics & Audit Trail)
- ✅ Real-time charts and graphs
- ✅ Spending insights

### 🔔 Real-time Features
- ✅ Live notifications
- ✅ Socket.io connectivity
- ✅ Real-time transaction updates
- ✅ Live balance synchronization

### 👨‍💼 Admin Features
- ✅ User management
- ✅ System analytics
- ✅ Transaction monitoring
- ✅ Health metrics

### 📈 Trade Journal
- ✅ Stock position tracking
- ✅ P&L calculations
- ✅ Indian market data (NSE/BSE)
- ✅ Portfolio analytics

## 🛑 Stopping the Application

Press `Ctrl+C` in the terminal where you ran `npm start`. The script will gracefully shut down all services.

## 🚀 Production Deployment

For production deployment, see:
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `DEPLOYMENT2.md` - Docker and cloud deployment options

## 📚 Additional Documentation

- `README.md` - Project overview and features
- `DEVELOPER_GUIDE.md` - Comprehensive developer documentation
- `trade_journal_kt.md` - Trade Journal technical documentation
- `performance_optimization_detailed_kt.md` - Performance optimization guide

## 🆘 Support

If you encounter issues:

1. Check the console output for error messages
2. Verify MongoDB is running
3. Ensure ports 5001 and 5173 are available
4. Check the troubleshooting section above
5. Review the full error logs in the terminal

---

**🎉 Enjoy using QuickPe - Your Complete Digital Wallet Solution!**
