/* eslint-env jest */
require('../../__mocks__/Server')

const lspServer = require('../../src/LSPServer')

describe('LSP Server tests', () => {
  test('server is started', () => {
    expect(lspServer.server.start).toHaveBeenCalledTimes(1)
  })
})
