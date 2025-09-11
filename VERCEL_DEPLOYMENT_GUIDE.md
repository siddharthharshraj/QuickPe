# QuickPe Vercel Deployment Guide

## 🚀 Complete Deployment Setup

### Prerequisites
1. GitHub repository with QuickPe code
2. Vercel account connected to GitHub
3. MongoDB Atlas database
4. Environment variables configured

### 1. Environment Variables Setup

Create these environment variables in Vercel Dashboard:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickpe

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters

# Email (for contact form)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Application
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### 2. Vercel Deployment Steps

1. **Connect Repository**
   ```bash
   # Login to Vercel
   vercel login
   
   # Deploy from repository root
   vercel --prod
   ```

2. **Configure Build Settings**
   - Framework Preset: Other
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

### 3. Manual Deployment Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### 4. Verification Checklist

#### ✅ API Endpoints Test
```bash
# Test signup
curl -X POST https://your-app.vercel.app/api/v1/user/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","firstName":"Test","lastName":"User","password":"password123"}'

# Test signin
curl -X POST https://your-app.vercel.app/api/v1/user/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password123"}'

# Test balance (with token)
curl -X GET https://your-app.vercel.app/api/v1/account/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### ✅ Frontend Features Test
1. Navigate to https://your-app.vercel.app
2. Test signup flow
3. Test signin flow
4. Test dashboard access
5. Test money transfer
6. Test transaction history
7. Test notifications

### 5. Common Issues & Solutions

#### Issue: 404 on API routes
**Solution:** Check vercel.json rewrites configuration

#### Issue: CORS errors
**Solution:** Verify API endpoints have proper CORS headers

#### Issue: Database connection fails
**Solution:** Check MONGODB_URI and whitelist Vercel IPs in MongoDB Atlas

#### Issue: JWT errors
**Solution:** Ensure JWT_SECRET is set and minimum 32 characters

### 6. Performance Optimization

1. **Function Timeout**: Set to 10 seconds in vercel.json
2. **Caching**: Enable for static assets
3. **Compression**: Enabled by default on Vercel
4. **CDN**: Automatic global distribution

### 7. Monitoring & Debugging

```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow

# Check deployment status
vercel ls
```

## 🔧 Fixed Issues in This Deployment

### ✅ Routing Issues Fixed
- Removed double `/api/api` prefixes
- Environment-aware baseURL configuration
- Proper axios interceptors for authentication

### ✅ Serverless Compatibility
- Replaced WebSocket with polling for notifications
- Optimized API functions for serverless environment
- Added proper CORS headers

### ✅ Build Configuration
- Fixed vite.config.js for production builds
- Optimized vercel.json configuration
- Added proper environment variable handling

## 📊 Test Results Summary

All critical features have been tested and verified:
- ✅ Authentication (signup/signin/logout)
- ✅ Account balance retrieval
- ✅ Money transfers
- ✅ Transaction history
- ✅ Notification system (polling-based)
- ✅ File exports (PDF/CSV)
- ✅ API routing and CORS

## 🎯 Next Steps

1. Deploy to Vercel using the commands above
2. Configure environment variables in Vercel dashboard
3. Test all features in production
4. Monitor performance and logs
5. Set up custom domain (optional)

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Check MongoDB Atlas connection
