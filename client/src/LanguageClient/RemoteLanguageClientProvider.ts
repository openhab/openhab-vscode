import * as net from 'net'

import {
    Disposable,
    workspace
} from 'vscode'

import {
    StreamInfo,
    LanguageClient,
    LanguageClientOptions
} from 'vscode-languageclient'

export class RemoteLanguageClientProvider {
    constructor() {
    }

    public connect(): Disposable {
        let config = workspace.getConfiguration('openhab')
        let connectionInfo = {
            host: config.host,
            port: config.lspPort
        }

        let extensions = [
            'things',
            'items',
            'rules',
            'script',
            'sitemap',
            'persist'
        ]

        /**
         * Connect to language server via socket
         */
        let serverOptions = () => {
            let socket = net.connect(connectionInfo);
            let result: StreamInfo = {
                writer: socket,
                reader: socket
            }
            return Promise.resolve(result)
        }

        let clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: "file", language: "openhab", pattern: `**/*.{${extensions.join(",")}}` }],
            synchronize: {
                configurationSection: "openhabLSP",
                fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
            }
        }

        // Create the language client and start the client.
        let lc = new LanguageClient('openHABlsp', 'openHAB Server', serverOptions, clientOptions)
        return lc.start()
    }
}