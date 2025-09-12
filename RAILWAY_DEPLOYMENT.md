# QuickPe Railway Deployment Guide

## 🚂 Railway Overview

Railway is a modern deployment platform that makes it easy to deploy Docker applications with:
- **500 hours free** per month (enough for 24/7 operation)
- **Automatic SSL** certificates
- **Custom domains** support
- **GitHub integration** with auto-deploys
- **Environment variables** management
- **Built-in monitoring** and logs

## 📋 Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **MongoDB Atlas** - Free database (512MB)
4. **Gmail App Password** - For contact form functionality

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Ensure your code is pushed to GitHub:**
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

2. **Verify Docker files are in place:**
- `backend/Dockerfile` ✅
- `frontend/Dockerfile` ✅
- `docker-compose.yml` ✅

### Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas account** at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Create a new cluster** (free M0 tier)
3. **Create database user** with read/write permissions
4. **Whitelist all IPs** (0.0.0.0/0) for Railway access
5. **Get connection string:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/quickpe
   ```

### Step 3: Deploy Backend to Railway

1. **Login to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your QuickPe repository

3. **Configure Backend Service:**
   - Railway will detect your `backend/Dockerfile`
   - Set **Root Directory** to `backend`
   - Set **Dockerfile Path** to `Dockerfile`

4. **Set Environment Variables:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickpe
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-app.railway.app
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   PORT=5000
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Note your backend URL: `https://your-backend-app.railway.app`

### Step 4: Deploy Frontend to Railway

1. **Add another service:**
   - In the same Railway project, click "New Service"
   - Select "GitHub Repo" and choose the same repository

2. **Configure Frontend Service:**
   - Set **Root Directory** to `frontend`
   - Set **Dockerfile Path** to `Dockerfile`

3. **Set Environment Variables:**
   ```env
   VITE_API_URL=https://your-backend-app.railway.app/api/v1
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Note your frontend URL: `https://your-frontend-app.railway.app`

5. **Update Backend Environment:**
   - Go back to backend service
   - Update `FRONTEND_URL` to your actual frontend URL
   - Redeploy backend

### Step 5: Configure Custom Domains (Optional)

1. **In Railway dashboard:**
   - Go to your frontend service
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Update DNS records as instructed

2. **Update environment variables** with your custom domain

## 🔧 Railway Configuration Files

### Create `railway.toml` (Optional)
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

### Create `.railwayignore`
```
node_modules
.git
.env
*.log
.DS_Store
coverage
.nyc_output
```

## 📊 Railway Free Tier Limits

- **500 execution hours/month** (enough for 24/7)
- **1GB RAM** per service
- **1GB disk** per service
- **100GB bandwidth** per month
- **Unlimited projects**

## 🔍 Monitoring & Debugging

### View Logs:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Health Checks:
- Backend: `https://your-backend-app.railway.app/health`
- Frontend: `https://your-frontend-app.railway.app/health`

### Common Issues:

1. **Build Failures:**
   - Check Dockerfile syntax
   - Verify all dependencies in package.json
   - Check build logs in Railway dashboard

2. **Environment Variables:**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Restart services after updating variables

3. **Database Connection:**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist (use 0.0.0.0/0)
   - Test connection locally first

## 🚀 Deployment Commands

### Using Railway CLI:
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link to existing project
railway link

# Deploy backend
cd backend
railway up

# Deploy frontend (in new terminal)
cd frontend
railway up
```

### Using GitHub Integration:
- Push to main branch
- Railway auto-deploys
- Monitor progress in dashboard

## 🔄 CI/CD Pipeline

Railway automatically:
1. **Detects changes** in GitHub
2. **Builds Docker images**
3. **Deploys new versions**
4. **Provides rollback** options

## 💡 Pro Tips

1. **Use Railway's built-in PostgreSQL** if you want to avoid external database
2. **Enable auto-deploy** for seamless updates
3. **Use Railway's metrics** to monitor performance
4. **Set up notifications** for deployment status
5. **Use staging environments** for testing

## 🔐 Security Best Practices

1. **Never commit secrets** to GitHub
2. **Use Railway's environment variables**
3. **Enable 2FA** on Railway account
4. **Regularly rotate JWT secrets**
5. **Monitor access logs**

## 📈 Scaling Options

When you outgrow free tier:
- **Hobby Plan**: $5/month per service
- **Pro Plan**: $20/month per service
- **Custom scaling** based on usage

## 🆘 Troubleshooting

### If deployment fails:
1. Check Railway build logs
2. Verify Dockerfile syntax
3. Test Docker build locally:
   ```bash
   docker build -t quickpe-backend ./backend
   docker build -t quickpe-frontend ./frontend
   ```

### If app doesn't start:
1. Check environment variables
2. Verify MongoDB connection
3. Check application logs in Railway

### Performance issues:
1. Monitor Railway metrics
2. Optimize Docker images
3. Consider upgrading to paid plan

## 🎯 Next Steps After Deployment

1. **Test all functionality:**
   - User registration/login
   - Money transfers
   - Notifications
   - Contact form

2. **Set up monitoring:**
   - Railway built-in metrics
   - Custom health checks
   - Error tracking

3. **Configure backups:**
   - MongoDB Atlas automated backups
   - Export user data regularly

4. **Performance optimization:**
   - Monitor response times
   - Optimize database queries
   - Consider CDN for static assets

## 🔗 Useful Links

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Reference](https://docs.railway.app/reference/cli-api)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)

Your QuickPe app will be live at:
- **Frontend**: `https://your-frontend-app.railway.app`
- **Backend API**: `https://your-backend-app.railway.app/api/v1`

Happy deploying! 🚂✨
