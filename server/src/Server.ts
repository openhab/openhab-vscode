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

import { validateTextDocument } from './DocumentValidator';

import {
	ItemCompletionProvider
} from './ItemCompletion/ItemCompletionProvider'

// export server class so we can test it
export class Server {
	connection: IConnection;
	documents: TextDocuments;
	// documentSettings: Map<string, Thenable<Settings>>;
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

		this.documents = new TextDocuments()
		// this.documentSettings = new Map()

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
		// TODO check if completion item can be inserted at current position -> new feature, currently is like old behaviour
		return this.itemsCompletionProvider.completionItems
	}

	private watchFilesChanged = (event) => {
		// TODO what to do here?
		this.connection.console.log('We received an file change event');
	}

	private initialize = (params: InitializeParams) => {
		const capabilities = params.capabilities;

		// TODO check if client supports capabilities? Might make no sense as we support vscode only currently
		return {
			capabilities: {
				textDocumentSync: this.documents.syncKind,
				// Tell the client that the server supports code completion (currently without resolve)
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
		this.itemsCompletionProvider.stop()
	}

	private configurationChanged = (change) => {
		// sometimes i got an empty settings object
		if (!change.settings || !change.settings.openhab) {
			return
		}

		this.globalSettings = <Settings>change.settings.openhab

		if (this.itemsCompletionProvider) {
			this.itemsCompletionProvider.restartIfConfigChanged(this.globalSettings.host, this.globalSettings.port)
		}

		// this.documentSettings.clear();

		// Revalidate all open text documents
		this.documents.all().forEach(this.validateDocument);
	}

	private documentOpened = (event) => {
		this.validateDocument(event.document)
	}

	private documentClosed = (event) => {
		// TODO
		// this.documentSettings.delete(event.document.uri);
	}

	// can be used for format on save later
	private documentSaved = (event) => {
		// TODO
		// this.documentSettings.delete(event.document.uri);
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
