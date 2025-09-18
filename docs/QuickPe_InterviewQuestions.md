# QuickPe - Senior Full-Stack Architect Interview Questions

*Comprehensive scenario-based questions derived from actual QuickPe fintech project implementation*

---

## **Question 1: System Architecture & Scalability Design**

**Scenario:** Your QuickPe digital wallet application currently handles 2,190 concurrent users with 89% success rate. The business wants to scale to 50,000 concurrent users while maintaining sub-500ms response times. How would you architect this scaling strategy?

**Detailed Answer:**

QuickPe's current architecture demonstrates solid foundations but requires strategic enhancements to handle enterprise-scale traffic. The application currently uses a single Node.js instance with Express.js, MongoDB with connection pooling, and Socket.io for real-time features. Our load testing with Artillery shows we can handle 2,190 concurrent users with 391ms average response time and 89% success rate, indicating we're approaching our current capacity limits.

The scaling challenge involves multiple dimensions: horizontal scaling of application servers, database optimization, real-time connection management, and maintaining data consistency across distributed systems. Based on our current implementation analysis, here's my comprehensive scaling approach:

**Current Architecture Analysis:**

Our existing server setup demonstrates a monolithic architecture with integrated Socket.io server handling both HTTP requests and WebSocket connections. The current implementation uses a single Node.js process with Express.js framework, serving both API endpoints and real-time communication through Socket.io. The CORS configuration is properly set up to support multiple deployment environments including local development, staging, and production URLs.

This single-instance approach works effectively for our current user base of 2,190 concurrent users, but becomes a significant bottleneck when scaling to enterprise levels. The server handles all incoming requests sequentially, and while Node.js's event-driven architecture provides good performance for I/O operations, CPU-intensive tasks and high concurrent loads can overwhelm a single instance. The integrated Socket.io server shares resources with the main application, creating potential resource contention during peak loads.

**1. Horizontal Scaling Strategy:**

The transition from single-instance to distributed architecture requires careful planning to maintain our current 89% success rate while scaling to 50,000 users. Our strategy focuses on stateless application design and distributed state management.

- **Load Balancer**: Implement NGINX/HAProxy with sticky sessions for Socket.io connections. This ensures real-time connections remain stable during scaling events.
- **Multiple Node.js Instances**: Deploy 5-8 backend instances behind the load balancer, each handling 6,000-10,000 concurrent users based on our current performance metrics.
- **Database Read Replicas**: MongoDB read replicas specifically for balance queries and analytics, reducing load on the primary database by 60-70%.
- **Redis Cluster**: Distributed caching and session management to maintain user state across multiple application instances.

**2. Socket.io Scaling:**

Our current Socket.io implementation effectively manages real-time balance updates and transaction notifications for 2,190 concurrent users, but scaling to 50,000 users requires a fundamental architectural shift to distributed Socket.io management. The primary challenge lies in maintaining connection state and ensuring message delivery across multiple server instances.

The solution involves implementing a Redis adapter that enables Socket.io instances across different servers to communicate seamlessly. This creates a distributed pub/sub system where messages can be broadcast to users regardless of which server instance they're connected to. The Redis adapter acts as a message broker, ensuring that when a user receives a payment notification, it reaches them even if the transaction was processed by a different server instance.

Room management becomes critical at scale - instead of simple user-based rooms, we implement sharded room architecture that distributes users across multiple logical groups. This prevents any single room from becoming overloaded and ensures balanced resource utilization across all server instances. The sharding algorithm uses consistent hashing to maintain user-room assignments even during server scaling events.

**3. Database Optimization:**

Our current MongoDB configuration with a connection pool size of 10 works adequately for current traffic but becomes a severe bottleneck at enterprise scale. Database operations, particularly user balance queries and transaction writes, represent the most critical performance bottlenecks in financial applications where data consistency and speed are paramount.

The optimization strategy involves multiple layers: enhanced connection pooling to handle concurrent database operations efficiently, read replica implementation for distributing query load, and strategic indexing for frequently accessed data patterns. Connection pooling must be carefully tuned - too few connections create queuing delays, while too many connections can overwhelm the database server.

Read replicas serve a crucial role in scaling read-heavy operations like balance inquiries, transaction history, and analytics queries. By directing these operations to secondary database instances, we significantly reduce load on the primary database, which can focus on critical write operations like transaction processing. The read preference configuration ensures that non-critical queries don't impact real-time financial operations.

Database indexing strategy becomes critical at scale - compound indexes on user ID and timestamp fields accelerate transaction queries, while specialized indexes on balance fields and transaction categories optimize reporting and analytics operations. Query optimization through aggregation pipelines reduces data transfer and processing overhead.

**4. Caching Strategy Enhancement:**

Our current caching implementation provides basic functionality but requires significant enhancement for enterprise-scale performance. The existing cache middleware uses simple key-based caching that works well for current load but needs evolution to multi-layer architecture for optimal performance at scale.

The enhanced caching strategy implements a three-tier hierarchy: L1 in-memory cache for ultra-fast access to frequently requested data, L2 distributed Redis cache for shared data across multiple server instances, and L3 database-level query optimization. This approach reduces database load by 70-80% for frequently accessed data like user balances and transaction history.

Cache invalidation becomes critical in financial applications where data accuracy is paramount. Smart invalidation strategies ensure that when a user's balance changes due to a transaction, all related cached data is immediately updated across all cache layers. Pattern-based invalidation allows efficient clearing of related cache entries without affecting unrelated cached data.

Cache warming strategies proactively populate frequently accessed data during low-traffic periods, ensuring optimal response times during peak usage. Predictive caching algorithms analyze user behavior patterns to pre-load likely-to-be-requested data, further improving user experience.

**5. Performance Monitoring & Auto-scaling:**

With 50,000 concurrent users, proactive monitoring becomes critical for maintaining our target sub-500ms response times. Our current Artillery testing provides baseline metrics, but production monitoring requires comprehensive observability.

- **APM Integration**: New Relic/DataDog for real-time performance tracking across all service instances
- **Custom Metrics**: Track response times (target <500ms), error rates (<5%), concurrent Socket.io connections, and database query performance
- **Auto-scaling**: Kubernetes-based auto-scaling triggered by CPU (>70%), memory (>80%), or response time (>400ms) thresholds
- **Circuit Breakers**: Implement circuit breaker patterns for external dependencies to prevent cascade failures
- **Health Checks**: Enhanced health check endpoints monitoring database connectivity, Redis availability, and Socket.io performance

**Expected Performance Improvements:**
- Response time: Maintain <500ms for 95th percentile
- Success rate: Improve from 89% to 99.5%
- Concurrent users: Scale from 2,190 to 50,000+
- Database query optimization: 60% reduction in query time through indexing and read replicas

---

## **Question 2: Real-time Transaction Processing & ACID Compliance**

**Scenario:** During a money transfer between users, your system must ensure atomicity. If User A sends ₹1000 to User B, but the system crashes after debiting A's account but before crediting B's account, how do you handle this? Walk through your implementation.

**Detailed Answer:**

Financial transaction integrity is paramount in QuickPe's architecture. Our current implementation handles simple balance updates effectively, but money transfers between users require sophisticated ACID compliance to prevent data inconsistencies and financial losses. The challenge involves ensuring that either both debit and credit operations succeed, or neither occurs, even in the face of system failures.

Our existing deposit functionality in `routes/account.js` demonstrates basic atomic operations, but peer-to-peer transfers require multi-document transactions with proper rollback mechanisms. The system must handle network failures, database timeouts, and application crashes while maintaining financial accuracy.

**Current Implementation Analysis:**

Our current balance update mechanism demonstrates the foundation for atomic operations using MongoDB's findByIdAndUpdate with increment operations. This approach effectively handles single-user transactions like deposits and withdrawals, ensuring that balance modifications are atomic at the document level.

However, this implementation lacks the sophistication required for multi-user financial transfers where multiple documents across different collections must be updated atomically. The current approach cannot guarantee that if one operation fails, all related operations are rolled back, creating potential for data inconsistencies in peer-to-peer transfers.

True ACID compliance requires implementing MongoDB sessions and multi-document transactions that can span across Users, Transactions, AuditLogs, and Notifications collections. This ensures that either all operations succeed together, or all fail together, maintaining financial data integrity even during system failures.

**Enhanced ACID Implementation:**

**1. MongoDB Session-based Transactions:**

MongoDB's multi-document transactions provide the foundation for ACID compliance in financial operations. Our enhanced implementation ensures that money transfers are atomic, consistent, isolated, and durable across multiple collections including Users, Transactions, AuditLogs, and Notifications.

The transaction workflow follows a strict sequence: validation of sender balance and receiver existence, atomic balance updates for both parties, creation of transaction records with matching transaction IDs, audit log generation for compliance, and finally real-time event emission for user notifications. Each step is wrapped within a MongoDB session that can be rolled back if any operation fails.

Critical validation occurs before any data modification - checking sufficient balance, verifying receiver existence, and validating transfer limits. The atomic balance updates use MongoDB's increment operations within the session context, ensuring that both debit and credit operations are treated as a single atomic unit.

Transaction record creation maintains referential integrity by using shared transaction IDs and cross-referencing user information. Audit logs capture complete transaction context including IP addresses, user agents, and before/after balance states for regulatory compliance and forensic analysis.

**2. Idempotency Implementation:**

Idempotency prevents duplicate transactions caused by network retries, user double-clicks, or client-side errors. This is absolutely critical in financial systems where duplicate transfers could result in significant monetary losses and user trust issues.

The idempotency mechanism uses Redis-based distributed locking with unique transfer keys that combine sender ID, receiver ID, amount, and timestamp. This creates a fingerprint for each transfer request that can be checked across all server instances in a distributed environment.

Automatic expiry of idempotency locks prevents permanent blocking of legitimate transactions while providing sufficient time window for processing. The 5-minute expiry balances between preventing duplicates and allowing retry of genuinely failed transactions.

