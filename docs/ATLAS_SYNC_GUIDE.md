# MongoDB Atlas & Local Data Synchronization Guide

## 🎯 Overview

This guide explains how to configure QuickPe for seamless data synchronization between MongoDB Atlas (production) and local MongoDB (development), ensuring your admin panel always displays accurate, real-time data.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MongoDB       │    │   QuickPe        │    │   MongoDB       │
│   Atlas         │◄──►│   Backend        │◄──►│   Local         │
│   (Production)  │    │   Data Sync      │    │   (Development) │
└─────────────────┘    │   Service        │    └─────────────────┘
                       └──────────────────┘
                              │
                       ┌──────▼──────┐
                       │   Admin     │
                       │   Dashboard │
                       └─────────────┘
```

## 🔧 Configuration Steps

### 1. Environment Setup

Create environment-specific configuration files:

#### `.env.development`
```bash
# Development Environment
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/quickpe
PORT=5001
JWT_SECRET=your-development-jwt-secret

# Optional: Secondary database for sync testing
# MONGODB_SECONDARY_URI=mongodb+srv://username:password@cluster.mongodb.net/quickpe-dev

# Sync Configuration
SYNC_ENABLED=true
SYNC_INTERVAL=300000
```

#### `.env.staging`
```bash
# Staging Environment
NODE_ENV=staging
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickpe-staging
PORT=5001
JWT_SECRET=your-staging-jwt-secret

# Secondary database (local backup)
MONGODB_SECONDARY_URI=mongodb://localhost:27017/quickpe-staging

# Sync Configuration
SYNC_ENABLED=true
SYNC_INTERVAL=180000
```

#### `.env.production`
```bash
# Production Environment
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickpe
PORT=5001
JWT_SECRET=your-super-secure-production-jwt-secret

# Secondary database (backup/analytics)
MONGODB_SECONDARY_URI=mongodb+srv://backup-user:password@backup-cluster.mongodb.net/quickpe-backup

# Sync Configuration
SYNC_ENABLED=true
SYNC_INTERVAL=60000
```

### 2. MongoDB Atlas Setup

#### Create Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster or use existing
3. Configure network access (add your IP)
4. Create database user with read/write permissions

#### Connection String Format
```
mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

#### Example Atlas Configuration
```javascript
// For your quickpe-prod-cluster
const atlasUri = "mongodb+srv://quickpe-user:your-password@quickpe-prod-cluster.ropovfw.mongodb.net/quickpe?retryWrites=true&w=majority";
```

### 3. Local MongoDB Setup

#### Install MongoDB Community Edition
```bash
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Ubuntu
```

#### Configure Replica Set (Required for Change Streams)
```bash
# Start MongoDB with replica set
mongod --replSet quickpe-rs --dbpath /usr/local/var/mongodb

# Initialize replica set
mongosh
> rs.initiate({_id: "quickpe-rs", members: [{_id: 0, host: "localhost:27017"}]})
```

### 4. Application Configuration

#### Update Connection String
```javascript
// For replica set support
const localUri = "mongodb://localhost:27017/quickpe?replicaSet=quickpe-rs";
```

## 🔄 Data Synchronization Features

### Real-time Change Streams
- **Automatic Detection**: Monitors all database changes in real-time
- **Collection Coverage**: Users, Transactions, Audit Logs, Feature Flags
- **Event Types**: Insert, Update, Delete operations
- **Socket.IO Integration**: Real-time updates to admin dashboard

### Periodic Validation
- **Scheduled Checks**: Every 5 minutes (configurable)
- **Data Consistency**: Validates document counts and integrity
- **Health Monitoring**: Tracks sync status and errors
- **Automatic Recovery**: Restarts failed change streams

### Manual Synchronization
- **Force Sync**: Admin-triggered manual sync
- **Validation Reports**: Detailed sync status and metrics
- **Conflict Resolution**: Handles data conflicts intelligently

## 📊 Admin Dashboard Integration

### Data Sync Status Tab
The admin dashboard includes a dedicated "Data Sync" tab showing:

