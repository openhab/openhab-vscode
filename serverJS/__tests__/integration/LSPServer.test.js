/* eslint-env jest */

const Server = require('../../src/Server')

describe('Integration tests for LSP server', () => {
  test('Start LSP server', async () => {
    const LSPServer = require('../../src/LSPServer')
    expect(LSPServer.server).toBeDefined()
    expect(LSPServer.server).toBeInstanceOf(Server)
  })
})