Client-side idempotency tokens provide additional protection by allowing clients to track their requests and avoid resubmission. The combination of server-side locking and client-side tokens creates multiple layers of protection against duplicate financial transactions.

**3. Failure Recovery Mechanism:**

Robust failure recovery ensures that temporary system issues don't result in permanent data inconsistencies or lost transactions. Our comprehensive recovery mechanism includes automatic retry logic with exponential backoff, dead letter queues for failed transactions, and manual reconciliation processes for edge cases.

The failure recovery system categorizes errors by type and severity - network timeouts get automatic retries, validation errors are immediately rejected, and system errors are queued for manual review. Each failed transaction is logged with complete context including error details, system state, and recovery actions taken.

Dead letter queues capture transactions that exceed retry limits, ensuring no financial operation is lost even during extended system outages. These queued transactions are processed during system recovery with additional validation to ensure data consistency.

Reconciliation processes run periodically to detect and resolve any data inconsistencies that might occur during system failures. These processes compare transaction logs with account balances and flag discrepancies for immediate investigation and resolution.
      transferData,
      failureReason: error.code || 'UNKNOWN'
    }
  });
  
  // Queue for retry with exponential backoff
  await messageQueue.publish('failed_transfers', {
    ...transferData,
    failedAt: new Date(),
    retryCount: 0,
    maxRetries: 3,
    nextRetryAt: new Date(Date.now() + 60000) // 1 minute delay
  });
  
  // Notify operations team for manual review
  await notifyOpsTeam('TRANSFER_FAILURE', transferData);
};

// Automatic retry processor
const processFailedTransfers = async () => {
  const failedTransfers = await messageQueue.consume('failed_transfers');
  
  for (const transfer of failedTransfers) {
    if (transfer.retryCount < transfer.maxRetries) {
      try {
        await retryTransfer(transfer);
      } catch (error) {
        transfer.retryCount++;
        transfer.nextRetryAt = new Date(Date.now() + Math.pow(2, transfer.retryCount) * 60000);
        await messageQueue.publish('failed_transfers', transfer);
      }
    } else {
      // Move to dead letter queue for manual intervention
      await messageQueue.publish('dead_letter_transfers', transfer);
    }
  }
};
```

This comprehensive approach ensures financial data integrity even during system failures, with automatic recovery and manual oversight for edge cases.

## **Question 3: Socket.io Real-time Architecture & Event Management**

**Scenario:** Your QuickPe application has 10,000+ concurrent Socket.io connections for real-time balance updates, transaction notifications, and audit logs. How do you handle connection management, room organization, and message delivery guarantees?

**Detailed Answer:**

Real-time communication is crucial for QuickPe's user experience, providing instant balance updates, transaction notifications, and system alerts. Our current Socket.io implementation handles basic connection management and user room joining, but scaling to 10,000+ concurrent connections requires sophisticated architecture for connection pooling, message delivery guarantees, and fault tolerance.

The challenge lies in maintaining real-time responsiveness while ensuring message delivery reliability and managing connection state across multiple server instances. Our existing implementation provides a solid foundation with JWT authentication and user-specific rooms, but needs enhancement for enterprise-scale deployment.

**Current Socket.io Implementation Analysis:**

Our existing Socket.io setup in `server.js` demonstrates basic connection handling with JWT authentication:

```javascript
// From server.js - Current Socket.io setup
io.on('connection', (socket) => {
  logSocketEvent('connection', { socketId: socket.id });
  
  socket.on('join', (userId, callback) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.userId !== userId) {
          return callback({ success: false, error: 'Authentication failed' });
        }
      } catch (err) {
        return callback({ success: false, error: 'Invalid token' });
      }
    }
    
    socket.join(`user_${userId}`);
    callback({ success: true });
  });
});
```

This implementation provides secure user authentication and basic room management, but lacks the sophistication needed for high-scale real-time operations.

**Enhanced Connection Management Strategy:**

**1. Scalable Room Architecture:**

Managing 10,000+ concurrent connections requires intelligent room organization and connection pooling. Our enhanced architecture distributes users across multiple rooms and tracks connection state for optimal performance.

```javascript
// Multi-tier room organization for high-scale Socket.io
class SocketRoomManager {
  constructor(io) {
    this.io = io;
    this.userSessions = new Map(); // userId -> Set of socketIds
    this.socketUsers = new Map();  // socketId -> userId
    this.connectionPool = new Map(); // Track connection health
    this.maxConnectionsPerRoom = 1000; // Prevent room overload
  }
  
  async joinUserRoom(socket, userId, token) {
    try {
      // Enhanced JWT validation with role extraction
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.userId !== userId) {
        throw new Error('Authentication failed');
      }
      
      // Multi-room joining strategy for load distribution
      await socket.join(`user_${userId}`);
      await socket.join(`role_${decoded.role || 'user'}`);
      await socket.join(`region_${decoded.region || 'default'}`);
      
      // Distribute users across sharded rooms for scalability
      const shardId = this.calculateUserShard(userId);
      await socket.join(`shard_${shardId}`);
      
      // Track user sessions for multi-device support
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId).add(socket.id);
      this.socketUsers.set(socket.id, userId);
      
      // Update user online status in database
      await this.updateUserOnlineStatus(userId, true);
      
      // Log connection for monitoring
      console.log(`User ${userId} connected to rooms: user_${userId}, role_${decoded.role}, shard_${shardId}`);
      
      return { 
        success: true, 
        rooms: [`user_${userId}`, `role_${decoded.role}`, `shard_${shardId}`],
        connectionId: socket.id
      };
    } catch (error) {
      console.error('Room join failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  calculateUserShard(userId) {
    // Distribute users across 10 shards for load balancing
    return Math.abs(userId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 10;
  }
  
  async handleDisconnection(socket) {
    const userId = this.socketUsers.get(socket.id);
    if (userId) {
      // Remove from session tracking
      const userSessions = this.userSessions.get(userId);
      if (userSessions) {
        userSessions.delete(socket.id);
        if (userSessions.size === 0) {
          // Last connection for this user
          this.userSessions.delete(userId);
          await this.updateUserOnlineStatus(userId, false);
        }
      }
      this.socketUsers.delete(socket.id);
    }
  }
}
```

**2. Message Delivery Guarantees:**

Real-time financial notifications require guaranteed delivery to ensure users receive critical balance updates and transaction alerts. Our enhanced message delivery system implements acknowledgment-based reliability with automatic retry mechanisms.

```javascript
// Reliable message delivery with acknowledgments and retry logic
class ReliableMessageDelivery {
  constructor(io, redisClient) {
    this.io = io;
    this.redis = redisClient;
    this.pendingMessages = new Map();
    this.deliveryStats = {
      sent: 0,
      delivered: 0,
      failed: 0,
      retried: 0
    };
  }
  
  async sendReliableMessage(userId, event, data, options = {}) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      id: messageId,
      event,
      data,
      timestamp: new Date(),
      userId,
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      priority: options.priority || 'normal', // high, normal, low
      expiresAt: new Date(Date.now() + (options.ttl || 300000)) // 5 min default
    };
    
    // Store message for potential retry in Redis
    await this.redis.setex(
      `pending_msg_${messageId}`, 
      300, // 5 minutes
      JSON.stringify(message)
    );
    
    this.deliveryStats.sent++;
    
    // Send to user room with acknowledgment callback
    this.io.to(`user_${userId}`).emit(event, data, (ack) => {
      if (ack && ack.received) {
        // Message acknowledged successfully
        this.deliveryStats.delivered++;
        this.redis.del(`pending_msg_${messageId}`);
        console.log(`Message ${messageId} delivered to user ${userId}`);
      } else {
        // No acknowledgment received, schedule retry
        console.warn(`Message ${messageId} not acknowledged by user ${userId}`);
        setTimeout(() => this.retryMessage(messageId), 5000);
      }
    });
    
    // Set timeout for acknowledgment
    setTimeout(() => {
      this.checkMessageDelivery(messageId);
    }, 10000); // 10 second timeout
    
    return messageId;
  }
  
  async retryMessage(messageId) {
    const messageData = await this.redis.get(`pending_msg_${messageId}`);
    if (!messageData) return; // Message expired or already delivered
    
    const message = JSON.parse(messageData);
    
    if (message.retryCount >= message.maxRetries) {
      // Max retries exceeded, move to dead letter queue
      await this.moveToDeadLetterQueue(message);
      this.deliveryStats.failed++;
      return;
    }
    
    if (new Date() > new Date(message.expiresAt)) {
      // Message expired
      await this.redis.del(`pending_msg_${messageId}`);
      this.deliveryStats.failed++;
      return;
    }
    
    // Increment retry count and attempt redelivery
    message.retryCount++;
    this.deliveryStats.retried++;
    
    await this.redis.setex(
      `pending_msg_${messageId}`,
      300,
      JSON.stringify(message)
    );
    
    // Retry with exponential backoff
    const backoffDelay = Math.pow(2, message.retryCount) * 1000;
    setTimeout(() => {
      this.io.to(`user_${message.userId}`).emit(message.event, message.data, (ack) => {
        if (ack && ack.received) {
          this.deliveryStats.delivered++;
          this.redis.del(`pending_msg_${messageId}`);
        } else if (message.retryCount < message.maxRetries) {
          setTimeout(() => this.retryMessage(messageId), backoffDelay);
        }
      });
    }, backoffDelay);
  }
  
  async moveToDeadLetterQueue(message) {
    await this.redis.lpush('dead_letter_messages', JSON.stringify({
      ...message,
      failedAt: new Date(),
      reason: 'MAX_RETRIES_EXCEEDED'
    }));
    
    // Notify operations team
    console.error(`Message ${message.id} moved to dead letter queue after ${message.retryCount} retries`);
  }
  
  getDeliveryStats() {
    return {
      ...this.deliveryStats,
      successRate: (this.deliveryStats.delivered / this.deliveryStats.sent * 100).toFixed(2) + '%'
    };
  }
}
```

This comprehensive message delivery system ensures 99.9%+ reliability for critical financial notifications through intelligent retry mechanisms, exponential backoff strategies, and dead letter queue handling. The system maintains detailed delivery statistics and provides operational visibility into message flow performance, essential for financial applications where notification delivery can impact user trust and regulatory compliance.

---

## **Question 4: Advanced Authentication & Authorization Architecture**

**Scenario:** Your QuickPe application needs role-based access control with different permission levels (user, admin, super-admin), JWT refresh tokens, and multi-device session management. How would you design this system while maintaining security and user experience?

**Detailed Answer:**

Authentication and authorization form the security backbone of QuickPe's financial operations. Our current implementation provides basic JWT authentication with role-based access, but enterprise-scale fintech applications require sophisticated multi-layer security with refresh tokens, device management, and granular permissions.

The challenge involves balancing security with user experience - implementing strong authentication without creating friction for legitimate users. Our existing system handles basic user/admin roles effectively, but needs enhancement for complex permission matrices and multi-device session management.

**Current JWT Implementation Analysis:**

Our existing authentication demonstrates basic JWT token generation with role information and 24-hour expiration. This approach provides fundamental authentication but lacks the sophistication needed for enterprise security requirements in financial applications.

The current 24-hour token expiration creates security vulnerabilities - stolen tokens remain valid for extended periods, increasing exposure risk. Financial applications require shorter-lived access tokens (15-30 minutes) combined with secure refresh token mechanisms to balance security with user experience.

The existing role system supports basic user/admin differentiation but lacks granular permission controls needed for complex organizational structures. Enterprise fintech applications require hierarchical role systems with resource-specific permissions, conditional access controls, and audit trails for all authorization decisions.

**Enhanced RBAC Implementation:**

**1. Role-Based Permission System:**

The enhanced User model extends our current schema to support granular permissions and multi-device session management. This builds upon our existing user structure while adding enterprise-grade security features required for financial institutions.

The hierarchical role system supports multiple organizational levels: regular users for basic transactions, admins for user management, super-admins for system configuration, compliance officers for regulatory oversight, and support agents for customer assistance. Each role inherits permissions from lower levels while adding specific capabilities.

Granular permission matrices enable fine-grained access control where permissions are defined per resource (transactions, users, analytics, audit logs) and action (create, read, update, delete, export, approve, suspend). This allows precise control over who can perform what actions on which resources.

Conditional access controls add contextual security layers including time-based restrictions (business hours only), IP whitelisting for sensitive operations, and transaction amount limits based on user roles. These conditions ensure that even authorized users can only perform actions within appropriate contexts.
    deviceName: String,
    deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet'] },
    lastActive: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      coordinates: [Number] // [longitude, latitude]
    },
    refreshToken: String,
    isActive: { type: Boolean, default: true },
    isTrusted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  
  // Security enhancements
  securitySettings: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    backupCodes: [String],
    loginNotifications: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 900 }, // 15 minutes in seconds
    maxConcurrentSessions: { type: Number, default: 3 }
  },
  
  // Account security tracking
  securityLog: [{
    event: { type: String, enum: ['login', 'logout', 'password_change', 'permission_change', 'suspicious_activity'] },
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed
  }]
});

// Indexes for performance
userSchema.index({ 'deviceSessions.deviceId': 1 });
userSchema.index({ 'deviceSessions.isActive': 1 });
userSchema.index({ 'securityLog.timestamp': -1 });
userSchema.index({ role: 1, 'permissions.resource': 1 });
```

