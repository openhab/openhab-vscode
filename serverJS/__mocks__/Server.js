/* eslint-env jest */
jest.mock('../src/Server', () => {
  return jest.fn(() => {
    return {
      start: jest.fn()
    }
  })
})
