module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/unit'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  testMatch: ['**/*.test.js'],
  moduleFileExtensions: ['js'],
  collectCoverageFrom: [
    'storage.js',
    'quotes.js',
    'background.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
