# MongoDB Atlas Setup for QuickPe

## 🎯 Overview
This guide helps you set up MongoDB Atlas for QuickPe production deployment and sync your local database.

## 📋 Prerequisites
- MongoDB Atlas account (free tier available)
- Local QuickPe database with data
- MongoDB Compass (optional, for GUI management)

## 🚀 Step-by-Step Setup

### 1. Create MongoDB Atlas Cluster

1. **Sign up/Login to MongoDB Atlas**
   - Visit: https://cloud.mongodb.com/
   - Create account or sign in

2. **Create New Cluster**
   ```
   Cluster Name: quickpe-cluster
   Cloud Provider: AWS (recommended)
   Region: us-east-1 (or closest to your users)
   Tier: M0 Sandbox (Free)
   ```

3. **Configure Database Access**
   ```
   Username: quickpe-app
   Password: [Generate secure password]
   Built-in Role: Atlas admin
   ```

4. **Configure Network Access**
   ```
   IP Access List: 0.0.0.0/0 (Allow access from anywhere)
   Note: Restrict this in production
   ```

### 2. Get Connection String

1. **Click "Connect" on your cluster**
2. **Choose "Connect your application"**
3. **Copy the connection string:**
   ```
   mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 3. Update Environment Configuration

Create `.env.atlas` file:
```bash
# MongoDB Atlas Configuration
MONGODB_ATLAS_URI=mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/quickpe?retryWrites=true&w=majority

# Local Development
MONGODB_URI=mongodb://localhost:27017/quickpe

# Production Environment
NODE_ENV=production
```

### 4. Sync Local Data to Atlas

Run the sync script:
```bash
# Set Atlas URI
export MONGODB_ATLAS_URI="mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/quickpe?retryWrites=true&w=majority"

# Run sync
node scripts/atlas-sync.js
```

### 5. Verify Data in Atlas

1. **Using MongoDB Compass:**
   ```
   Connection String: mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/quickpe
   ```

2. **Using Atlas Web Interface:**
   - Navigate to Collections tab
   - Verify all collections are present
   - Check document counts match local database

## 📊 Current Local Database Status

Based on your local QuickPe database:
- **Users**: 11 documents
- **Transactions**: 374 documents  
- **Notifications**: 185 documents
- **Audit Logs**: 8,341 documents
- **Accounts**: 10 documents

## 🔧 Production Configuration

### Backend Configuration
Update `backend/services/db.js`:
```javascript
const connectDB = async () => {
    const uri = process.env.NODE_ENV === 'production' 
        ? process.env.MONGODB_ATLAS_URI 
        : process.env.MONGODB_URI;
        
    const conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority'
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
};
```

### Environment Variables for Production
```bash
# Production .env
MONGODB_URI=mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/quickpe?retryWrites=true&w=majority
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
PORT=5001
```

## 🔍 Monitoring & Management

### MongoDB Compass Setup
1. **Download MongoDB Compass**
2. **Connect using Atlas URI**
3. **Monitor collections and performance**

### Atlas Dashboard Features
- **Real-time Performance Monitoring**
- **Query Performance Insights**
- **Database Profiler**
- **Automated Backups**
- **Alerts and Notifications**

## 🛡️ Security Best Practices

1. **Network Security**
   ```
   - Restrict IP access to specific ranges
   - Use VPC peering for production
   - Enable authentication
   ```

2. **Database Security**
   ```
   - Use strong passwords
   - Enable database encryption
   - Regular security audits
   ```

3. **Application Security**
   ```
   - Use connection pooling
   - Implement proper error handling
   - Monitor connection health
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```bash
   # Check network access settings
   # Verify IP whitelist
   # Test connection string
   ```

2. **Authentication Failed**
   ```bash
   # Verify username/password
   # Check database user permissions
   # Ensure proper URL encoding
   ```

3. **Data Sync Issues**
   ```bash
   # Check collection names
   # Verify document structure
   # Monitor sync logs
   ```

## 📈 Scaling Considerations

### Free Tier Limits (M0)
- **Storage**: 512 MB
- **RAM**: Shared
- **Connections**: 500 concurrent
- **Suitable for**: Development, testing, small applications

### Upgrade Path
- **M2**: $9/month - 2GB storage, 1GB RAM
- **M5**: $25/month - 5GB storage, 2GB RAM  
- **M10**: $57/month - 10GB storage, 2GB RAM

## 🎉 Success Checklist

- [ ] Atlas cluster created and configured
- [ ] Database user created with proper permissions
- [ ] Network access configured
- [ ] Connection string obtained
- [ ] Local data synced to Atlas
- [ ] Backend configured for Atlas connection
- [ ] Production environment variables set
- [ ] MongoDB Compass connected (optional)
- [ ] Data integrity verified

## 📞 Support

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **MongoDB University**: https://university.mongodb.com/
- **Community Forums**: https://community.mongodb.com/
