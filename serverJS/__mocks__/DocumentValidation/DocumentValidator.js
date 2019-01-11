/* eslint-env jest */
jest.mock('../../src/DocumentValidation/DocumentValidator', () => {
  return {
    validateTextDocument: jest.fn((str) => 'MockedDiagnosticsFor' + str)
  }
})
