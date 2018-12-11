import {
	createConnection,
	TextDocuments,
	TextDocument,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	TextDocumentPositionParams,
	IConnection
} from 'vscode-languageserver';

import {
	Settings
} from './Settings'

import { validateTextDocument } from './DocumentValidation/DocumentValidator';

import {
	ItemCompletionProvider
} from './ItemCompletion/ItemCompletionProvider'

/**
 * Actual LSP server implementation. Client requires a script that starts the server so we can not give it a class diretly.
 */
export class Server {
	connection: IConnection;
	documents: TextDocuments;
	globalSettings: Settings;
	itemsCompletionProvider: ItemCompletionProvider;

	constructor() { }

	public start = () => {
		this.connection = createConnection(ProposedFeatures.all)

		// add handlers to connection
		this.connection.onInitialize(this.initialize)
		this.connection.onInitialized(this.inizialized)
		this.connection.onExit(this.exit)
		this.connection.onDidChangeConfiguration(this.configurationChanged)
		this.connection.onDidChangeWatchedFiles(this.watchFilesChanged)

		// documents handler
		this.documents = new TextDocuments()

		// add handlers to documents
		this.documents.onDidSave(this.documentSaved)
		this.documents.onDidOpen(this.documentOpened)
		this.documents.onDidClose(this.documentClosed)
		this.documents.onDidChangeContent(this.documentChanged)

		// Attach LSP features
		this.connection.onCompletion(this.completion)

		// Make the text document manager listen on the connection
		// for open, change and close text document events
		this.documents.listen(this.connection);

		// Listen on the connection
		this.connection.listen();
	}

	private completion = (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// TODO check if completion items can be proposed in right context -> new feature, currently items are proposed everywhere
		return this.itemsCompletionProvider.completionItems
	}

	private watchFilesChanged = (event) => {
		// TODO what to do here?
		this.connection.console.log('We received an file change event');
	}

	private initialize = (params: InitializeParams) => {
		const capabilities = params.capabilities;

		// TODO check if client supports capabilities? Might make no sense as we support vscode only currently, but will make sense when used in other lsp clients
		return {
			capabilities: {
				textDocumentSync: this.documents.syncKind,
				completionProvider: { resolveProvider: false },
			}
		};
	}

	private inizialized = async () => {
		// TODO what to do here?
		this.connection.workspace.onDidChangeWorkspaceFolders(_event => {
			this.connection.console.log('Workspace folder change event received.');
		});

		this.globalSettings = await this.getGlobalConfig()

		// Register for all configuration changes.
		this.connection.client.register(DidChangeConfigurationNotification.type, undefined);

		this.itemsCompletionProvider = new ItemCompletionProvider()
		this.itemsCompletionProvider.start(this.globalSettings.host, this.globalSettings.port)
	}

	private exit = () => {
		if (this.itemsCompletionProvider){
			this.itemsCompletionProvider.stop()
		}
	}

	private configurationChanged = (change) => {
		// sometimes we get an empty settings object
		if (!change.settings || !change.settings.openhab) {
			return
		}

		this.globalSettings = <Settings>change.settings.openhab

		if (this.itemsCompletionProvider) {
			this.itemsCompletionProvider.restartIfConfigChanged(this.globalSettings.host, this.globalSettings.port)
		}

		// Revalidate all open text documents - not needed right now but might make sense based on settings for validation
		// this.documents.all().forEach(this.validateDocument);
	}

	private documentOpened = (event) => {
		this.validateDocument(event.document)
	}

	private documentClosed = (event) => {
		// TODO
	}

	private documentSaved = (event) => {
		// TODO can be used for format on save feature
	}

	private documentChanged = (event) => {
		this.validateDocument(event.document);
	}

	private validateDocument = (document: TextDocument) => {
		const diagnostics = validateTextDocument(document, this.globalSettings)
		this.connection.sendDiagnostics(diagnostics)
	}


	private getGlobalConfig = (): Thenable<Settings> => {
		const result = this.connection.workspace.getConfiguration({
			section: 'openhab'
		});
		return result;
	}

}
