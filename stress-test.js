import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// Custom metrics
const authFailures = new Counter('auth_failures');
const socketConnections = new Counter('socket_connections');
const transactionLatency = new Trend('transaction_latency');
const concurrentUsers = new Gauge('concurrent_users');
const errorRate = new Rate('error_rate');

// Test configuration for 1000+ users
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 500 },   // Ramp up to 500 users
    { duration: '10m', target: 1000 }, // Ramp up to 1000 users
    { duration: '15m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 1500 },  // Spike to 1500 users
    { duration: '10m', target: 1000 }, // Back to 1000 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'],   // Error rate under 5%
    auth_failures: ['count<100'],      // Less than 100 auth failures
    socket_connections: ['count>500'], // At least 500 socket connections
  },
};

const BASE_URL = 'http://localhost:3001/api/v1';
const WS_URL = 'ws://localhost:3001';

// Test user credentials
const testUsers = [
  { username: 'shr6219@gmail.com', password: 'password123' },
  { username: 'testuser1@quickpe.test', password: 'testpass123' },
  { username: 'testuser2@quickpe.test', password: 'testpass123' },
];

export default function () {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Update concurrent users metric
  concurrentUsers.add(1);
  
  // Authentication test
  const authStart = Date.now();
  const authResponse = http.post(`${BASE_URL}/user/signin`, JSON.stringify({
    username: user.username,
    password: user.password
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s'
  });
  
  const authSuccess = check(authResponse, {
    'authentication successful': (r) => r.status === 200,
    'auth response time < 2s': (r) => r.timings.duration < 2000,
    'auth has token': (r) => r.json('token') !== undefined,
  });
  
  if (!authSuccess) {
    authFailures.add(1);
    errorRate.add(1);
    return;
  }
  
  const token = authResponse.json('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Balance check test
  const balanceResponse = http.get(`${BASE_URL}/account/balance`, {
    headers: authHeaders,
    timeout: '10s'
  });
  
  check(balanceResponse, {
    'balance check successful': (r) => r.status === 200,
    'balance response time < 1s': (r) => r.timings.duration < 1000,
    'balance has value': (r) => r.json('balance') !== undefined,
  });
  
  // Transaction history test
  const transactionStart = Date.now();
  const transactionResponse = http.get(`${BASE_URL}/account/transactions`, {
    headers: authHeaders,
    timeout: '15s'
  });
  
  const transactionTime = Date.now() - transactionStart;
  transactionLatency.add(transactionTime);
  
  check(transactionResponse, {
    'transaction history successful': (r) => r.status === 200,
    'transaction response time < 3s': (r) => r.timings.duration < 3000,
    'transaction has data': (r) => r.json('transactions') !== undefined,
  });
  
  // User search test
  const searchResponse = http.get(`${BASE_URL}/user/bulk?filter=test`, {
    headers: authHeaders,
    timeout: '10s'
  });
  
  check(searchResponse, {
    'user search successful': (r) => r.status === 200,
    'search response time < 2s': (r) => r.timings.duration < 2000,
    'search has users': (r) => r.json('users') !== undefined,
  });
  
  // Notifications test
  const notificationResponse = http.get(`${BASE_URL}/notifications`, {
    headers: authHeaders,
    timeout: '10s'
  });
  
  check(notificationResponse, {
    'notifications successful': (r) => r.status === 200,
    'notification response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  // WebSocket connection test (every 10th user)
  if (Math.random() < 0.1) {
    const wsResponse = ws.connect(WS_URL, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, function (socket) {
      socketConnections.add(1);
      
      socket.on('open', () => {
        socket.send(JSON.stringify({ type: 'join', userId: 'test-user' }));
      });
      
      socket.on('message', (data) => {
        check(data, {
          'websocket message received': (d) => d.length > 0,
        });
      });
      
      // Keep connection open for 5 seconds
      sleep(5);
      socket.close();
    });
  }
  
  // Think time between requests
  sleep(Math.random() * 3 + 1); // 1-4 seconds
  
  concurrentUsers.add(-1);
}

// Setup function - runs once before the test
export function setup() {
  console.log('🚀 Starting K6 stress test for 1000+ users');
  console.log('📊 Test will run for approximately 42 minutes');
  
  // Health check
  const healthResponse = http.get('http://localhost:3001/health');
  if (healthResponse.status !== 200) {
    throw new Error('Server health check failed');
  }
  
  return { startTime: Date.now() };
}

// Teardown function - runs once after the test
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ Stress test completed in ${duration} seconds`);
}