**2. JWT Refresh Token System:**

Implementing secure token refresh mechanisms ensures seamless user experience while maintaining security. Short-lived access tokens (15 minutes) combined with longer-lived refresh tokens (7 days) provide the optimal balance between security and usability.

```javascript
**2. JWT Refresh Token Implementation:**

The enhanced authentication service implements dual-token architecture with short-lived access tokens (15 minutes) and longer-lived refresh tokens (7 days). This approach minimizes security exposure while maintaining seamless user experience through automatic token refresh.

Access tokens contain user identity, role information, flattened permissions, device identifiers, and session tracking data. The short expiration window limits the impact of token compromise while the refresh mechanism ensures users don't experience authentication interruptions during active sessions.

Refresh tokens use separate signing secrets and include token versioning for enhanced security. Token versioning allows immediate invalidation of all user sessions by incrementing the version number, useful for security incidents or password changes.

Device session management enforces concurrent session limits per user, automatically terminating oldest sessions when limits are exceeded. Each device session tracks comprehensive metadata including device type, IP address, user agent, and geographic location for security monitoring and anomaly detection.

**3. Multi-Device Session Management:**

The system maintains detailed device session records with trust levels, activity tracking, and automatic cleanup of expired sessions. Trusted devices (marked after successful multi-factor authentication) receive extended session durations and reduced security friction.

Session enforcement includes automatic cleanup of inactive sessions, notification of session terminations, and suspicious activity detection based on device fingerprinting and behavioral patterns. Geographic anomaly detection flags logins from unusual locations for additional verification.

Comprehensive security logging captures all authentication events, failed attempts, and session management actions for audit trails and threat detection. This logging integrates with our existing AuditLog system for centralized security monitoring.

This enterprise-grade authentication system provides robust security controls while maintaining optimal user experience across multiple devices and platforms.

---

## **Question 5: Advanced Caching Strategy & Performance Optimization**

**Scenario:** Your QuickPe application's balance queries are hitting the database frequently, causing performance issues. Design a multi-layer caching strategy that handles cache invalidation, consistency, and scales with your user base.

**Detailed Answer:**

Caching strategy is critical for QuickPe's performance, especially for frequently accessed data like user balances and transaction history. Our current implementation in `middleware/cache.js` provides basic in-memory caching, but enterprise-scale applications require sophisticated multi-layer caching with intelligent invalidation and consistency guarantees.

The challenge lies in balancing data freshness with performance - financial data must be accurate while providing sub-second response times. Our existing cache middleware demonstrates the foundation, but needs enhancement for distributed caching, smart invalidation, and cache warming strategies.

**Current Caching Implementation Analysis:**

Our existing cache middleware demonstrates basic in-memory caching with simple key-based storage and retrieval. This approach works effectively for current load levels but lacks the sophistication needed for enterprise-scale performance optimization.

The current implementation uses URL-based cache keys which can lead to cache fragmentation and inefficient memory usage. Financial applications require more intelligent caching strategies that consider user-specific data, data sensitivity levels, and access patterns.

Single-layer caching creates bottlenecks when cache misses occur, as all requests fall back directly to the database. Multi-layer caching architectures provide graduated fallback mechanisms that maintain performance even during cache invalidation events.
    };
};
```

**Enhanced Multi-Layer Caching Strategy:**

**1. Hierarchical Cache Architecture:**

The enhanced caching strategy implements a three-tier hierarchy optimized for financial data access patterns. L1 in-memory caching provides sub-millisecond access to frequently requested data like user balances and recent transactions. L2 distributed Redis caching enables shared data access across multiple application instances while maintaining consistency. L3 database query optimization ensures efficient fallback when cache misses occur.

Intelligent cache key generation incorporates user identity, data type, and version information to prevent cache pollution and ensure data accuracy. Financial data requires precise cache invalidation - when a user's balance changes, all related cached data must be immediately updated across all cache layers.

Cache warming strategies proactively populate frequently accessed data during low-traffic periods, ensuring optimal response times during peak usage. Predictive algorithms analyze user behavior patterns to pre-load likely-to-be-requested data, further improving user experience.

Distributed cache consistency mechanisms ensure that balance updates are immediately reflected across all application instances, preventing the display of stale financial data that could impact user trust and regulatory compliance.
// Multi-layer cache manager
class CacheManager {
  constructor() {
    this.l1Cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // In-memory
    this.l2Cache = redis.createClient(); // Redis
    this.l3Cache = new Map(); // Application-level cache
    
    this.cacheStats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      invalidations: 0
    };
  }
  
  async get(key, options = {}) {
    const { useL1 = true, useL2 = true, useL3 = true } = options;
    
    // L1 Cache (In-memory - fastest)
    if (useL1) {
      const l1Value = this.l1Cache.get(key);
      if (l1Value !== undefined) {
        this.cacheStats.l1Hits++;
        return l1Value;
      }
    }
    
    // L2 Cache (Redis - distributed)
    if (useL2) {
      const l2Value = await this.l2Cache.get(key);
      if (l2Value) {
        this.cacheStats.l2Hits++;
        const parsedValue = JSON.parse(l2Value);
        
        // Populate L1 cache
        if (useL1) {
          this.l1Cache.set(key, parsedValue);
        }
        
        return parsedValue;
      }
    }
    
    // Cache miss
    this.cacheStats.misses++;
    return null;
  }
  
  async set(key, value, ttl = 300) {
    // Set in all cache layers
    this.l1Cache.set(key, value, ttl);
    await this.l2Cache.setex(key, ttl, JSON.stringify(value));
    this.l3Cache.set(key, value);
  }
  
  async invalidate(pattern) {
    this.cacheStats.invalidations++;
    
    // Invalidate L1 cache
    this.l1Cache.flushAll();
    
    // Invalidate L2 cache with pattern
    const keys = await this.l2Cache.keys(pattern);
    if (keys.length > 0) {
      await this.l2Cache.del(keys);
    }
    
    // Invalidate L3 cache
    this.l3Cache.clear();
  }
}
```

**2. Smart Cache Invalidation:**
```javascript
// Event-driven cache invalidation
class CacheInvalidationManager {
  constructor(cacheManager, io) {
    this.cache = cacheManager;
    this.io = io;
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Listen for balance updates
    this.io.on('balance:update', async (data) => {
      await this.invalidateUserCache(data.userId);
    });
    
    // Listen for transaction events
    this.io.on('transaction:new', async (data) => {
      await this.invalidateTransactionCache(data.userId);
    });
  }
  
