/* eslint-env jest */
require('../__mocks__/ItemCompletion/ItemCompletionProvider')
require('../__mocks__/DocumentValidation/DocumentValidator')

const Server = require('../src/Server')
const vscodeLanguageserver = require('vscode-languageserver')
const { validateTextDocument } = require('../src/DocumentValidation/DocumentValidator')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Server Tests', () => {
  test('.start() initializes vscode language server', () => {
    const server = new Server()
    server.start()
    expect(vscodeLanguageserver.createConnection).toHaveBeenCalledTimes(1)

    // connection listeners are registered
    const connection = vscodeLanguageserver.__getConnection()
    expect(connection.onInitialize).toHaveBeenCalledTimes(1)
    expect(connection.onInitialized).toHaveBeenCalledTimes(1)
    expect(connection.onExit).toHaveBeenCalledTimes(1)
    expect(connection.onDidChangeConfiguration).toHaveBeenCalledTimes(1)
    // expect(connection.onDidChangeWatchedFiles).toHaveBeenCalledTimes(1)
    expect(connection.onCompletion).toHaveBeenCalledTimes(1)
    expect(connection.listen).toHaveBeenCalledTimes(1)

    // text documents listeners are registered
    const documents = vscodeLanguageserver.__getDocuments()
    // expect(documents.onDidSave).toHaveBeenCalledTimes(1)
    expect(documents.onDidOpen).toHaveBeenCalledTimes(1)
    // expect(documents.onDidClose).toHaveBeenCalledTimes(1)
    expect(documents.onDidChangeContent).toHaveBeenCalledTimes(1)
    expect(documents.listen).toHaveBeenCalledTimes(1)

    expect(documents.listen).toHaveBeenCalledWith(connection)
  })

  test('.initializeItemCompletionProvider initializes ItemCompletionProvider with params from settings', () => {
    const server = new Server()
    server.globalSettings = { host: 'localhost', port: 123 }
    server.initializeItemCompletionProvider()
    expect(server.itemsCompletionProvider.start).toHaveBeenCalledTimes(1)
    expect(server.itemsCompletionProvider.start).toHaveBeenCalledWith('localhost', 123)
  })

  test('.getCompletion calls method from ItemCompletionProvider and returns value', () => {
    const server = new Server()
    server.start()

    server.globalSettings = { host: 'localhost', port: 123 }
    server.initializeItemCompletionProvider()

    const completionItems = jest.spyOn(server.itemsCompletionProvider, 'completionItems', 'get')

    const getCompletion = server.connection.onCompletion.mock.calls[0][0]

    const completion = getCompletion()
    expect(completionItems).toHaveBeenCalledTimes(1)
    expect(completion).toEqual([{ detail: 'Switch', kind: 0, label: 'Label' }])
  })

  test('.exit should also close ItemCompletionProvider', () => {
    const server = new Server()
    server.start()
    server.globalSettings = { host: 'localhost', port: 123 }

    const exit = server.connection.onExit.mock.calls[0][0]

    // without ItemCompletionProvider exit should work
    exit()
    expect(server.itemsCompletionProvider).toBeUndefined()

    server.initializeItemCompletionProvider()
    exit()
    expect(server.itemsCompletionProvider.stop).toHaveBeenCalledTimes(1)
  })

  test('.getGlobalConfig gets config from client', async () => {
    const server = new Server()
    server.start()
    const res = await server.getGlobalConfig()
    expect(res).toEqual({ mock: 'config' })
  })

  test('.initialize returns capabilities object', () => {
    const server = new Server()
    server.start()
    // get callback method that was passed in .start()
    // this.connection.onInitialize(() => this.initialize(arguments))
    // with the mock.calls[0][0] we get () => this.initialize(arguments)
    // we need to pass this in an anonymous function to keep the 'this' context
    const initialize = server.connection.onInitialize.mock.calls[0][0]
    const res = initialize({ capablities: 'mockedCapability' })
    expect(res).toEqual({
      capabilities: { completionProvider: { resolveProvider: false }, textDocumentSync: 'mockValue' }
    })
  })

  test('.initialized registers more listeners and gets settings and starts item completion listener', async () => {
    const server = new Server()
    server.start()
    const initialized = server.connection.onInitialized.mock.calls[0][0]
    await initialized()
    expect(server.connection.client.register).toHaveBeenCalledTimes(1)
    expect(server.itemsCompletionProvider.start).toHaveBeenCalledTimes(1)
    expect(server.globalSettings).toEqual({ mock: 'config' })
  })

  test('.configurationChanged event with no fitting values are ignored', () => {
    const server = new Server()
    server.start()
    server.globalSettings = { host: 'localhost', port: 123 }

    const configurationChanged = server.connection.onDidChangeConfiguration.mock.calls[0][0]

    configurationChanged({ host: 'remotehost', port: 456 })
    expect(server.globalSettings).toEqual({ host: 'localhost', port: 123 })

    configurationChanged({ settings: { host: 'remotehost', port: 456 } })
    expect(server.globalSettings).toEqual({ host: 'localhost', port: 123 })

    configurationChanged({ settings: { openhab: undefined } })
    expect(server.globalSettings).toEqual({ host: 'localhost', port: 123 })
  })

  test('.configurationChanged called with changes will update config', () => {
    const server = new Server()
    server.start()

    server.globalSettings = { host: 'localhost', port: 123 }

    const configurationChanged = server.connection.onDidChangeConfiguration.mock.calls[0][0]

    configurationChanged({ settings: { openhab: {} } })
    expect(server.globalSettings).toEqual({})

    configurationChanged({ settings: { openhab: { host: 'remotehost', port: 456 } } })
    expect(server.globalSettings).toEqual({ host: 'remotehost', port: 456 })
  })

  test('.configurationChanged called with changes will update config', async () => {
    const server = new Server()
    server.start()

    const initialized = server.connection.onInitialized.mock.calls[0][0]
    await initialized()

    server.globalSettings = { host: 'localhost', port: 123 }

    server.configurationChanged({ settings: { openhab: { host: 'remotehost', port: 456 } } })
    expect(server.globalSettings).toEqual({ host: 'remotehost', port: 456 })
    expect(server.itemsCompletionProvider.restartIfConfigChanged).toHaveBeenCalledTimes(1)
    expect(server.itemsCompletionProvider.restartIfConfigChanged).toHaveBeenCalledWith('remotehost', 456)
  })

  test('.documentOpened', () => {
    const server = new Server()
    server.start()

    server.globalSettings = { settings: 'mocked' }

    const documentOpened = server.documents.onDidOpen.mock.calls[0][0]

    documentOpened({ document: 'MockedDocument' })
    expect(validateTextDocument).toHaveBeenCalledTimes(1)
    expect(validateTextDocument).toHaveBeenCalledWith('MockedDocument', { settings: 'mocked' })
    expect(server.connection.sendDiagnostics).toHaveBeenCalledTimes(1)
    expect(server.connection.sendDiagnostics).toHaveBeenCalledWith('MockedDiagnosticsForMockedDocument')
  })

  test('.documentChanged', () => {
    const server = new Server()
    server.start()

    server.globalSettings = { settings: 'mocked' }

    const documentChanged = server.documents.onDidChangeContent.mock.calls[0][0]

    documentChanged({ document: 'MockedDocumentChanged' })
    expect(validateTextDocument).toHaveBeenCalledTimes(1)
    expect(validateTextDocument).toHaveBeenCalledWith('MockedDocumentChanged', { settings: 'mocked' })
    expect(server.connection.sendDiagnostics).toHaveBeenCalledTimes(1)
    expect(server.connection.sendDiagnostics).toHaveBeenCalledWith('MockedDiagnosticsForMockedDocumentChanged')
  })
})
