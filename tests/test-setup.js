import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '../backend/.env' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing';

// Global test setup
beforeAll(() => {
  console.log('🧪 Setting up test environment...');
});

afterAll(() => {
  console.log('🧹 Cleaning up test environment...');
});