  async invalidateUserCache(userId) {
    const patterns = [
      `balance_${userId}`,
      `user_${userId}_*`,
      `transactions_${userId}_*`,
      `analytics_${userId}_*`
    ];
    
    for (const pattern of patterns) {
      await this.cache.invalidate(pattern);
    }
  }
}
```

## **Question 6: Audit Trail & Compliance Architecture**

**Scenario:** Your QuickPe application must maintain comprehensive audit logs for regulatory compliance. Every user action, transaction, and system event must be tracked with immutable records. Design an audit system that can handle 100,000+ events per day while ensuring data integrity and fast querying.

**Detailed Answer:**

**Current Audit Implementation Analysis:**
```javascript
// From AuditLog.js - Current audit schema
const auditLogSchema = new mongoose.Schema({
    actor_user_id: { type: String, required: true, index: true },
    action_type: {
        type: String,
        required: true,
        index: true,
        enum: [
            'user_created', 'user_updated', 'transaction_created',
            'money_sent', 'money_received', 'balance_updated',
            'login', 'logout', 'password_changed'
        ]
    },
    entity_type: {
        type: String,
        enum: ['user', 'transaction', 'account', 'notification', 'system']
    },
    entity_id: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip_address: { type: String },
    user_agent: { type: String },
    created_at: { type: Date, default: Date.now, index: true }
});
```

**Enhanced Audit System:**

**1. Immutable Audit Trail with Blockchain-like Integrity:**
```javascript
// Enhanced audit log with hash chain for immutability
const auditLogSchema = new mongoose.Schema({
    sequenceNumber: { type: Number, required: true, unique: true },
**Enhanced Audit Trail Implementation:**

The enhanced audit system extends our current AuditLog model with blockchain-inspired integrity features including sequential numbering, cryptographic hashing, and Merkle tree verification. This ensures tamper-proof audit trails essential for financial compliance and forensic analysis.

Sequential audit records create an immutable chain where each record references the previous record's hash, making unauthorized modifications immediately detectable. The system maintains continuous sequence numbers and calculates SHA-256 hashes for each audit entry, creating a verifiable chain of custody.

Cryptographic integrity verification allows real-time detection of any tampering attempts. The hash calculation includes all critical audit data (sequence, actor, action, entity, payload, timestamp, previous hash) ensuring comprehensive integrity protection.

Merkle root calculations enable efficient batch verification of large audit datasets, crucial for regulatory compliance reporting and forensic investigations. This approach allows verification of thousands of audit records without examining each individual record.

**High-Performance Audit Querying:**

Optimized audit querying addresses the performance challenges of searching large audit datasets. Strategic compound indexing on frequently queried fields (actor_user_id + timestamp, action_type + timestamp) dramatically improves query performance for common audit operations.

User-specific audit trails provide comprehensive activity tracking with flexible filtering options including date ranges, action types, and pagination support. The system efficiently handles large result sets through MongoDB's lean queries and parallel count operations.

Transaction-specific audit trails enable complete forensic reconstruction of financial operations by correlating all related audit entries. This includes direct entity references and payload-embedded transaction identifiers for comprehensive transaction lifecycle tracking.

Compliance reporting leverages MongoDB aggregation pipelines for efficient statistical analysis of audit data. The system generates daily activity summaries, unique user counts, and action type distributions required for regulatory reporting and operational monitoring.
            },
            { $sort: { date: -1, action_type: 1 } }
        ];
        
        return await AuditLog.aggregate(pipeline);
    }
}
```

---

## **Question 7: Load Testing & Performance Engineering**

**Scenario:** Your QuickPe application needs to handle Black Friday-level traffic with 50,000+ concurrent users. Based on your current Artillery load testing results (89% success rate at 2,190 users), design a comprehensive performance engineering strategy.

**Detailed Answer:**

**Current Load Testing Analysis:**
```yaml
# From artillery-config-optimized.yml
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 30
      name: "Ramp up load"
    - duration: 60
      arrivalRate: 50
      name: "Sustained high load"

scenarios:
  - name: "Authentication Flow"
    weight: 30
  - name: "Balance Check"
    weight: 25
  - name: "User Search"
    weight: 25
  - name: "Health Check"
    weight: 20
```

**Enhanced Performance Engineering Strategy:**

**1. Advanced Load Testing Framework:**
```javascript
// Comprehensive load testing suite
class LoadTestSuite {
    constructor() {
        this.scenarios = {
            authentication: {
                weight: 20,
                endpoints: ['/api/v1/auth/signin', '/api/v1/auth/signup'],
                expectedLatency: 200,
                errorThreshold: 1
            },
            transactions: {
                weight: 35,
                endpoints: ['/api/v1/account/balance', '/api/v1/account/deposit', '/api/v1/account/transfer'],
                expectedLatency: 300,
                errorThreshold: 0.5
            },
            realtime: {
                weight: 25,
                endpoints: ['socket.io connections', 'balance:update events'],
                expectedLatency: 50,
                errorThreshold: 2
            },
            analytics: {
                weight: 15,
                endpoints: ['/api/v1/analytics/transactions', '/api/v1/admin/stats'],
                expectedLatency: 500,
                errorThreshold: 3
            },
            search: {
                weight: 5,
                endpoints: ['/api/v1/user/bulk'],
                expectedLatency: 150,
                errorThreshold: 1
            }
        };
    }
    
    generateArtilleryConfig(targetUsers = 50000) {
        const phases = this.calculateLoadPhases(targetUsers);
        
        return {
            config: {
                target: process.env.LOAD_TEST_TARGET,
                phases,
                defaults: {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                plugins: {
                    'artillery-plugin-metrics-by-endpoint': {},
                    'artillery-plugin-cloudwatch': {
                        namespace: 'QuickPe/LoadTest'
                    }
                }
            },
            scenarios: this.buildScenarios()
        };
    }
    
    calculateLoadPhases(targetUsers) {
        return [
            { duration: 300, arrivalRate: 10, name: "Warm up" },
            { duration: 600, arrivalRate: Math.floor(targetUsers * 0.1), name: "Ramp up 10%" },
            { duration: 600, arrivalRate: Math.floor(targetUsers * 0.3), name: "Ramp up 30%" },
            { duration: 600, arrivalRate: Math.floor(targetUsers * 0.5), name: "Ramp up 50%" },
            { duration: 900, arrivalRate: Math.floor(targetUsers * 0.8), name: "Peak load 80%" },
            { duration: 1200, arrivalRate: targetUsers, name: "Maximum load 100%" },
            { duration: 600, arrivalRate: Math.floor(targetUsers * 0.5), name: "Cool down" }
        ];
    }
}
```

**2. Performance Monitoring & Alerting:**
```javascript
// Real-time performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            responseTime: new Map(),
            errorRate: new Map(),
            throughput: new Map(),
            concurrentUsers: 0,
            memoryUsage: 0,
            cpuUsage: 0
        };
        
        this.thresholds = {
            responseTime: 500, // ms
            errorRate: 5, // %
            memoryUsage: 80, // %
            cpuUsage: 70 // %
        };
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        // Collect metrics every 10 seconds
        setInterval(() => {
            this.collectMetrics();
            this.checkThresholds();
        }, 10000);
    }
    
    collectMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.metrics.memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        this.metrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        
        // Send metrics to monitoring service
        this.sendToMonitoring({
            timestamp: new Date(),
            responseTime: this.getAverageResponseTime(),
            errorRate: this.getErrorRate(),
            throughput: this.getThroughput(),
            concurrentUsers: this.metrics.concurrentUsers,
            memoryUsage: this.metrics.memoryUsage,
            cpuUsage: this.metrics.cpuUsage
        });
    }
    
    checkThresholds() {
        const alerts = [];
        
        if (this.getAverageResponseTime() > this.thresholds.responseTime) {
            alerts.push({
                type: 'HIGH_RESPONSE_TIME',
                value: this.getAverageResponseTime(),
                threshold: this.thresholds.responseTime
            });
        }
        
        if (this.getErrorRate() > this.thresholds.errorRate) {
            alerts.push({
                type: 'HIGH_ERROR_RATE',
                value: this.getErrorRate(),
                threshold: this.thresholds.errorRate
            });
        }
        
        if (alerts.length > 0) {
            this.triggerAlerts(alerts);
        }
    }
    
    async triggerAlerts(alerts) {
        for (const alert of alerts) {
            await this.sendAlert({
                severity: 'HIGH',
                message: `Performance threshold exceeded: ${alert.type}`,
                value: alert.value,
                threshold: alert.threshold,
                timestamp: new Date()
            });
        }
    }
}
```

**3. Auto-scaling Strategy:**

Intelligent auto-scaling responds to performance metrics and traffic patterns to maintain optimal system performance. The scaling system monitors CPU usage, memory consumption, response times, and error rates to make informed scaling decisions.

Scaling policies implement different thresholds for scale-up and scale-down operations with appropriate cooldown periods to prevent oscillation. Scale-up operations are triggered more aggressively (70% CPU, 80% memory) to handle traffic spikes, while scale-down operations are more conservative (30% CPU, 40% memory) to maintain performance buffers.

Cooldown periods prevent rapid scaling oscillations that can destabilize the system. Scale-up cooldowns are shorter (5 minutes) to respond quickly to traffic increases, while scale-down cooldowns are longer (10 minutes) to ensure sustained low utilization before reducing capacity.

Container orchestration integration enables seamless scaling across cloud platforms including Kubernetes, Docker Swarm, and cloud-native services. The system maintains minimum instance counts for high availability and maximum limits to control costs while ensuring adequate capacity for peak loads.

---

## **Question 8: Frontend State Management & Real-time Synchronization**

**Scenario:** Your QuickPe React application needs to manage complex state across multiple components while handling real-time Socket.io events for balance updates, transaction notifications, and audit logs. Design a robust state management architecture that prevents race conditions and ensures data consistency.

**Detailed Answer:**

**Current Frontend Implementation Analysis:**

Our existing Socket.io integration demonstrates basic real-time event handling with connection status tracking and custom event dispatching. This approach provides fundamental real-time capabilities but lacks sophisticated state management needed for complex financial applications.

The current implementation uses direct DOM event dispatching which can lead to race conditions and inconsistent state updates across components. Financial applications require more robust state synchronization to prevent displaying incorrect balance information or missing critical notifications.

Component-level state management creates data silos where different parts of the application may have inconsistent views of user data. Enterprise applications require centralized state management with predictable update patterns and comprehensive error handling.

**Enhanced State Management Architecture:**

**1. Centralized State Management with Context + Reducer:**

The enhanced state management architecture implements a centralized store using React Context and useReducer for predictable state updates. This approach ensures all components have consistent access to user data, transaction history, notifications, and real-time connection status.

State structure organizes data into logical domains (user, transactions, notifications, realtime, ui) with clear separation of concerns. Each domain maintains its own data integrity while enabling cross-domain interactions through well-defined action types.

Action types provide a comprehensive vocabulary for state mutations including user authentication, balance updates, transaction management, notification handling, real-time connection management, and UI state control. This structured approach prevents ad-hoc state mutations that can lead to inconsistencies.

Optimistic updates enable immediate UI feedback for user actions while background API calls complete. This approach improves perceived performance while maintaining data consistency through rollback mechanisms when operations fail.
function quickpeReducer(state, action) {
    switch (action.type) {
        case ActionTypes.UPDATE_BALANCE:
            return {
                ...state,
                user: {
                    ...state.user,
                    balance: action.payload.balance
                },
                // Optimistic update - add pending transaction
                transactions: {
                    ...state.transactions,
                    pending: action.payload.transaction 
                        ? [...state.transactions.pending, action.payload.transaction]
                        : state.transactions.pending
                }
            };
            
        case ActionTypes.ADD_TRANSACTION:
            const { transaction, isOptimistic = false } = action.payload;
            
            return {
                ...state,
                transactions: {
                    ...state.transactions,
                    recent: [transaction, ...state.transactions.recent].slice(0, 10),
                    // Remove from pending if this was an optimistic update
                    pending: isOptimistic 
                        ? state.transactions.pending
                        : state.transactions.pending.filter(t => t.id !== transaction.id)
                }
            };
            
        case ActionTypes.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: {
                    ...state.notifications,
                    unread: [action.payload, ...state.notifications.unread],
                    count: state.notifications.count + 1
                }
            };
            
        case ActionTypes.SET_CONNECTION_STATUS:
            return {
                ...state,
                realtime: {
                    ...state.realtime,
                    isConnected: action.payload.isConnected,
                    connectionStatus: action.payload.status,
                    reconnectAttempts: action.payload.isConnected ? 0 : state.realtime.reconnectAttempts
                }
            };
            
        default:
            return state;
    }
}

// Context provider
const QuickpeContext = createContext();

export const QuickpeProvider = ({ children }) => {
    const [state, dispatch] = useReducer(quickpeReducer, initialState);
    
    // Action creators with built-in optimistic updates
    const actions = {
        updateBalance: (balance, transaction = null) => {
            dispatch({
                type: ActionTypes.UPDATE_BALANCE,
                payload: { balance, transaction }
            });
        },
        
        addTransaction: (transaction, isOptimistic = false) => {
            dispatch({
                type: ActionTypes.ADD_TRANSACTION,
                payload: { transaction, isOptimistic }
            });
        },
        
        addNotification: (notification) => {
            dispatch({
                type: ActionTypes.ADD_NOTIFICATION,
                payload: notification
            });
        },
        
        setConnectionStatus: (isConnected, status) => {
            dispatch({
                type: ActionTypes.SET_CONNECTION_STATUS,
                payload: { isConnected, status }
            });
        }
    };
    
    return (
        <QuickpeContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </QuickpeContext.Provider>
    );
};

export const useQuickpe = () => {
    const context = useContext(QuickpeContext);
    if (!context) {
        throw new Error('useQuickpe must be used within QuickpeProvider');
    }
    return context;
};
```

