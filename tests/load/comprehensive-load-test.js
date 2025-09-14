import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulTransfers = new Counter('successful_transfers');
const failedTransfers = new Counter('failed_transfers');

// Test configuration
export let options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests should be below 3s
    http_req_failed: ['rate<0.1'], // Error rate should be less than 10%
    response_time: ['avg<2000'], // Average response time should be less than 2s
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Test data
const testUsers = [
  { username: 'harsh@quickpe.com', password: 'password123', quickpeId: 'QPK-78A97172' },
  { username: 'naman@quickpe.com', password: 'password123', quickpeId: 'QPK-905EDF33' },
  { username: 'aarav@quickpe.com', password: 'password123', quickpeId: 'QPK-A39BF742' },
  { username: 'aayush@quickpe.com', password: 'password123', quickpeId: 'QPK-8EE623E6' },
  { username: 'sangam@quickpe.com', password: 'password123', quickpeId: 'QPK-5313B6B3' },
];

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to get different random user
function getDifferentRandomUser(currentUser) {
  let randomUser;
  do {
    randomUser = getRandomUser();
  } while (randomUser.username === currentUser.username);
  return randomUser;
}

// Authentication function
function authenticate(user) {
  const loginPayload = JSON.stringify({
    username: user.username,
    password: user.password,
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginResponse = http.post(`${BASE_URL}/api/v1/user/signin`, loginPayload, loginParams);
  
  const loginSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response has token': (r) => r.json('token') !== undefined,
  });

  if (loginSuccess && loginResponse.json('token')) {
    return loginResponse.json('token');
  }
  
  errorRate.add(1);
  return null;
}

// Main test function
export default function () {
  const user = getRandomUser();
  const token = authenticate(user);
  
  if (!token) {
    failedTransfers.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Test scenarios with different weights
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - Check balance
    testGetBalance(headers);
  } else if (scenario < 0.6) {
    // 30% - Get transaction history
    testGetTransactionHistory(headers);
  } else if (scenario < 0.8) {
    // 20% - Transfer money by user ID
    testTransferByUserId(headers, user);
  } else if (scenario < 0.95) {
    // 15% - Transfer money by QuickPe ID
    testTransferByQuickPeId(headers, user);
  } else {
    // 5% - Get analytics data
    testGetAnalytics(headers);
  }

  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

function testGetBalance(headers) {
  const startTime = Date.now();
  const response = http.get(`${BASE_URL}/api/v1/account/balance`, { headers });
  const duration = Date.now() - startTime;
  
  responseTime.add(duration);
  
  const success = check(response, {
    'balance check successful': (r) => r.status === 200,
    'balance response has balance field': (r) => r.json('balance') !== undefined,
  });

  if (!success) {
    errorRate.add(1);
  }
}

function testGetTransactionHistory(headers) {
  const startTime = Date.now();
  const params = {
    page: Math.floor(Math.random() * 3) + 1, // Random page 1-3
    limit: Math.floor(Math.random() * 20) + 10, // Random limit 10-30
  };
  
  const url = `${BASE_URL}/api/v1/account/transactions?page=${params.page}&limit=${params.limit}`;
  const response = http.get(url, { headers });
  const duration = Date.now() - startTime;
  
  responseTime.add(duration);
  
  const success = check(response, {
    'transaction history successful': (r) => r.status === 200,
    'transaction history has transactions array': (r) => Array.isArray(r.json('transactions')),
    'transaction history has pagination': (r) => r.json('pagination') !== undefined,
  });

  if (!success) {
    errorRate.add(1);
  }
}

function testTransferByUserId(headers, currentUser) {
  const recipient = getDifferentRandomUser(currentUser);
  const amount = Math.floor(Math.random() * 100) + 10; // Random amount 10-110
  
  const transferPayload = JSON.stringify({
    to: recipient.username, // Using username as user ID for simplicity
    amount: amount,
  });

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/api/v1/account/transfer`, transferPayload, { headers });
  const duration = Date.now() - startTime;
  
  responseTime.add(duration);
  
  const success = check(response, {
    'transfer by user ID successful': (r) => r.status === 200 || r.status === 400, // 400 might be insufficient balance
    'transfer response has message': (r) => r.json('message') !== undefined,
  });

  if (response.status === 200) {
    successfulTransfers.add(1);
  } else if (response.status === 400 && response.json('message').includes('Insufficient balance')) {
    // This is expected behavior, not an error
  } else {
    errorRate.add(1);
    failedTransfers.add(1);
  }
}

function testTransferByQuickPeId(headers, currentUser) {
  const recipient = getDifferentRandomUser(currentUser);
  const amount = Math.floor(Math.random() * 100) + 10; // Random amount 10-110
  
  const transferPayload = JSON.stringify({
    to: recipient.quickpeId,
    amount: amount,
  });

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/api/v1/account/transfer`, transferPayload, { headers });
  const duration = Date.now() - startTime;
  
  responseTime.add(duration);
  
  const success = check(response, {
    'transfer by QuickPe ID successful': (r) => r.status === 200 || r.status === 400,
    'transfer response has message': (r) => r.json('message') !== undefined,
  });

  if (response.status === 200) {
    successfulTransfers.add(1);
  } else if (response.status === 400 && response.json('message').includes('Insufficient balance')) {
    // This is expected behavior, not an error
  } else {
    errorRate.add(1);
    failedTransfers.add(1);
  }
}

