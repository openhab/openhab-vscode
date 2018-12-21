/* eslint-env jest */
const Server = require('../../src/Server')

describe('Integration tests for server', () => {
  test('Start server, start item completion and get completion items', async () => {
    const server = new Server()
    server.globalSettings = { host: 'demo.openhab.org', port: 8080 }

    server.start()
    const err = await server.initializeItemCompletionProvider()
    expect(err).toBeUndefined()
    const completions = server.getCompletion()
    expect(completions).toBeDefined()
    expect(completions.length).toBeGreaterThan(0)
    server.exit()
  })

  test('Start server and validate documents', async () => {
    const server = new Server()
    server.globalSettings = { host: 'demo.openhab.org', port: 8080 }

    server.start()

    // as we do not have a client for testing here we mock the sendDiagnostics to check if we get the result
    server.connection.sendDiagnostics = jest.fn()
    server.validateDocument({ uri: 'testDocument.txt' })

    // this test does not make so much sense yet, however when document validation is available we can test everything here
    expect(server.connection.sendDiagnostics).toHaveBeenCalledTimes(1)
    expect(server.connection.sendDiagnostics).toHaveBeenCalledWith({ diagnostics: [], uri: 'testDocument.txt' })

    server.exit()
  })
})