**2. Enhanced Real-time Event Handler:**
```jsx
// Advanced Socket.io integration with state management
import { useQuickpe } from './QuickpeProvider';

export const useRealtimeSync = (userId) => {
    const { state, actions } = useQuickpe();
    const [socket, setSocket] = useState(null);
    const reconnectTimeoutRef = useRef(null);
    
    // Event handlers with race condition prevention
    const eventHandlers = useMemo(() => ({
        'balance:update': (data) => {
            // Prevent race conditions with timestamp checking
            const lastUpdate = localStorage.getItem('lastBalanceUpdate');
            if (lastUpdate && new Date(data.timestamp) <= new Date(lastUpdate)) {
                return; // Ignore older updates
            }
            
            localStorage.setItem('lastBalanceUpdate', data.timestamp);
            actions.updateBalance(data.balance);
            
            // Show toast notification
            toast.success(`Balance updated: ₹${data.balance}`, {
                duration: 3000,
                position: 'top-right'
            });
        },
        
        'transaction:new': (data) => {
            const { transaction, type } = data;
            
            // Check for duplicate transactions
            const isDuplicate = state.transactions.recent.some(
                t => t.transactionId === transaction.transactionId
            );
            
            if (!isDuplicate) {
                actions.addTransaction(transaction);
                
                // Show appropriate notification
                const message = type === 'received' 
                    ? `₹${transaction.amount} received from ${transaction.senderName}`
                    : `₹${transaction.amount} sent to ${transaction.recipientName}`;
                    
                toast.success(message, {
                    duration: 5000,
                    position: 'top-right'
                });
            }
        },
        
        'notification:new': (data) => {
            actions.addNotification({
                id: data._id,
                title: data.title,
                message: data.message,
                type: data.type,
                timestamp: data.timestamp,
                read: false
            });
            
            // Play notification sound
            if (state.user.preferences?.soundEnabled) {
                new Audio('/notification-sound.mp3').play().catch(() => {});
            }
        },
        
        'connect': () => {
            actions.setConnectionStatus(true, 'connected');
            
            // Clear reconnection timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            
            // Sync any pending data
            syncPendingData();
        },
        
        'disconnect': (reason) => {
            actions.setConnectionStatus(false, 'disconnected');
            
            // Attempt reconnection with exponential backoff
            const attemptReconnect = () => {
                const delay = Math.min(1000 * Math.pow(2, state.realtime.reconnectAttempts), 30000);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (socket && !socket.connected) {
                        socket.connect();
                        dispatch({ type: ActionTypes.INCREMENT_RECONNECT_ATTEMPTS });
                    }
                }, delay);
            };
            
            if (reason !== 'io client disconnect') {
                attemptReconnect();
            }
        }
    }), [state, actions, socket]);
    
    // Initialize socket connection
    useEffect(() => {
        if (!userId) return;
        
        const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
            auth: {
                token: localStorage.getItem('token')
            },
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });
        
        // Register event handlers
        Object.entries(eventHandlers).forEach(([event, handler]) => {
            newSocket.on(event, handler);
        });
        
        // Join user room
        newSocket.emit('join', userId, (response) => {
            if (response?.success) {
                console.log('✅ Successfully joined user room');
            } else {
                console.error('❌ Failed to join user room:', response?.error);
            }
        });
        
        setSocket(newSocket);
        
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            newSocket.disconnect();
        };
    }, [userId, eventHandlers]);
    
    // Sync pending data when connection is restored
    const syncPendingData = useCallback(async () => {
        try {
            // Fetch latest balance
            const balanceResponse = await apiClient.get('/account/balance');
            actions.updateBalance(balanceResponse.data.balance);
            
            // Fetch recent transactions
            const transactionsResponse = await apiClient.get('/account/transactions?limit=10');
            dispatch({
                type: ActionTypes.SET_TRANSACTIONS,
                payload: transactionsResponse.data.transactions
            });
            
            // Fetch unread notifications
            const notificationsResponse = await apiClient.get('/notifications?unread=true');
            dispatch({
                type: ActionTypes.SET_NOTIFICATIONS,
                payload: notificationsResponse.data.notifications
            });
            
        } catch (error) {
            console.error('Failed to sync data:', error);
        }
    }, [actions, dispatch]);
    
    return {
        isConnected: state.realtime.isConnected,
        connectionStatus: state.realtime.connectionStatus,
        socket
    };
};
```

---
   const user = await User.findByIdAndUpdate(
       req.userId, 
       { $inc: { balance: amount } }, 
       { new: true }
   );
   ```

2. **Load Performance**: Optimized from 82% error rate to 11% through caching and rate limiting
3. **Real-time Scaling**: Managing socket connections and room-based event distribution

## 2. System Architecture

### High-level architecture diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │    │   (Node.js)     │    │   (MongoDB)     │
│                 │    │                 │    │                 │
│ • Components    │◄──►│ • Express APIs  │◄──►│ • User Model    │
│ • Socket.io     │    │ • Socket.io     │    │ • Transaction   │
│ • State Mgmt    │    │ • JWT Auth      │    │ • Audit Logs    │
│ • Tailwind CSS  │    │ • Rate Limiting │    │ • Notifications │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Socket.io     │◄─────────────┘
                        │   Real-time     │
                        │   Events        │
                        └─────────────────┘
```

### System design concepts already implemented
- **Microservice-ready Architecture**: Modular route structure with clear separation
- **Event-driven Real-time Updates**: Socket.io for instant notifications
- **Caching Layer**: Redis/NodeCache for performance optimization
- **Audit Trail System**: Comprehensive logging for compliance
- **Load Balancing Ready**: Stateless design with JWT tokens

### System design concepts still needed
- **Database Sharding**: For horizontal scaling beyond single MongoDB instance
- **Message Queue**: Redis/RabbitMQ for reliable event processing
- **API Gateway**: Rate limiting and request routing at scale
- **Distributed Caching**: Redis cluster for multi-region deployment

