/* eslint-env jest */
const vscodeLanguageServer = jest.genMockFromModule('vscode-languageserver')

this.defaultConnection = {
  onInitialize: jest.fn(),
  onInitialized: jest.fn(),
  onExit: jest.fn(),
  onDidChangeConfiguration: jest.fn(),
  onDidChangeWatchedFiles: jest.fn(),
  onCompletion: jest.fn(),
  listen: jest.fn(),
  workspace: {
    getConfiguration: jest.fn(() => {
      return Promise.resolve({ mock: 'config' })
    })
  },
  client: {
    register: jest.fn()
  },
  sendDiagnostics: jest.fn()
}

this.defaultDocuments = {
  onDidSave: jest.fn(),
  onDidOpen: jest.fn(),
  onDidClose: jest.fn(),
  onDidChangeContent: jest.fn(),
  listen: jest.fn(),
  syncKind: 'mockValue'
}

vscodeLanguageServer.createConnection = jest.fn(() => this.connection || this.defaultConnection)
vscodeLanguageServer.TextDocuments = jest.fn(() => this.documents || this.defaultDocuments)

vscodeLanguageServer.__setConnection = connObj => {
  this.connection = connObj
}

vscodeLanguageServer.__getConnection = () => {
  return this.connection || this.defaultConnection
}

vscodeLanguageServer.__setDocuments = docsObj => {
  this.documents = docsObj
}

vscodeLanguageServer.__getDocuments = () => {
  return this.documents || this.defaultDocuments
}

module.exports = vscodeLanguageServer
