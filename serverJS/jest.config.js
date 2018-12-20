module.exports = {
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 100,
      lines: 90,
      statements: 90
    }
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!__mocks__/**', '!__tests__/**']
}
