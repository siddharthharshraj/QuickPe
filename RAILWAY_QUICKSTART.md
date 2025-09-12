# Railway Deployment Quick Start Checklist

## ✅ Pre-Deployment Checklist

### 1. Repository Setup
- [ ] Code pushed to GitHub
- [ ] `backend/Dockerfile` exists
- [ ] `frontend/Dockerfile` exists
- [ ] `railway.toml` in root directory
- [ ] `.railwayignore` in root directory

### 2. MongoDB Atlas Setup
- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created
- [ ] Database user created
- [ ] IP whitelist set to 0.0.0.0/0
- [ ] Connection string copied

### 3. Gmail Setup (for contact form)
- [ ] Gmail app password generated
- [ ] Gmail credentials ready

## 🚂 Railway Deployment Steps

### Backend Deployment
1. [ ] Go to [railway.app](https://railway.app)
2. [ ] Login with GitHub
3. [ ] Create new project → Deploy from GitHub repo
4. [ ] Select QuickPe repository
5. [ ] Set root directory to `backend`
6. [ ] Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-32-char-secret
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.railway.app
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   PORT=5000
   ```
7. [ ] Deploy and note backend URL

### Frontend Deployment
1. [ ] Add new service to same Railway project
2. [ ] Select same GitHub repository
3. [ ] Set root directory to `frontend`
4. [ ] Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api/v1
   ```
5. [ ] Deploy and note frontend URL
6. [ ] Update backend `FRONTEND_URL` with actual frontend URL
7. [ ] Redeploy backend

## 🔍 Testing Checklist

### After Deployment
- [ ] Backend health check: `https://your-backend.railway.app/health`
- [ ] Frontend loads: `https://your-frontend.railway.app`
- [ ] User registration works
- [ ] User login works
- [ ] Money transfer works
- [ ] Notifications work
- [ ] Contact form works

## 📊 Railway Free Tier Usage

- **500 hours/month** = 24/7 operation ✅
- **1GB RAM** per service
- **1GB disk** per service
- **100GB bandwidth/month**

## 🆘 If Something Goes Wrong

1. **Check Railway logs** in dashboard
2. **Verify environment variables** are set correctly
3. **Test Docker build locally**:
   ```bash
   docker build -t test-backend ./backend
   docker build -t test-frontend ./frontend
   ```
4. **Check MongoDB connection** from Railway logs

## 🎯 Expected URLs

After successful deployment:
- **Frontend**: `https://quickpe-frontend-production.railway.app`
- **Backend API**: `https://quickpe-backend-production.railway.app/api/v1`
- **Health Check**: `https://quickpe-backend-production.railway.app/health`

## 💡 Pro Tips

- Railway auto-deploys on GitHub pushes
- Use Railway CLI for easier management: `npm install -g @railway/cli`
- Monitor usage in Railway dashboard
- Set up custom domain later if needed

## 🔄 Next Steps After Deployment

1. Test all features thoroughly
2. Set up monitoring alerts
3. Configure custom domain (optional)
4. Set up automated backups
5. Monitor Railway usage metrics

**Estimated deployment time: 15-30 minutes** ⏱️
