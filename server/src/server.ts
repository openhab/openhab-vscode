import {
	createConnection,
	TextDocuments,
	TextDocument,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	IConnection
} from 'vscode-languageserver';

import {
	Settings
} from './Settings'
import { validateTextDocument } from './DocumentValidator';

// export server class so we can test it
export class Server {
	connection: IConnection;
	documents: TextDocuments;
	documentSettings: Map<string, Thenable<Settings>>;
	globalSettings: Settings;

	constructor() {
		this.connection = createConnection(ProposedFeatures.all)

		// add handlers to connection
		this.connection.onInitialize(this.initialize)
		this.connection.onInitialized(this.inizialized)
		this.connection.onDidChangeConfiguration(this.configurationChanged)
		this.connection.onDidChangeWatchedFiles(this.watchFilesChanged);

		this.documents = new TextDocuments()
		this.documentSettings = new Map()

		// add handlers to documents
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
		// TODO
		return [
			{
				label: 'CompletionItem1',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'CompletionItem2',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}

	private documentClosed = (event) => {
		this.documentSettings.delete(event.document.uri);
	}

	private watchFilesChanged = (event) => {
		this.connection.console.log('We received an file change event');
	}

	private initialize = (params: InitializeParams) => {
		this.connection.console.log('initialize')
		const capabilities = params.capabilities;

		this.connection.console.log("Capabilities: " + JSON.stringify(capabilities))

		return {
			capabilities: {
				textDocumentSync: this.documents.syncKind,
				// Tell the client that the server supports code completion (currently without resolve)
				completionProvider: { resolveProvider: false }
			}
		};
	}

	private inizialized = () => {
		// Register for all configuration changes.
		this.connection.client.register(DidChangeConfigurationNotification.type, undefined);
		this.connection.workspace.onDidChangeWorkspaceFolders(_event => {
			this.connection.console.log('Workspace folder change event received.');
		});
	}

	private configurationChanged = (change) => {
		this.documentSettings.clear();

		// Revalidate all open text documents
		this.documents.all().forEach(this.validateDocument);
	}

	private documentChanged = (event) => {
		this.validateDocument(event.document);
	}

	private validateDocument =  async (document: TextDocument) => {
		// TODO get settings in the beginning and update on change
		const settings = await this.getDocumentSettings(document.uri)
		const res = validateTextDocument(document, settings)
		this.connection.sendDiagnostics(res)
	}

	private getDocumentSettings = (resource: string): Thenable<Settings> => {
		let result = this.documentSettings.get(resource);
		if (!result) {
			result = this.connection.workspace.getConfiguration({
				scopeUri: resource,
				section: 'openhab'
			});
			this.documentSettings.set(resource, result);
		}
		return result;
	}
}

new Server()