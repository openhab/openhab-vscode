/* eslint-env jest */
const { validateTextDocument } = require('../../../src/DocumentValidation/DocumentValidator')

describe('Tests for validation', () => {
  test('this does not do much yet', () => {
    expect(validateTextDocument({ uri: 'test.txt' })).toEqual({ uri: 'test.txt', diagnostics: [] })
  })
})
