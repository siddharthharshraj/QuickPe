# QuickPe Database Migration Guide
## From In-Memory to MongoDB Atlas with GUI Management

### 📋 Table of Contents
1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Migration Strategy](#migration-strategy)
3. [MongoDB Atlas Setup](#mongodb-atlas-setup)
4. [GUI Management Tools](#gui-management-tools)
5. [Load Balancing & Scaling](#load-balancing--scaling)
6. [Implementation Steps](#implementation-steps)

---

## 🔍 Current Architecture Analysis

### Current Database Setup
QuickPe currently uses **MongoDB with Mongoose** but may be running in a local/development configuration.

**Current Configuration:**
```javascript
// backend/services/db.js
const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
};
```

**Current Models:**
- User.js (4.2KB) - User authentication and profiles
- Account.js (1KB) - Account balance and details  
- Transaction.js (1.9KB) - Transaction records
- AuditLog.js (1.7KB) - Audit trail
- TradeJournal.js (3.1KB) - Trading records
- Notification.js (1KB) - User notifications
- FeatureFlag.js (1.6KB) - Feature management

---

## 🚀 Migration Strategy

### Phase 1: Assessment & Planning
1. **Data Volume Analysis**
   - Current data size estimation
   - Growth projection for 10,000+ users
   - Performance requirements

2. **Backup Strategy**
   - Export current data
   - Create migration rollback plan
   - Test data integrity

### Phase 2: MongoDB Atlas Setup
1. **Cloud Provider Selection**
   - AWS (Recommended for scalability)
   - Azure (Alternative)
   - Google Cloud (Alternative)

2. **Cluster Configuration**
   - Development: M0 (Free tier)
   - Staging: M10 ($57/month)
   - Production: M30+ ($185/month)

---

## 🗄️ MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account
```bash
# Visit: https://www.mongodb.com/cloud/atlas/register
# Choose cloud provider: AWS (recommended)
# Select region: us-east-1 (lowest latency for most users)
```

### 2. Cluster Configuration for Different Scales

#### **Development/Testing (Free Tier - M0)**
```yaml
Cluster Tier: M0 Sandbox
RAM: 512 MB
Storage: 5 GB
Price: FREE
Suitable for: Development, testing, proof of concept
Max Connections: 500
```

#### **Small Production (M10)**
```yaml
Cluster Tier: M10
RAM: 2 GB
Storage: 10 GB
Price: $57/month
Suitable for: 100-1,000 users
Max Connections: 1,500
Auto-scaling: Available
```

#### **Medium Production (M30)**
```yaml
Cluster Tier: M30
RAM: 8 GB
Storage: 40 GB
Price: $185/month
Suitable for: 1,000-10,000 users
Max Connections: 4,000
Auto-scaling: Available
Replica Set: 3 nodes
```

#### **Large Production (M50+)**
```yaml
Cluster Tier: M50
RAM: 16 GB
Storage: 80 GB
Price: $370/month
Suitable for: 10,000-100,000 users
Max Connections: 8,000
Auto-scaling: Available
Replica Set: 3 nodes
Sharding: Available
```

### 3. Security Configuration
```javascript
// Network Access
// Add IP whitelist: 0.0.0.0/0 (for development)
// Production: Specific IP ranges only

// Database User
// Username: quickpe-app
// Password: Generate strong password
// Role: readWrite on quickpe database
```

### 4. Connection String Setup
```javascript
// Update .env file
MONGODB_URI=mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/quickpe?retryWrites=true&w=majority

// Enhanced connection options for production
const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 50,           // Increased for production
        minPoolSize: 5,            // Maintain minimum connections
        maxIdleTimeMS: 30000,      // Close connections after 30s idle
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,       // Disable mongoose buffering
        bufferCommands: false,     // Disable mongoose buffering
        retryWrites: true,         // Retry failed writes
        w: 'majority'              // Write concern
    });
};
```

---

## 🖥️ GUI Management Tools

### 1. MongoDB Compass (Primary Recommendation)

**Features:**
- Visual query builder
- Real-time performance monitoring
- Index management
- Schema analysis
- Aggregation pipeline builder
- Import/Export data

**Installation:**
```bash
# Download from: https://www.mongodb.com/try/download/compass
# Available for: Windows, macOS, Linux
# Connection: Use Atlas connection string
```

**Connection Setup:**
```javascript
// Connection String for Compass
mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/quickpe

// Advanced Connection Options
{
  "authSource": "admin",
  "ssl": true,
  "readPreference": "primary",
  "appname": "MongoDB Compass",
  "retryWrites": true,
  "w": "majority"
}
```

### 2. Atlas Data Explorer (Web-based)

**Access:** Directly through MongoDB Atlas dashboard
**Features:**
- Browser-based interface
- No installation required
- Basic CRUD operations
- Query execution
- Index management

### 3. Third-party GUI Tools

#### **Studio 3T (Professional)**
- **Cost:** $199/year per user
- **Features:** Advanced querying, data comparison, migration tools
- **Best for:** Development teams, complex operations

#### **NoSQLBooster (Affordable)**
- **Cost:** $49/year per user
- **Features:** IntelliSense, query builder, data visualization
- **Best for:** Individual developers, small teams

#### **Robo 3T (Free)**
- **Cost:** Free
- **Features:** Basic GUI, shell-centric
- **Best for:** Simple operations, budget-conscious teams

---

## ⚖️ Load Balancing & Scaling Architecture

### 1. Application Load Balancer (ALB) Setup

```yaml
# AWS Application Load Balancer Configuration
Load Balancer Type: Application Load Balancer
Scheme: Internet-facing
IP address type: IPv4
Listeners: 
  - Port 80 (HTTP) -> Redirect to 443
  - Port 443 (HTTPS) -> Target Group

Target Groups:
  - Backend API: Port 5001
  - Frontend: Port 5173 (or S3/CloudFront)

Health Checks:
  - Path: /api/health
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Healthy threshold: 2
  - Unhealthy threshold: 3
```

### 2. Auto Scaling Configuration

```yaml
# EC2 Auto Scaling Group
Min Size: 2 instances
Max Size: 10 instances
Desired Capacity: 2 instances

Scaling Policies:
  Scale Up:
    - CPU > 70% for 2 minutes
    - Memory > 80% for 2 minutes
    - Request count > 1000/minute
  
  Scale Down:
    - CPU < 30% for 5 minutes
    - Memory < 40% for 5 minutes
    - Request count < 200/minute

Instance Types:
  - Development: t3.micro (1 vCPU, 1GB RAM)
  - Production: t3.medium (2 vCPU, 4GB RAM)
  - High Load: c5.large (2 vCPU, 4GB RAM, optimized)
```

### 3. Database Scaling Strategy

```javascript
// MongoDB Atlas Auto-scaling Configuration
{
  "cluster": {
    "autoScaling": {
      "compute": {
        "enabled": true,
        "scaleDownEnabled": true,
        "minInstanceSize": "M30",
        "maxInstanceSize": "M50"
      },
      "diskGBEnabled": true
    },
    "replicationSpecs": [
      {
        "numShards": 1,
        "regionsConfig": {
          "US_EAST_1": {
            "electableNodes": 3,
            "priority": 7,
            "readOnlyNodes": 0
          }
        }
      }
    ]
  }
}
```

---

## 🛠️ Implementation Steps

### Step 1: Environment Setup

```bash
# 1. Create MongoDB Atlas cluster
# 2. Set up connection string
# 3. Update environment variables

# .env.production
MONGODB_URI=mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/quickpe?retryWrites=true&w=majority
REDIS_URL=redis://quickpe-cache.xxxxx.cache.amazonaws.com:6379
NODE_ENV=production
```

### Step 2: Database Migration Script

```javascript
// scripts/migrate-to-atlas.js
const mongoose = require('mongoose');

const migrateToAtlas = async () => {
    try {
        // Connect to old database
        const oldDB = await mongoose.createConnection(process.env.OLD_MONGODB_URI);
        
        // Connect to Atlas
        const newDB = await mongoose.createConnection(process.env.MONGODB_URI);
        
        // Migrate collections
        const collections = ['users', 'accounts', 'transactions', 'auditlogs'];
        
        for (const collectionName of collections) {
            console.log(`Migrating ${collectionName}...`);
            
            const oldCollection = oldDB.collection(collectionName);
            const newCollection = newDB.collection(collectionName);
            
            const documents = await oldCollection.find({}).toArray();
            
            if (documents.length > 0) {
                await newCollection.insertMany(documents);
                console.log(`✅ Migrated ${documents.length} documents from ${collectionName}`);
            }
        }
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateToAtlas();
```

### Step 3: Enhanced Connection Management

```javascript
// services/database.js
class DatabaseManager {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }
    
    async connect() {
        try {
            this.connection = await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 50,
                minPoolSize: 5,
                maxIdleTimeMS: 30000,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                retryWrites: true,
                w: 'majority'
            });
            
            this.isConnected = true;
            console.log('✅ Connected to MongoDB Atlas');
            
            // Set up connection event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        mongoose.connection.on('connected', () => {
            console.log('📡 MongoDB connected');
            this.isConnected = true;
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('📡 MongoDB disconnected');
            this.isConnected = false;
        });
        
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB error:', error);
        });
    }
    
    async healthCheck() {
        try {
            await mongoose.connection.db.admin().ping();
            return { status: 'healthy', timestamp: new Date() };
        } catch (error) {
            return { status: 'unhealthy', error: error.message, timestamp: new Date() };
        }
    }
}

module.exports = new DatabaseManager();
```

---

## 📈 Performance Optimization

### 1. Database Indexing Strategy

```javascript
// scripts/create-indexes.js
const mongoose = require('mongoose');

const createIndexes = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ quickpeId: 1 }, { unique: true });
    
    // Transaction indexes
    await db.collection('transactions').createIndex({ fromUserId: 1, createdAt: -1 });
    await db.collection('transactions').createIndex({ toUserId: 1, createdAt: -1 });
    await db.collection('transactions').createIndex({ status: 1 });
    await db.collection('transactions').createIndex({ createdAt: -1 });
    
    // Account indexes
    await db.collection('accounts').createIndex({ userId: 1 }, { unique: true });
    
    // Audit log indexes
    await db.collection('auditlogs').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('auditlogs').createIndex({ action: 1, timestamp: -1 });
    
    console.log('✅ All indexes created successfully');
    mongoose.disconnect();
};

createIndexes();
```

### 2. Caching Strategy

```javascript
// Redis Configuration for Session & Data Caching
const redis = require('redis');
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
});

// Cache frequently accessed data
const cacheUserData = async (userId, userData) => {
    await client.setex(`user:${userId}`, 3600, JSON.stringify(userData));
};

// Cache database queries
const cacheQuery = async (queryKey, result) => {
    await client.setex(queryKey, 1800, JSON.stringify(result));
};
```

---

## 🚨 Tools & Services Recommendations

### **Minimal Cost Setup (100-1,000 users)**
- **Database:** MongoDB Atlas M10 ($57/month)
- **Hosting:** AWS EC2 t3.micro ($8.5/month)
- **Load Balancer:** AWS ALB ($16/month)
- **Total:** ~$82/month

### **Medium Scale (1,000-10,000 users)**
- **Database:** MongoDB Atlas M30 ($185/month)
- **Hosting:** AWS EC2 t3.medium x2 ($60/month)
- **Load Balancer:** AWS ALB ($25/month)
- **Cache:** ElastiCache Redis ($15/month)
- **Total:** ~$285/month

### **Enterprise Scale (10,000+ users)**
- **Database:** MongoDB Atlas M50 ($370/month)
- **Hosting:** AWS ECS/EKS ($200/month)
- **Load Balancer:** AWS ALB ($50/month)
- **Cache:** ElastiCache Redis Cluster ($100/month)
- **CDN:** CloudFront ($50/month)
- **Monitoring:** DataDog/New Relic ($100/month)
- **Total:** ~$870/month

---

## ✅ Migration Checklist

- [ ] Set up MongoDB Atlas cluster
- [ ] Configure security settings
- [ ] Install MongoDB Compass
- [ ] Create migration script
- [ ] Test connection and queries
- [ ] Set up monitoring
- [ ] Configure auto-scaling
- [ ] Implement caching
- [ ] Load test the system
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Set up backups

---

**Next:** See [COSTING.md](./COSTING.md) for detailed cost analysis and scaling projections.
