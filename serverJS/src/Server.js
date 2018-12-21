'use strict'

const {
  TextDocuments,
  createConnection,
  ProposedFeatures,
  DidChangeConfigurationNotification
} = require('vscode-languageserver')

const { validateTextDocument } = require('./DocumentValidation/DocumentValidator')

const ItemCompletionProvider = require('./ItemCompletion/ItemCompletionProvider')

/**
 * Actual LSP server implementation. Client requires a script that starts the server so we can not give it a class diretly.
 * @author Samuel Brucksch
 */
class Server {
  start () {
    this.connection = createConnection(ProposedFeatures.all)

    // add handlers to connection
    this.connection.onInitialize(this.initialize.bind(this))
    this.connection.onInitialized(this.initialized.bind(this))
    this.connection.onExit(this.exit.bind(this))
    this.connection.onDidChangeConfiguration(this.configurationChanged.bind(this))
    // this.connection.onDidChangeWatchedFiles(this.watchFilesChanged.bind(this))

    // documents handler
    this.documents = new TextDocuments()

    // add handlers to documents
    // this.documents.onDidSave(this.documentSaved.bind(this))
    this.documents.onDidOpen(this.documentOpened.bind(this))
    // this.documents.onDidClose(this.documentClosed.bind(this))
    this.documents.onDidChangeContent(this.documentChanged.bind(this))

    // Attach LSP features
    this.connection.onCompletion(this.getCompletion.bind(this))

    // Make the text document manager listen on the connection
    // for open, change and close text document events
    this.documents.listen(this.connection)

    // Listen on the connection
    this.connection.listen()
  }

  getCompletion (textDocumentPosition) {
    // TODO check if completion items can be proposed in right context -> new feature, currently items are proposed everywhere
    return this.itemsCompletionProvider.completionItems
  }

  /*
  watchFilesChanged (event) {
    // TODO what to do here?
    this.connection.console.log('We received an file change event')
  }
  */

  initialize (params) {
    // const capabilities = params.capabilities
    // TODO check if client supports capabilities? Might make no sense as we support vscode only currently, but will make sense when used in other lsp clients
    return {
      capabilities: {
        textDocumentSync: this.documents.syncKind,
        completionProvider: { resolveProvider: false }
      }
    }
  }

  async initialized () {
    /*
    TODO do we need this?
    this.connection.workspace.onDidChangeWorkspaceFolders(_event => {
      this.connection.console.log('Workspace folder change event received.')
    })
    */

    this.globalSettings = await this.getGlobalConfig()

    // Register for all configuration changes.
    this.connection.client.register(DidChangeConfigurationNotification.type, undefined)
    await this.initializeItemCompletionProvider()
  }

  async initializeItemCompletionProvider () {
    this.itemsCompletionProvider = new ItemCompletionProvider()
    // TODO what todo here if it fails?
    const err = await this.itemsCompletionProvider.start(this.globalSettings.host, this.globalSettings.port)
    return err
  }

  exit () {
    if (this.itemsCompletionProvider) {
      this.itemsCompletionProvider.stop()
    }
  }

  configurationChanged (change) {
    // sometimes we get an empty settings object
    if (!change.settings || !change.settings.openhab) {
      return
    }
    this.globalSettings = change.settings.openhab
    if (this.itemsCompletionProvider) {
      this.itemsCompletionProvider.restartIfConfigChanged(this.globalSettings.host, this.globalSettings.port)
    }
    // Revalidate all open text documents - not needed right now but might make sense based on settings for validation
    // this.documents.all().forEach(this.validateDocument)
  }

  documentOpened (event) {
    this.validateDocument(event.document)
  }

  /*
  documentClosed (event) {
    // TODO
  }
  */

  /*
  documentSaved (event) {
    // TODO can be used for format on save feature
  }
  */

  documentChanged (event) {
    this.validateDocument(event.document)
  }

  validateDocument (document) {
    const diagnostics = validateTextDocument(document, this.globalSettings)
    this.connection.sendDiagnostics(diagnostics)
  }

  async getGlobalConfig () {
    const result = this.connection.workspace.getConfiguration({
      section: 'openhab'
    })
    return result
  }
}

module.exports = Server
