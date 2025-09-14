/**
 * Frontend Real-time Integration Test
 * Tests socket.io integration and real-time UI updates
 */

import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5001/api/v1';
const SOCKET_URL = 'http://localhost:5001';

// Test users for simulation
const testUsers = [
  { email: 'smriti.shukla@quickpe.com', password: 'password123', name: 'Smriti' },
  { email: 'arpit.shukla@quickpe.com', password: 'password123', name: 'Arpit' },
  { email: 'siddharth@quickpe.com', password: 'password123', name: 'Siddharth' }
];

class FrontendRealtimeTest {
  constructor() {
    this.eventLogs = [];
    this.users = [];
    this.sockets = [];
    this.eventCounts = {
      transactionNew: 0,
      transactionUpdate: 0,
      balanceUpdate: 0,
      notificationNew: 0,
      analyticsUpdate: 0
    };
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    this.eventLogs.push(logEntry);
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  async authenticateUser(userCredentials) {
    try {
      const response = await axios.post(`${API_BASE}/auth/signin`, userCredentials);
      
      if (response.data.success) {
        const user = {
          ...response.data.user,
          token: response.data.token,
          credentials: userCredentials
        };
        this.users.push(user);
        console.log('Full auth response:', JSON.stringify(response.data, null, 2));
        this.log(`✅ User ${userCredentials.name} authenticated successfully`, { 
          userId: user._id || user.id,
          userIdType: typeof (user._id || user.id),
          fullUser: user
        });
        return user;
      } else {
        throw new Error(`Authentication failed: ${response.data.message}`);
      }
    } catch (error) {
      this.log(`❌ Authentication failed for ${userCredentials.name}:`, error.message);
      throw error;
    }
  }

  async connectSocket(user) {
    return new Promise((resolve, reject) => {
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token: user.token
        }
      });

      socket.on('connect', () => {
        this.log(`🔌 Socket connected for ${user.firstName}`, { socketId: socket.id });
        
        // Join user room
        const userId = user._id || user.id;
        console.log('Attempting to join room with user ID:', userId);
        socket.emit('join', userId, (response) => {
          if (response?.success) {
            this.log(`🏠 ${user.firstName} joined room successfully`, response.data);
            this.sockets.push({ socket, user });
            resolve(socket);
          } else {
            this.log(`❌ Failed to join room for ${user.firstName}:`, response?.error);
            reject(new Error(response?.error || 'Failed to join room'));
          }
        });
      });

      // Listen for real-time events
      socket.on('transaction:new', (data) => {
        this.log(`📨 ${user.firstName} received transaction:new event`, data);
        this.eventCounts.transactionNew++;
      });
      
      socket.on('transaction:update', (data) => {
        this.log(`📨 ${user.firstName} received transaction:update event`, data);
        this.eventCounts.transactionUpdate++;
      });
      
      socket.on('balance:update', (data) => {
        this.log(`📨 ${user.firstName} received balance:update event`, data);
        this.eventCounts.balanceUpdate++;
      });
      
      socket.on('notification:new', (data) => {
        this.log(`📨 ${user.firstName} received notification:new event`, data);
        this.eventCounts.notificationNew++;
      });
      
      socket.on('analytics:update', (data) => {
        this.log(`📨 ${user.firstName} received analytics:update event`, data);
        this.eventCounts.analyticsUpdate++;
      });
      
      socket.on('cache:invalidate', (data) => {
        this.log(`📨 ${user.firstName} received cache:invalidate event`, data);
      });

      socket.on('connect_error', (error) => {
        this.log(`❌ Socket connection error for ${user.firstName}:`, error.message);
        reject(error);
      });

      socket.on('disconnect', (reason) => {
        this.log(`❌ Socket disconnected for ${user.firstName}:`, reason);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!socket.connected) {
          reject(new Error('Socket connection timeout'));
        }
      }, 10000);
    });
  }

  async performTransaction(sender, receiver, amount) {
    try {
      this.log(`💸 ${sender.firstName} sending ₹${amount} to ${receiver.firstName}`);
      
      const response = await axios.post(`${API_BASE}/account/transfer`, {
        toQuickpeId: receiver.quickpeId,
        amount: amount,
        description: `Test transfer from ${sender.firstName} to ${receiver.firstName}`
      }, {
        headers: {
          'Authorization': `Bearer ${sender.token}`
        }
      });

      if (response.data.success || response.data.message === 'Transfer successful') {
        this.log(`✅ Transaction successful`, {
          transactionId: response.data.transactionId,
          from: sender.firstName,
          to: receiver.firstName,
          amount: amount,
          message: response.data.message
        });
        return response.data;
      } else {
        throw new Error(`Transaction failed: ${response.data.message}`);
      }
    } catch (error) {
      this.log(`❌ Transaction failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async runRealtimeTest() {
    this.log('🚀 Starting Frontend Real-time Integration Test');
    
    try {
      // Step 1: Authenticate all users
      this.log('📝 Step 1: Authenticating test users');
      for (const userCreds of testUsers) {
        await this.authenticateUser(userCreds);
      }

      // Step 2: Connect sockets for all users
      this.log('🔌 Step 2: Connecting sockets for all users');
      for (const user of this.users) {
        await this.connectSocket(user);
      }

      // Wait for all connections to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Perform test transactions
      this.log('💰 Step 3: Performing test transactions');
      
      // Alice sends money to Bob
      await this.performTransaction(this.users[0], this.users[1], 500);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Bob sends money to Charlie
      await this.performTransaction(this.users[1], this.users[2], 250);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Charlie sends money to Alice
      await this.performTransaction(this.users[2], this.users[0], 100);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Verify real-time events were received
      this.log('🔍 Step 4: Analyzing real-time event reception');
      this.analyzeEventLogs();

      this.log('✅ Frontend Real-time Integration Test Completed Successfully');
      
    } catch (error) {
      this.log('❌ Test failed:', error.message);
      throw error;
    } finally {
      // Cleanup: Disconnect all sockets
      this.log('🧹 Cleaning up socket connections');
      this.sockets.forEach(({ socket, user }) => {
        socket.disconnect();
        this.log(`🔌 Disconnected socket for ${user.firstName}`);
      });
    }
  }

  analyzeEventLogs() {
    const eventTypes = [
      'transaction:new',
      'transaction:update', 
      'balance:update',
      'notification:new',
      'analytics:update'
    ];

    this.log('📊 Event Reception Analysis:');
    
    eventTypes.forEach(eventType => {
      const events = this.eventLogs.filter(log => log.message.includes(`received ${eventType} event`));
      this.log(`  ${eventType}: ${events.length} events received`);
      
      if (events.length > 0) {
        events.forEach(event => {
          const userName = event.message.split(' ')[1];
          this.log(`    - ${userName} received event at ${event.timestamp}`);
        });
      }
    });

    // Check if all users received real-time events
    const usersWithEvents = new Set();
    this.eventLogs.forEach(log => {
      if (log.message.includes('received') && log.message.includes('event')) {
        const userName = log.message.split(' ')[1];
        usersWithEvents.add(userName);
      }
    });

    this.log(`📈 Summary: ${usersWithEvents.size}/${this.users.length} users received real-time events`);
    
    if (usersWithEvents.size === this.users.length) {
      this.log('✅ All users successfully received real-time events');
    } else {
      this.log('⚠️ Some users did not receive real-time events');
    }
  }

  generateReport() {
    const report = {
      testStartTime: this.eventLogs[0]?.timestamp,
      testEndTime: this.eventLogs[this.eventLogs.length - 1]?.timestamp,
      totalUsers: this.users.length,
      totalSockets: this.sockets.length,
      totalEvents: this.eventLogs.length,
      eventLogs: this.eventLogs,
      success: this.eventLogs.some(log => log.message.includes('Test Completed Successfully'))
    };

    console.log('\n📋 FRONTEND REAL-TIME TEST REPORT');
    console.log('=====================================');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }
}

// Run the test
async function runTest() {
  const test = new FrontendRealtimeTest();
  
  try {
    await test.runRealtimeTest();
    test.generateReport();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    test.generateReport();
    process.exit(1);
  }
}

// Execute if run directly
runTest();