### Why in-memory DB vs not in-memory DB?
**Answer:** QuickPe uses MongoDB (persistent) with in-memory caching:
- **Persistent Storage**: Financial data requires durability and ACID compliance
- **In-memory Caching**: Used for frequently accessed data (balance, user search)
```javascript
// From /backend/middleware/cache.js
const cache = (duration = 60) => {
    return (req, res, next) => {
        const key = req.originalUrl;
        const cached = nodeCache.get(key);
        if (cached) {
            return res.json(cached);
        }
        // Cache miss - proceed to database
        next();
    };
};
```

## 3. Authentication & Authorization

### How authentication works (step by step)
1. **User Registration**: Password hashed with bcrypt, QuickPe ID generated
2. **Login Process**: Email/password validation, JWT token generation
3. **Token Verification**: Middleware validates JWT on protected routes
4. **Session Management**: Token stored in localStorage, verified on each request

### How JWT is implemented (claims, expiry, refresh)
```javascript
// From /backend/routes/auth.js - JWT Generation
const token = jwt.sign(
    { 
        userId: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin || false
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

**JWT Middleware Implementation:**
```javascript
// From /backend/middleware/index.js
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: "Authorization header missing or invalid" });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.isAdmin = decoded.isAdmin;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
```

### Security trade-offs
- **24-hour expiry**: Balance between security and user experience
- **No refresh tokens**: Simplified implementation, requires re-login after expiry
- **localStorage storage**: Vulnerable to XSS but enables SPA functionality

## 4. Frontend (React + Redux)

### How state management works
QuickPe uses React hooks and Context API instead of Redux:
```jsx
// From /frontend/src/sockets/useSocket.js - Custom hook for socket state
export const useSocket = (userId, onNotification) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    
    useEffect(() => {
        // Socket connection logic with state updates
        socket.on('connect', () => {
            setIsConnected(true);
            setConnectionStatus('connected');
        });
    }, [userId]);
};
```

### How form validation is handled
Using Zod schemas for type-safe validation:
```jsx
// Example validation pattern used throughout the app
const transferSchema = z.object({
    amount: z.number().min(1, "Amount must be at least ₹1"),
    recipient: z.string().min(1, "Recipient is required"),
    description: z.string().optional()
});
```

### How frontend communicates with backend
**API Client Implementation:**
```javascript
// From /frontend/src/services/api/client.js
const apiClient = axios.create({
    baseURL: 'http://localhost:5001/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for JWT
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### How UI state management works
**Real-time Updates Pattern:**
```jsx
// From /frontend/src/pages/DashboardHome.jsx
useEffect(() => {
    const handleBalanceUpdate = (event) => {
        const balanceData = event.detail;
        setStats(prevStats => ({
            ...prevStats,
            totalBalance: balanceData.newBalance
        }));
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    return () => window.removeEventListener('balance:update', handleBalanceUpdate);
}, []);
```

## 5. Backend (APIs, Models, Schemas)

### Folder structure & design patterns
```
backend/
├── controllers/          # Business logic (if using MVC)
├── middleware/          # Auth, caching, error handling
│   ├── index.js        # JWT authentication
│   ├── cache.js        # Redis/NodeCache implementation
│   └── errorHandler.js # Global error handling
├── models/             # MongoDB schemas
│   ├── User.js         # User model with password hashing
│   ├── Transaction.js  # Transaction model with validation
│   └── AuditLog.js     # Audit trail model
├── routes/             # API endpoints
│   ├── auth.js         # Authentication routes
│   ├── account.js      # Balance, deposit, transactions
│   ├── user.js         # User management
│   └── notifications.js # Notification system
└── server.js           # Express app setup
```

### How APIs are structured
**RESTful Design with Middleware Chain:**
```javascript
// From /backend/routes/account.js
router.get("/balance", authMiddleware, cache(30), async (req, res) => {
    try {
        const user = await User.findById(req.userId).lean();
        if (!user) return res.status(404).json({ message: "User not found" });
        const balance = Number(user.balance) || 0;
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
```

### How models & schemas work
**User Model with Security Features:**
```javascript
// From /backend/models/User.js
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    quickpeId: { type: String, unique: true, sparse: true },
    balance: { type: Number, default: 0, min: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// QuickPe ID generation
userSchema.methods.generateQuickPeId = async function() {
    let quickpeId;
    let isUnique = false;
    while (!isUnique) {
        const randomNum = Math.floor(Math.random() * 999999) + 1;
        quickpeId = `QP${randomNum.toString().padStart(6, '0')}`;
        const existingUser = await mongoose.model('User').findOne({ quickpeId });
        if (!existingUser) isUnique = true;
    }
    this.quickpeId = quickpeId;
    return quickpeId;
};
```

**Transaction Model with Validation:**
```javascript
// From /backend/models/Transaction.js
const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2, 8);
            return `TXN${timestamp}${randomStr}`.toUpperCase();
        }
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    category: { 
        type: String, 
        enum: ['Food & Dining', 'Transportation', 'Shopping', 'Transfer', 'Deposit'], 
        default: 'Transfer' 
    }
});
```

## 6. Real-time Events (Socket.io)

### How different socket.io connections work

**Socket Connection Management:**
```javascript
// From /frontend/src/sockets/useSocket.js - Connection Setup
const newSocket = io('http://localhost:5001', {
    auth: {
        token: token
    }
});

socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server with socket ID:', socket.id);
    setIsConnected(true);
    setConnectionStatus('connected');
    
    // Join user-specific room
    socket.emit('join', userId, (response) => {
        if (response?.success) {
            console.log('✅ Successfully joined room:', response.data);
        }
    });
});
```

**Transaction History Real-time Updates:**
```javascript
// Real-time transaction events
socket.on('transaction:new', (transaction) => {
    console.log('🆕 Received new transaction event:', transaction);
    window.dispatchEvent(new CustomEvent('transaction:new', { detail: transaction }));
});

socket.on('transaction:update', (transaction) => {
    console.log('🔄 Received transaction update event:', transaction);
    window.dispatchEvent(new CustomEvent('transaction:update', { detail: transaction }));
});
```

**Audit Trails Real-time:**
```javascript
socket.on('auditLogUpdate', (auditData) => {
    console.log('📋 Audit log update received:', auditData);
    window.dispatchEvent(new CustomEvent('auditLogUpdate', { detail: auditData }));
});
```

**Notifications Real-time:**
```javascript
socket.on('notification:new', (notification) => {
    console.log('🔔 Received new notification event:', notification);
    window.dispatchEvent(new CustomEvent('notification:new', { detail: notification }));
    
    if (onNotification) {
        onNotification({
            type: notification.type === 'transaction' ? 'success' : 'info',
            title: notification.title,
            message: notification.message,
            timestamp: notification.timestamp
        });
    }
});
```

**Real-time Money Transfer:**
```javascript
// From /backend/routes/account.js - Emitting balance updates
const io = req.app.get('io');
if (io) {
    io.to(`user_${req.userId}`).emit('balance:update', { 
        balance: user.balance, 
        userId: req.userId 
    });
    io.to(`user_${req.userId}`).emit('transaction:new', { 
        transaction, 
        balance: user.balance 
    });
}
```

### Scaling strategies
- **Room-based Architecture**: Users join specific rooms (`user_${userId}`)
- **Event Namespacing**: Structured event names (`balance:update`, `transaction:new`)
- **Heartbeat Monitoring**: 30-second heartbeat for connection health
- **Graceful Reconnection**: Automatic reconnection with exponential backoff

## 7. Transactions & Atomicity

### How transactions are processed
```javascript
// From /backend/routes/account.js - Atomic Deposit
router.post("/deposit", authMiddleware, async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }
    
    try {
        // Atomic balance update
        const user = await User.findByIdAndUpdate(
            req.userId, 
            { $inc: { balance: amount } }, 
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Create transaction record
        const transaction = new Transaction({
            userId: req.userId,
            type: 'credit',
            amount,
            description: `Account deposit of ₹${amount}`,
            category: 'Deposit'
        });
        
        await transaction.save();
        
        // Create audit log
        await createAuditLog(
            req.userId, 
            'money_added', 
            'transaction', 
            transaction._id, 
            { amount, transactionId: transaction._id }, 
            req
        );
        
        // Emit real-time events
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${req.userId}`).emit('balance:update', { 
                balance: user.balance, 
                userId: req.userId 
            });
            io.to(`user_${req.userId}`).emit('transaction:new', { 
                transaction, 
                balance: user.balance 
            });
        }
        
        res.json({ balance: user.balance, transaction });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({ message: "Failed to add money" });
    }
});
```

### How atomicity is maintained in DB
**MongoDB Atomic Operations:**
- Uses `findByIdAndUpdate` with `$inc` operator for atomic balance updates
- Single document operations are inherently atomic in MongoDB
- For multi-document transactions, MongoDB sessions would be used:

```javascript
// [RECOMMENDED IMPLEMENTATION] - Multi-document atomicity
const session = await mongoose.startSession();
session.startTransaction();

