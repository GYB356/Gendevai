const { createJestConfig } = require('./packages/jest-config');

module.exports = createJestConfig({
  displayName: 'GenDevAI Root',
  projects: [
    '<rootDir>/packages/*/jest.config.js',
    '<rootDir>/apps/*/jest.config.js',
    '<rootDir>/vscode-extension/jest.config.js'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    'apps/*/src/**/*.{ts,tsx}',
    'vscode-extension/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
});
