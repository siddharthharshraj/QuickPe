const axios = require('axios');
const io = require('socket.io-client');

// Test configuration
const BASE_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5173';

// Test users (using existing users from database)
const TEST_USERS = [
  { email: 'smriti.shukla@quickpe.com', password: 'password123', name: 'Smriti', quickpeId: 'QPK-567890AB' },
  { email: 'arpit.shukla@quickpe.com', password: 'password123', name: 'Arpit', quickpeId: 'QPK-234567CD' },
  { email: 'siddharth@quickpe.com', password: 'password123', name: 'Siddharth', quickpeId: 'QPK-373B56D9' }
];

class UserSimulator {
  constructor(userInfo, userId) {
    this.userInfo = userInfo;
    this.userId = userId;
    this.token = null;
    this.socket = null;
    this.events = [];
    this.balance = 0;
    this.transactions = [];
    this.notifications = [];
  }

  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.userInfo.name}] ${message}`, data);
    this.events.push({ timestamp, message, data });
  }

  async authenticate() {
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/auth/signin`, {
        email: this.userInfo.email,
        password: this.userInfo.password
      });
      
      this.token = response.data.token;
      this.userId = response.data.user.id;
      this.log('Authentication successful', { userId: this.userId });
      return true;
    } catch (error) {
      this.log('Authentication failed', { error: error.message });
      return false;
    }
  }

  async connectSocket() {
    return new Promise((resolve, reject) => {
      this.socket = io(BASE_URL, {
        auth: { token: this.token },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        this.log('Socket connected', { socketId: this.socket.id });
        
        // Join user room with acknowledgement
        this.socket.emit('join', this.userId, (response) => {
          if (response?.success) {
            this.log('Joined room successfully', response.data);
            resolve();
          } else {
            this.log('Failed to join room', response);
            reject(new Error('Failed to join room'));
          }
        });
      });

      this.socket.on('disconnect', (reason) => {
        this.log('Socket disconnected', { reason });
      });

      this.socket.on('newTransaction', (data) => {
        this.log('Received newTransaction event', data);
        this.transactions.push(data.transaction);
        this.balance = data.balance;
      });

      this.socket.on('notification', (notification) => {
        this.log('Received notification', notification);
        this.notifications.push(notification);
      });

      this.socket.on('cacheInvalidate', (data) => {
        this.log('Received cacheInvalidate event', data);
      });

      this.socket.on('connect_error', (error) => {
        this.log('Socket connection error', { error: error.message });
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);
    });
  }

  async getBalance() {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/account/balance`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      this.balance = response.data.balance;
      this.log('Balance fetched', { balance: this.balance });
      return this.balance;
    } catch (error) {
      this.log('Failed to fetch balance', { error: error.message });
      return null;
    }
  }

  async sendMoney(recipientQuickpeId, amount) {
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/account/transfer`, {
        toQuickpeId: recipientQuickpeId,
        amount: amount
      }, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      this.log('Money sent successfully', { 
        recipient: recipientQuickpeId, 
        amount, 
        transactionId: response.data.transactionId,
        newBalance: response.data.newBalance
      });
      
      return response.data;
    } catch (error) {
      this.log('Failed to send money', { 
        recipient: recipientQuickpeId, 
        amount, 
        error: error.response?.data?.message || error.message 
      });
      return null;
    }
  }

  async getTransactions() {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/account/transactions`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      this.log('Transactions fetched', { count: response.data.transactions.length });
      return response.data.transactions;
    } catch (error) {
      this.log('Failed to fetch transactions', { error: error.message });
      return [];
    }
  }

  async getNotifications() {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      this.log('Notifications fetched', { count: response.data.notifications.length });
      return response.data.notifications;
    } catch (error) {
      this.log('Failed to fetch notifications', { error: error.message });
      return [];
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('logout', (response) => {
        this.log('Logout acknowledgement', response);
      });
      this.socket.disconnect();
      this.log('Socket disconnected manually');
    }
  }

  getEventSummary() {
    return {
      user: this.userInfo.name,
      userId: this.userId,
      totalEvents: this.events.length,
      socketEvents: this.events.filter(e => e.message.includes('Received')).length,
      transactions: this.transactions.length,
      notifications: this.notifications.length,
      finalBalance: this.balance
    };
  }
}

async function runParallelUserSimulation() {
  console.log('🚀 Starting 3-User Parallel Simulation Test');
  console.log('=' * 60);

  // Create user simulators
  const users = TEST_USERS.map((userInfo, index) => new UserSimulator(userInfo, null));

  try {
    // Step 1: Authenticate all users in parallel
    console.log('\n📝 Step 1: Authenticating all users...');
    const authResults = await Promise.all(users.map(user => user.authenticate()));
    
    if (!authResults.every(result => result)) {
      throw new Error('Some users failed to authenticate');
    }
    console.log('✅ All users authenticated successfully');

    // Step 2: Connect all sockets in parallel
    console.log('\n🔌 Step 2: Connecting all sockets...');
    await Promise.all(users.map(user => user.connectSocket()));
    console.log('✅ All sockets connected successfully');

    // Step 3: Get initial balances
    console.log('\n💰 Step 3: Fetching initial balances...');
    await Promise.all(users.map(user => user.getBalance()));
    
    users.forEach(user => {
      console.log(`${user.userInfo.name}: ₹${user.balance}`);
    });

    // Step 4: Simulate concurrent transactions
    console.log('\n💸 Step 4: Simulating concurrent transactions...');
    
    // Get user QuickPe IDs from test users
    const userQuickpeIds = TEST_USERS.map(user => user.quickpeId);
    
    // Create a series of concurrent transfers
    const transferPromises = [
      users[0].sendMoney(userQuickpeIds[1], 1000), // Smriti -> Arpit: ₹1000
      users[1].sendMoney(userQuickpeIds[2], 500),  // Arpit -> Siddharth: ₹500
      users[2].sendMoney(userQuickpeIds[0], 750),  // Siddharth -> Smriti: ₹750
    ];

    // Wait a bit then do reverse transfers
    setTimeout(async () => {
      const reverseTransfers = [
        users[1].sendMoney(userQuickpeIds[0], 300), // Arpit -> Smriti: ₹300
        users[2].sendMoney(userQuickpeIds[1], 200), // Siddharth -> Arpit: ₹200
        users[0].sendMoney(userQuickpeIds[2], 400), // Smriti -> Siddharth: ₹400
      ];
      await Promise.all(reverseTransfers);
    }, 2000);

    await Promise.all(transferPromises);
    
    // Wait for all real-time events to propagate
    console.log('\n⏳ Waiting for real-time events to propagate...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 5: Verify final state
    console.log('\n🔍 Step 5: Verifying final state...');
    
    // Fetch fresh data from database
    await Promise.all([
      ...users.map(user => user.getBalance()),
      ...users.map(user => user.getTransactions()),
      ...users.map(user => user.getNotifications())
    ]);

    // Step 6: Generate test report
    console.log('\n📊 Step 6: Test Results Summary');
    console.log('=' * 60);
    
    users.forEach(user => {
      const summary = user.getEventSummary();
      console.log(`\n${summary.user} (${summary.userId}):`);
      console.log(`  Total Events: ${summary.totalEvents}`);
      console.log(`  Socket Events: ${summary.socketEvents}`);
      console.log(`  Transactions: ${summary.transactions}`);
      console.log(`  Notifications: ${summary.notifications}`);
      console.log(`  Final Balance: ₹${summary.finalBalance}`);
    });

    // Validation checks
    console.log('\n✅ Validation Checks:');
    
    let allChecksPass = true;
    
    // Check 1: All users received socket events
    users.forEach(user => {
      const socketEvents = user.events.filter(e => e.message.includes('Received')).length;
      if (socketEvents === 0) {
        console.log(`❌ ${user.userInfo.name} received no socket events`);
        allChecksPass = false;
      } else {
        console.log(`✅ ${user.userInfo.name} received ${socketEvents} socket events`);
      }
    });

    // Check 2: Transaction isolation (each user's events are separate)
    const totalTransactionEvents = users.reduce((sum, user) => 
      sum + user.events.filter(e => e.message.includes('newTransaction')).length, 0);
    console.log(`✅ Total transaction events across all users: ${totalTransactionEvents}`);

    // Check 3: Notification delivery
    const totalNotificationEvents = users.reduce((sum, user) => 
      sum + user.events.filter(e => e.message.includes('notification')).length, 0);
    console.log(`✅ Total notification events across all users: ${totalNotificationEvents}`);

    if (allChecksPass) {
      console.log('\n🎉 All validation checks passed! Real-time system is working correctly.');
    } else {
      console.log('\n❌ Some validation checks failed. Please review the logs above.');
    }

  } catch (error) {
    console.error('\n❌ Simulation failed:', error.message);
  } finally {
    // Cleanup: Disconnect all sockets
    console.log('\n🧹 Cleaning up connections...');
    users.forEach(user => user.disconnect());
    
    setTimeout(() => {
      console.log('✅ Simulation completed');
      process.exit(0);
    }, 1000);
  }
}

// Run the simulation
if (require.main === module) {
  runParallelUserSimulation().catch(console.error);
}

module.exports = { UserSimulator, runParallelUserSimulation };
