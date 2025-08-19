const { connectDB, closeDB } = require('../src/config/database');

beforeAll(async () => {
  // Connect to test database
  await connectDB();
});

afterAll(async () => {
  // Close database connection
  await closeDB();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
