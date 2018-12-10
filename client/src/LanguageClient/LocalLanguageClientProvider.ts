import {
    Disposable,
    workspace
} from 'vscode'

import {
    LanguageClient,
    LanguageClientOptions,
    TransportKind,
    ServerOptions
} from 'vscode-languageclient'

import * as path from 'path';

export class LocalLanguageClientProvider {
    constructor() {
    }

    public connect(context): Disposable {
        // The debug options for the server
        // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
        const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

        const serverModule = context.asAbsolutePath(path.join("server", "out", "lspServer.js"));

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions: ServerOptions = {
            run: {
                module: serverModule,
                transport: TransportKind.ipc,
            },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions,
            },
        };

        const extensions = ["things", "items", "rules", "script", "sitemap", "persist"];
        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: "file", language: "openhab", pattern: `**/*.{${extensions.join(",")}}` }],
            synchronize: {
                configurationSection: "openhabLSP",
                fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
            },
        };

        // Create the language client and start the client.
        const lc = new LanguageClient("openhabLanguageServer", "Openhab Language Server", serverOptions, clientOptions);
        return lc.start();
    }
}