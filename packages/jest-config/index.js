function createJestConfig(overrides = {}) {
  const defaultConfig = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
      '**/__tests__/**/*.+(ts|tsx|js)',
      '**/*.(test|spec).+(ts|tsx|js)'
    ],
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.test.{ts,tsx}',
      '!src/**/__tests__/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    verbose: true,
    testTimeout: 10000
  };

  return {
    ...defaultConfig,
    ...overrides
  };
}

module.exports = { createJestConfig };