function testGetAnalytics(headers) {
  const startTime = Date.now();
  const response = http.get(`${BASE_URL}/api/v1/analytics/transactions`, { headers });
  const duration = Date.now() - startTime;
  
  responseTime.add(duration);
  
  const success = check(response, {
    'analytics request successful': (r) => r.status === 200,
    'analytics has summary': (r) => r.json('summary') !== undefined,
  });

  if (!success) {
    errorRate.add(1);
  }
}

// Setup function (runs once per VU)
export function setup() {
  console.log('Starting QuickPe Load Test');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Test Users: ${testUsers.length}`);
  
  // Health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    console.error('Health check failed - server may not be ready');
  }
  
  return { startTime: Date.now() };
}

// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  const testDuration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${testDuration} seconds`);
}

// Handle summary data
export function handleSummary(data) {
  const summary = {
    test_duration: data.state.testRunDurationMs / 1000,
    total_requests: data.metrics.http_reqs.values.count,
    failed_requests: data.metrics.http_req_failed.values.passes,
    avg_response_time: data.metrics.http_req_duration.values.avg,
    p95_response_time: data.metrics.http_req_duration.values['p(95)'],
    successful_transfers: data.metrics.successful_transfers ? data.metrics.successful_transfers.values.count : 0,
    failed_transfers: data.metrics.failed_transfers ? data.metrics.failed_transfers.values.count : 0,
    error_rate: data.metrics.errors ? data.metrics.errors.values.rate : 0,
    timestamp: new Date().toISOString(),
  };

  console.log('\n=== LOAD TEST SUMMARY ===');
  console.log(`Test Duration: ${summary.test_duration}s`);
  console.log(`Total Requests: ${summary.total_requests}`);
  console.log(`Failed Requests: ${summary.failed_requests}`);
  console.log(`Average Response Time: ${summary.avg_response_time.toFixed(2)}ms`);
  console.log(`95th Percentile Response Time: ${summary.p95_response_time.toFixed(2)}ms`);
  console.log(`Successful Transfers: ${summary.successful_transfers}`);
  console.log(`Failed Transfers: ${summary.failed_transfers}`);
  console.log(`Error Rate: ${(summary.error_rate * 100).toFixed(2)}%`);
  console.log('========================\n');

  return {
    'load-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: '\nLoad test completed successfully!\n',
  };
}