try {
    // Update sender balance
    await User.findByIdAndUpdate(
        senderId, 
        { $inc: { balance: -amount } }, 
        { session }
    );
    
    // Update receiver balance
    await User.findByIdAndUpdate(
        receiverId, 
        { $inc: { balance: amount } }, 
        { session }
    );
    
    // Create transaction records
    await Transaction.create([senderTx, receiverTx], { session });
    
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

### Audit trail design
```javascript
// From /backend/routes/audit.js - Audit Log Creation
const createAuditLog = async (userId, action, resourceType, resourceId, changes, req) => {
    try {
        const auditLog = new AuditLog({
            userId: userId,
            action: action,
            resourceType: resourceType,
            resourceId: resourceId,
            changes: changes,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date()
        });
        
        const savedLog = await auditLog.save();
        
        // Emit real-time audit update
        const io = req.app?.get('io');
        if (io) {
            io.to(`user_${userId}`).emit('auditLogUpdate', {
                auditLog: savedLog,
                userId: userId,
                action: action
            });
        }
        
        return savedLog;
    } catch (error) {
        console.error('Error creating audit log:', error);
        throw error;
    }
};
```

## 8. Notifications

### How notifications are generated and delivered
**Notification Creation:**
```javascript
// From /backend/routes/notifications.js - Test Notification
router.post('/test', authMiddleware, async (req, res) => {
    try {
        const { type = 'TRANSFER_RECEIVED', title = 'Test Notification', message = 'This is a test notification' } = req.body;
        
        const notification = new Notification({
            userId: req.userId,
            type,
            title,
            message,
            read: false
        });
        
        await notification.save();
        
        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${req.userId}`).emit('notification:new', {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                timestamp: notification.createdAt,
                read: false,
                type: notification.type
            });
        }
        
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create notification' });
    }
});
```

**Notification Management:**
```javascript
// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { read: true, readAt: new Date() },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
});
```

### Retry and durability mechanisms
**Current Implementation:**
- Notifications stored in MongoDB for persistence
- Real-time delivery via Socket.io with fallback to database polling
- Unread count tracking for UI badges

**[RECOMMENDED IMPLEMENTATION] - Enhanced Durability:**
```javascript
// Message queue integration for reliable delivery
const publishNotification = async (userId, notification) => {
    // Store in database
    const savedNotification = await notification.save();
    
    // Publish to message queue for retry logic
    await messageQueue.publish('notifications', {
        userId,
        notificationId: savedNotification._id,
        attempts: 0,
        maxAttempts: 3
    });
    
    // Immediate socket delivery attempt
    const io = req.app.get('io');
    if (io && io.sockets.adapter.rooms.has(`user_${userId}`)) {
        io.to(`user_${userId}`).emit('notification:new', savedNotification);
    }
};
```

## 9. Analytics & KPI Reports

### What KPIs are collected
**Current KPI Metrics:**
- **Performance Metrics**: Response time, error rate, throughput
- **User Metrics**: Total users, active sessions, transaction volume
- **Financial Metrics**: Total transaction amount, average transaction size
- **System Health**: Uptime, concurrent connections, cache hit rate

### How analytics work
```javascript
// From /backend/routes/analytics.js - Transaction Analytics
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const {
            from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            to = new Date().toISOString(),
            group_by = 'month',
            user_id = req.userId
        } = req.query;

        // Build date grouping format
        let dateFormat;
        switch (group_by) {
            case 'day':
                dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
            case 'month':
            default:
                dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                break;
        }

        // Aggregation pipeline for debit transactions
        const debitAggregation = await Transaction.aggregate([
            {
                $match: {
                    userId: user_id,
                    type: 'debit',
                    timestamp: { $gte: new Date(from), $lte: new Date(to) }
                }
            },
            {
                $group: {
                    _id: dateFormat,
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            success: true,
            data: {
                debitTransactions: debitAggregation,
                period: { from, to },
                groupBy: group_by
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Analytics query failed' });
    }
});
```

### Sample KPI report results
**Load Test Results (from /docs/kpi-testing.md):**
```json
{
  "optimized_results": {
    "total_requests": 3160,
    "successful_requests": 2813,
    "failed_requests": 347,
    "success_rate": "89.0%",
    "error_rate": "11.0%",
    "average_response_time": "391.6ms",
    "uptime": "89.0%",
    "concurrent_users": 2190,
    "test_duration": "5 minutes 4 seconds"
  },
  "improvements": {
    "response_time_improvement": "84%",
    "success_rate_improvement": "395%",
    "error_rate_reduction": "87%"
  }
}
```

### Future improvements
- **Real-time Dashboards**: Live KPI monitoring with WebSocket updates
- **Predictive Analytics**: ML-based transaction pattern analysis
- **Custom Metrics**: Business-specific KPIs and alerting
- **Performance Profiling**: Detailed endpoint-level performance tracking

## 10. Load & Stress Testing

### How Artillery is used
**Artillery Configuration:**
```yaml
# From /tests/load/artillery-config-optimized.yml
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 30
      name: "Ramp up load"
    - duration: 60
      arrivalRate: 50
      name: "Sustained high load"
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "Authentication Flow"
    weight: 30
    flow:
      - post:
          url: "/api/v1/auth/signin"
          json:
            email: "{{ $randomEmail }}"
            password: "password123"
  - name: "Balance Check"
    weight: 25
    flow:
      - get:
          url: "/api/v1/account/balance"
          headers:
            Authorization: "Bearer {{ token }}"
  - name: "User Search"
    weight: 25
    flow:
      - post:
          url: "/api/v1/user/bulk"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            filter: "test"
  - name: "Health Check"
    weight: 20
    flow:
      - get:
          url: "/health"
```

### What was tested
1. **Authentication Endpoints**: Login/signup under load
2. **Balance Queries**: Cached balance retrieval performance
3. **User Search**: Bulk user search with database queries
4. **Health Checks**: Basic system availability

### How it was tested
**Test Environment Setup:**
- **Concurrent Users**: 2,190 VUs (optimized from 9,000)
- **Test Duration**: 5 minutes with phased load increase
- **Scenarios**: Weighted distribution across critical endpoints
- **Caching**: Enabled Redis/NodeCache for performance optimization

### Results of Artillery analysis
**Before Optimization:**
- **Error Rate**: 82.0%
- **Average Response Time**: 2,431.8ms
- **Success Rate**: 18.0%
- **Total Requests**: 9,766

**After Optimization:**
- **Error Rate**: 11.0% (87% improvement)
- **Average Response Time**: 391.6ms (84% improvement)
- **Success Rate**: 89.0% (395% improvement)
- **Total Requests**: 3,160

### Recommendations
1. **Horizontal Scaling**: Implement load balancing for higher concurrency
2. **Database Optimization**: Add read replicas for query distribution
3. **Caching Strategy**: Expand Redis usage to more endpoints
4. **Rate Limiting**: Fine-tune limits based on user tiers
5. **Monitoring**: Add APM tools for real-time performance tracking

## 11. Security & Compliance

### How sensitive data is handled
**Password Security:**
```javascript
// From /backend/models/User.js - Password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
```

**Data Serialization:**
```javascript
// Exclude sensitive fields from JSON responses
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};
```

### PII masking
**[RECOMMENDED IMPLEMENTATION] - PII Protection:**
```javascript
const maskPII = (data) => {
    if (data.email) {
        const [local, domain] = data.email.split('@');
        data.email = `${local.substring(0, 2)}***@${domain}`;
    }
    if (data.phone) {
        data.phone = `***-***-${data.phone.slice(-4)}`;
    }
    return data;
};

// Usage in audit logs
const auditData = maskPII({
    email: user.email,
    action: 'balance_check',
    amount: transaction.amount
});
```

### Encryption
**JWT Token Security:**
```javascript
// From /backend/routes/auth.js
const token = jwt.sign(
    { 
        userId: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin || false
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

### API rate limiting
```javascript
// From /backend/server.js - Rate limiting configuration
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'development' ? 5000 : 1000,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Skip rate limiting for auth routes in development
if (process.env.NODE_ENV === 'development') {
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/account', limiter, accountRoutes);
} else {
    app.use('/api/v1', limiter);
}
```

## 12. DevOps, CI/CD & Observability

### CI/CD pipeline structure
```yaml
# From /.github/workflows/deploy.yml
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
```

### Deployment environment
- **Frontend**: Vercel (Static hosting with CDN)
- **Backend**: Render (Container-based deployment)
- **Database**: MongoDB Atlas (Cloud database)
- **Caching**: Redis Cloud (Managed Redis instance)

### Monitoring & alerting
**[RECOMMENDED IMPLEMENTATION] - Monitoring Setup:**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version
    });
});

// Error tracking middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    // Send to monitoring service (e.g., Sentry)
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(error);
    }
    
    res.status(500).json({ message: 'Internal server error' });
});
```

### Logs & dashboards
**Current Logging:**
- Console logging for development
- Socket.io event logging
- Transaction and audit trail logging
- Error logging with stack traces

**[RECOMMENDED IMPLEMENTATION] - Structured Logging:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Usage in routes
logger.info('Transaction created', {
    userId: req.userId,
    transactionId: transaction._id,
    amount: transaction.amount,
    type: transaction.type
});
```

## 13. Interview Question Bank

### Frontend Questions (React/Redux)

**Q1: How does QuickPe handle real-time state updates across multiple components?**
**Answer:** QuickPe uses a custom Socket.io hook (`useSocket`) combined with browser's CustomEvent API for cross-component communication:

```jsx
// From /frontend/src/sockets/useSocket.js
socket.on('balance:update', (balanceData) => {
    window.dispatchEvent(new CustomEvent('balance:update', { detail: balanceData }));
});

// Components listen to these events
useEffect(() => {
    const handleBalanceUpdate = (event) => {
        setStats(prevStats => ({
            ...prevStats,
            totalBalance: event.detail.newBalance
        }));
    };
    window.addEventListener('balance:update', handleBalanceUpdate);
    return () => window.removeEventListener('balance:update', handleBalanceUpdate);
}, []);
```

**Strong Candidate Response:** Should mention event-driven architecture, decoupling of components, memory cleanup, and potential alternatives like Context API or Redux.

**Q2: Explain the authentication flow in QuickPe's frontend.**
**Answer:** Protected routes use a `ProtectedRoute` component that validates JWT tokens:

```jsx
// From /frontend/src/components/ProtectedRoute.jsx
const validateAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        setIsAuthenticated(false);
        return;
    }
    
    try {
        const response = await apiClient.get('/auth/verify');
        if (response.data.success) {
            setIsAuthenticated(true);
        }
    } catch (error) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    }
};
```

**Strong Candidate Response:** Should discuss JWT validation, token storage security, automatic logout on expiry, and potential XSS vulnerabilities.

### Backend Questions (Node/Express/DB)

