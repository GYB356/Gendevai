const { createJestConfig } = require('../../jest-config');

module.exports = createJestConfig({
  displayName: 'AI Core',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/test/**'
  ]
});
