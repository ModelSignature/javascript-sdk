/**
 * Jest test setup
 */

// Mock fetch for tests
global.fetch = jest.fn();

// Mock crypto-js for consistent testing
jest.mock('crypto-js', () => ({
  SHA256: jest.fn(() => ({
    toString: jest.fn(() => 'mocked-hash')
  })),
  enc: {
    Hex: 'hex'
  }
}));

// Setup test timeout
jest.setTimeout(10000);