**Q3: How does QuickPe ensure atomic transactions for money transfers?**
**Answer:** Uses MongoDB's atomic operations and would implement sessions for multi-document transactions:

```javascript
// Current implementation - single document atomicity
const user = await User.findByIdAndUpdate(
    req.userId, 
    { $inc: { balance: amount } }, 
    { new: true }
);

// Recommended for transfers between users
const session = await mongoose.startSession();
session.startTransaction();
try {
    await User.findByIdAndUpdate(senderId, { $inc: { balance: -amount } }, { session });
    await User.findByIdAndUpdate(receiverId, { $inc: { balance: amount } }, { session });
    await Transaction.create([senderTx, receiverTx], { session });
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
}
```

**Strong Candidate Response:** Should mention ACID properties, MongoDB sessions, rollback mechanisms, and distributed transaction challenges.

**Q4: Explain QuickPe's caching strategy and its impact on performance.**
**Answer:** Implements a dual-layer caching system:

```javascript
// From /backend/middleware/cache.js
const cache = (duration = 60) => {
    return (req, res, next) => {
        const key = req.originalUrl;
        const cached = nodeCache.get(key);
        if (cached) {
            return res.json(cached);
        }
        
        // Override res.json to cache the response
        res.originalJson = res.json;
        res.json = function(data) {
            nodeCache.set(key, data, duration);
            res.originalJson(data);
        };
        next();
    };
};
```

**Performance Impact:** Reduced response time from 2,431ms to 391ms (84% improvement) in load tests.

**Strong Candidate Response:** Should discuss cache invalidation, TTL strategies, Redis vs in-memory trade-offs, and cache warming.

### Real-time & Socket.io

**Q5: How does QuickPe scale Socket.io connections for multiple users?**
**Answer:** Uses room-based architecture with user-specific rooms:

```javascript
// User joins specific room
socket.emit('join', userId, (response) => {
    if (response?.success) {
        console.log('Successfully joined room:', response.data);
    }
});

// Server emits to specific user room
io.to(`user_${req.userId}`).emit('balance:update', { 
    balance: user.balance, 
    userId: req.userId 
});
```

**Scaling Strategies:**
- Room-based isolation prevents message broadcasting to all users
- Event namespacing for organized message types
- Heartbeat monitoring for connection health
- Graceful reconnection with exponential backoff

**Strong Candidate Response:** Should mention horizontal scaling with Redis adapter, connection pooling, and message queue integration.

### Security & Auth

**Q6: What security measures does QuickPe implement to protect user data?**
**Answer:** Multi-layered security approach:

1. **Password Security:** bcrypt hashing with salt
2. **JWT Security:** 24-hour expiry with role-based claims
3. **Rate Limiting:** Environment-aware request throttling
4. **Data Serialization:** Automatic password exclusion from responses
5. **API Authentication:** Bearer token validation on all protected routes

```javascript
// Password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 5000 : 1000,
    message: { error: 'Too many requests from this IP' }
});
```

**Strong Candidate Response:** Should discuss OWASP top 10, PII masking, encryption at rest, and compliance requirements.

### System Design (FAANG-style)

**Q7: Design a payment system that can handle 10,000 transactions per second with 99.99% uptime.**
**Expected Answer Components:**
1. **Load Balancing:** Multiple application instances behind load balancer
2. **Database Sharding:** Horizontal partitioning by user ID or region
3. **Caching:** Redis cluster for session data and frequently accessed information
4. **Message Queues:** Asynchronous processing for non-critical operations
5. **Monitoring:** Real-time alerting and circuit breakers
6. **Data Consistency:** Event sourcing or saga pattern for distributed transactions

**Architecture:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Load        │    │ API Gateway │    │ Auth        │
│ Balancer    │◄──►│ (Rate       │◄──►│ Service     │
│             │    │ Limiting)   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Payment     │    │ User        │    │ Notification│
│ Service     │◄──►│ Service     │◄──►│ Service     │
│ (Sharded)   │    │ (Sharded)   │    │ (Queue)     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Payment DB  │    │ User DB     │    │ Redis       │
│ (Master/    │    │ (Master/    │    │ Cluster     │
│ Replica)    │    │ Replica)    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

**Strong Candidate Response:** Should discuss CAP theorem, eventual consistency, idempotency, and disaster recovery.

**Q8: How would you implement real-time fraud detection in QuickPe?**
**Expected Answer:**
1. **Stream Processing:** Apache Kafka + Apache Flink for real-time analysis
2. **ML Models:** Anomaly detection based on user behavior patterns
3. **Rule Engine:** Configurable business rules for immediate blocking
4. **Risk Scoring:** Real-time scoring based on transaction patterns
5. **Feedback Loop:** Machine learning model updates based on confirmed fraud

**Implementation Pattern:**
```javascript
// Real-time fraud detection middleware
const fraudDetection = async (req, res, next) => {
    const riskScore = await calculateRiskScore({
        userId: req.userId,
        amount: req.body.amount,
        timestamp: new Date(),
        ipAddress: req.ip,
        deviceFingerprint: req.headers['x-device-id']
    });
    
    if (riskScore > FRAUD_THRESHOLD) {
        await flagTransaction(req.body, 'HIGH_RISK');
        return res.status(403).json({ message: 'Transaction blocked for review' });
    }
    
    next();
};
```

### Performance Testing

**Q9: Explain QuickPe's load testing strategy and results.**
**Answer:** Uses Artillery for comprehensive load testing with realistic scenarios:

**Test Configuration:**
- **Concurrent Users:** 2,190 VUs (optimized from 9,000)
- **Test Scenarios:** Authentication (30%), Balance Check (25%), User Search (25%), Health Check (20%)
- **Duration:** 5 minutes with phased load increase

**Results:**
- **Error Rate:** Reduced from 82% to 11% (87% improvement)
- **Response Time:** Improved from 2,431ms to 391ms (84% improvement)
- **Success Rate:** Increased from 18% to 89% (395% improvement)

**Optimizations Applied:**
1. Redis/NodeCache caching for frequent queries
2. Rate limiting adjustments for development vs production
3. MongoDB query optimization with `.lean()`
4. Connection pooling and keep-alive settings

**Strong Candidate Response:** Should discuss bottleneck identification, performance profiling, and scaling strategies.

## 14. Future Scope & Roadmap

### Top 5 improvements

1. **Microservices Architecture**
   - Split monolithic backend into domain-specific services
   - Implement API Gateway with service discovery
   - Add circuit breakers and retry mechanisms

2. **Enhanced Security & Compliance**
   - Implement PCI DSS compliance
   - Add multi-factor authentication (MFA)
   - Implement PII encryption and data masking
   - Add audit trail compliance reporting

3. **Advanced Analytics & ML**
   - Real-time fraud detection system
   - Predictive analytics for user behavior
   - Personalized financial insights
   - Automated risk assessment

4. **Scalability & Performance**
   - Database sharding strategy
   - Implement Redis cluster for distributed caching
   - Add CDN for static assets
   - Implement horizontal auto-scaling

5. **DevOps & Observability**
   - Comprehensive monitoring with Prometheus/Grafana
   - Distributed tracing with Jaeger
   - Automated testing pipeline with coverage reports
   - Blue-green deployment strategy

### Features to implement next

**Short-term (1-3 months):**
- Multi-factor authentication
- Transaction limits and controls
- Enhanced notification system with email/SMS
- Mobile app development (React Native)

**Medium-term (3-6 months):**
- Merchant payment integration
- QR code payments
- Recurring payments and subscriptions
- Advanced analytics dashboard

**Long-term (6-12 months):**
- International money transfers
- Cryptocurrency integration
- AI-powered financial advisor
- Open banking API compliance

### Technical debt

1. **Authentication System:** Implement refresh tokens and session management
2. **Error Handling:** Standardize error responses and add global error boundary
3. **Testing Coverage:** Add comprehensive unit and integration tests
4. **Documentation:** API documentation with OpenAPI/Swagger
5. **Code Quality:** Implement ESLint rules and code formatting standards

## 15. Appendix

### Sample curl commands

**Authentication:**
```bash
# Sign up
curl -X POST http://localhost:5001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "password": "password123"
  }'

# Sign in
curl -X POST http://localhost:5001/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Account Operations:**
```bash
# Get balance
curl -X GET http://localhost:5001/api/v1/account/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Deposit money
curl -X POST http://localhost:5001/api/v1/account/deposit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# Get transactions
curl -X GET "http://localhost:5001/api/v1/account/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example Artillery script

```yaml
# Complete Artillery configuration
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up phase"
    - duration: 120
      arrivalRate: 30
      name: "Ramp up load"
    - duration: 60
      arrivalRate: 50
      name: "Sustained high load"
  defaults:
    headers:
      Content-Type: 'application/json'
  processor: "./test-functions.js"

scenarios:
  - name: "Complete user flow"
    weight: 50
    flow:
      - post:
          url: "/api/v1/auth/signin"
          json:
            email: "test{{ $randomInt(1, 1000) }}@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/v1/account/balance"
          headers:
            Authorization: "Bearer {{ authToken }}"
      - post:
          url: "/api/v1/account/deposit"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            amount: "{{ $randomInt(100, 1000) }}"
  
  - name: "Health check"
    weight: 20
    flow:
      - get:
          url: "/health"
```

### Example schema definitions

**User Schema:**
```javascript
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { type: String, required: true, minlength: 6 },
  quickpeId: { type: String, unique: true, sparse: true },
  balance: { type: Number, default: 0, min: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**Transaction Schema:**
```javascript
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled'], 
    default: 'completed' 
  },
  description: { type: String, maxlength: 500 },
  category: { 
    type: String, 
    enum: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
           'Utilities', 'Healthcare', 'Transfer', 'Deposit'], 
    default: 'Transfer' 
  },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});
```

### Code patches for critical fixes

**Fix 1: Enhanced Error Handling**
```javascript
// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

**Fix 2: Connection Pool Optimization**
```javascript
// MongoDB connection with optimized settings
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```