- **Connection Status**: Atlas vs Local MongoDB
- **Sync Metrics**: Success rate, error count, last sync time
- **Collection Statistics**: Document counts, storage size, indexes
- **System Health**: Overall sync health score
- **Real-time Monitoring**: Live updates every 10 seconds

### API Endpoints
```javascript
// Get sync status
GET /api/v1/data-sync/status

// Get connection info
GET /api/v1/data-sync/connection-info

// Get collection statistics
GET /api/v1/data-sync/collections

// Force manual sync
POST /api/v1/data-sync/force-sync

// Get sync metrics
GET /api/v1/data-sync/metrics
```

## 🚀 Deployment Scenarios

### Scenario 1: Local Development
```bash
# Use local MongoDB
MONGODB_URI=mongodb://localhost:27017/quickpe?replicaSet=quickpe-rs
```

### Scenario 2: Atlas Primary + Local Secondary
```bash
# Primary: Atlas, Secondary: Local (for backup)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quickpe
MONGODB_SECONDARY_URI=mongodb://localhost:27017/quickpe-backup
```

### Scenario 3: Full Atlas Setup
```bash
# Primary: Atlas Production, Secondary: Atlas Staging
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/quickpe
MONGODB_SECONDARY_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/quickpe
```

## 🔍 Monitoring & Troubleshooting

### Health Check Endpoints
```bash
# Check overall system health
curl http://localhost:5001/health

# Check database connection
curl http://localhost:5001/api/v1/data-sync/connection-info

# Check sync status
curl http://localhost:5001/api/v1/data-sync/status
```

### Common Issues & Solutions

#### Issue: Change Streams Not Working
**Solution**: Ensure MongoDB is running as a replica set
```bash
mongosh
> rs.status()  # Should show replica set status
```

#### Issue: Connection Timeout
**Solution**: Check network access and connection string
```bash
# Test connection
mongosh "mongodb+srv://cluster.mongodb.net/quickpe" --username your-username
```

#### Issue: Authentication Failed
**Solution**: Verify credentials and database permissions
```javascript
// Check user permissions in Atlas
db.runCommand({connectionStatus: 1})
```

### Performance Optimization

#### Connection Pool Settings
```javascript
// Optimized for different environments
development: { maxPoolSize: 10 }
staging: { maxPoolSize: 20 }
production: { maxPoolSize: 50 }
```

#### Caching Strategy
- **Query Results**: 2-minute cache for analytics
- **Collection Stats**: 5-minute cache for metadata
- **Sync Status**: 30-second cache for real-time data

## 📈 Benefits

### For Development
- **Real-time Testing**: Test with production-like data
- **Offline Development**: Work with local data when offline
- **Data Consistency**: Ensure local and remote data match

### For Production
- **High Availability**: Automatic failover between databases
- **Performance**: Optimized connection pooling and caching
- **Monitoring**: Comprehensive health and performance metrics

### For Admin Users
- **Live Dashboard**: Real-time data updates without refresh
- **Data Insights**: Detailed collection and sync statistics
- **Manual Control**: Force sync when needed

## 🔐 Security Considerations

### Connection Security
- **TLS/SSL**: All Atlas connections use TLS 1.2+
- **Authentication**: Strong passwords and user permissions
- **Network Access**: IP whitelisting for Atlas clusters

### Data Privacy
- **Environment Separation**: Different databases for dev/staging/prod
- **Access Control**: Role-based database permissions
- **Audit Logging**: All sync operations logged

## 🎯 Next Steps

1. **Configure Atlas Cluster**: Set up your MongoDB Atlas cluster
2. **Update Environment Variables**: Add Atlas connection string
3. **Test Synchronization**: Use admin dashboard to verify sync
4. **Monitor Performance**: Check sync metrics regularly
5. **Scale as Needed**: Adjust connection pools and sync intervals

## 📞 Support

If you encounter issues:
1. Check the admin dashboard "Data Sync" tab
2. Review server logs for error messages
3. Verify network connectivity to Atlas
4. Test connection strings manually
5. Contact support with sync metrics data

---

**Note**: This synchronization system ensures your admin panel always displays accurate, real-time data whether you're using local MongoDB for development or MongoDB Atlas for production. The system automatically detects your environment and configures accordingly.
