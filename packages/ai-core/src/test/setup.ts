/**
 * Test setup and utilities for AI Core package
 */

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.DATABASE_URL = 'test://localhost:5432/test';

// Global test utilities
global.testUtils = {
  createMockError: (message: string, code = 'TEST_ERROR') => {
    const error = new Error(message);
    (error as any).code = code;
    return error;
  },
  
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  createMockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  })
};

// Suppress console output during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}
