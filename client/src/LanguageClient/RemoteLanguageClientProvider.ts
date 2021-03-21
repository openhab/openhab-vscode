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
import { ConfigManager } from '../Utils/ConfigManager'
import { OH_CONFIG_PARAMETERS } from '../Utils/types'

import * as utils from '../Utils/Utils'

export class RemoteLanguageClientProvider {
    constructor() {
    }

    public connect(): Disposable {
        let config = workspace.getConfiguration('openhab')
        let hostConfig = ConfigManager.get(OH_CONFIG_PARAMETERS.connection.host) as string
        let host = hostConfig.includes('://') ? hostConfig.split('://')[1] : hostConfig
        let connectionInfo = {
            host: host,
            port: ConfigManager.get(OH_CONFIG_PARAMETERS.languageserver.remotePort) as number
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
            let socket = net.connect(connectionInfo)
            let result: StreamInfo = {
                writer: socket,
                reader: socket
            }
            return Promise.resolve(result)
        }

        let clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: "file", language: "openhab", pattern: `**/*.{${extensions.join(",")}}` }],
            synchronize: {
                configurationSection: "openhab",
                fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
            },
            outputChannelName: "openHAB Extension",
            outputChannel: utils.getOutputChannel()
        }

        // Create the language client and start the client.
        let lc = new LanguageClient('openHABlsp', 'openHAB Server', serverOptions, clientOptions)
        return lc.start()
    }
}