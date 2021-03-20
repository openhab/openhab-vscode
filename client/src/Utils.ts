import {
    commands,
    Uri,
    window,
    workspace,
} from 'vscode'

import {PreviewPanel} from './WebView/PreviewPanel'

import * as _ from 'lodash'
import axios, { AxiosRequestConfig } from 'axios'
import { OutputChannel } from 'vscode'

/**
 * Create output channel as user display for relevant informations
 */
let extensionOutput: OutputChannel = null

/**
 * Humanize function adapter from the previously included underscore.string library
 *
 * @param str The string to convert
 */
export function humanize(str: string) : string {
    return _.upperFirst(
        // original 'underscored' of underscore.string
        str.trim()
        .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase()
        .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
        .replace(/_id$/, '')
        .replace(/_/g, ' ')
        // original 'humanize' of underscore.string
        .replace(/_id$/, '')
        .replace(/_/g, ' ')
        .trim()
    );
}

/**
 * Returns the host of the configured openHAB environment.
 * Return value may vary depending on the user configuration (e.g. Authentication settings)
 */
export function getHost() {
    let config = workspace.getConfiguration('openhab')
    let host = config.connection.host
    let port = config.connection.port

    // Encode only, when different from logical null
    let username = config.connection.basicAuth.username ? encodeURIComponent(config.connection.basicAuth.username) : null;
    let password = config.connection.basicAuth.password ? encodeURIComponent(config.connection.basicAuth.password) : null;

    let protocol = 'http'

    if (host.includes('://')) {
        let split = host.split('://')
        host = split[1]
        protocol = split[0]
    }

    let generatedHost = protocol + '://'

    // Prefer token auth over basic auth, if available
    // Also make sure that there is at least a username given
    if(!tokenAuthAvailable() && username != null){

        // TODO Check if given username is a openHAB 3 token and put out a reccommendation to use authToken config instead
        let basicAuth = (username ? username : '') + (password ? ':' + password : '') +  '@'
        generatedHost += basicAuth

    }

    generatedHost += host + (port === 80 ? '' : ':' + port)

    return generatedHost
}

export function tokenAuthAvailable(): boolean {

    return getAuthToken() ? true : false
}

export function getAuthToken() : String|null {
    let config = workspace.getConfiguration('openhab')

    return config.connection.authToken
}

/**
 * Returns all available sitemaps of the configured openHAB environment via rest api
 */
export function getSitemaps(): Thenable<any[]> {
    return new Promise((resolve, reject) => {
        let config: AxiosRequestConfig = {
            url: getHost() + '/rest/sitemaps',
            headers: {}
        }

        if(tokenAuthAvailable()){
            const token = getAuthToken()

            config.headers = {
                'X-OPENHAB-TOKEN': `${token}`
            }
        }

        axios(config)
            .then((response) => {
                resolve(response.data)
            }).catch(() => reject([]))
    })
}

/**
 * Opens an external browser with the given url.
 *
 * @param url The url to navigate to
 */
export function openBrowser(url) {
    let editor = window.activeTextEditor
    if (!editor) {
        window.showInformationMessage('No editor is active')
        return
    }

    let selection = editor.selection
    let text = editor.document.getText(selection)
    url = url.startsWith('http') ? url : getHost() + url
    url = url.replace('%s', text.replace(' ', '%20'))
    return commands.executeCommand('vscode.open', Uri.parse(url))
}

/**
 * Opens a vscode Webview panel aside, with the given data.
 *
 * @param extensionPath The path of this extension
 * @param query The query to append. Defaults to the basic ui node.
 * @param title The title, that will be shown for the UI tab.
 */
export function openUI(extensionPath: string, query: string = "/basicui/app", title?: string) {
    let srcPath: string = getHost().concat(query);
    appendToOutput(`URL that will be opened is: ${srcPath}`)

    PreviewPanel.createOrShow(
        extensionPath,
        (title !== undefined) ? title : undefined,
        srcPath
    );
}

/**
 * Handle a occuring request error.
 *
 * @param err The current error
 */
export async function handleRequestError(err) {

    let config = workspace.getConfiguration('openhab')
    const setHost = 'Set openHAB host'
    const disableRest = 'Disable REST API'
    const showOutput = 'Show Output'

    // Show error message with action buttons
    const baseMessage = `Error while connecting to openHAB REST API.`
    const message = typeof err.isAxiosError === 'string' ? err.message : err.toString()
    const result = await window.showErrorMessage(`${baseMessage}\nMore information may be found int the openHAB Extension output!`, setHost, disableRest, showOutput)

    // Action based on user input
    switch (result) {
        case setHost:
            commands.executeCommand('workbench.action.openWorkspaceSettings')
            break
        case showOutput:
            extensionOutput.show()
            break
        case disableRest:
            config.update('useRestApi', false)
            break
        default:
            break
    }

    appendToOutput(`---
    Error:
        ${baseMessage}

    Message:
        ${message}
---`)
}

export async function handleConfigError(err, message: string|null = null, baseMessage: string = `Error during config validation`) {
    const openConfig = 'Open config dialog'
    const showOutput = 'Show Output'
    const showError = 'Show raw error message'

    // Show error message with action buttons
    const detailMessage = message ? message : 'More information may be found int the openHAB Extension output!'
    const result = await window.showErrorMessage(`${baseMessage}\n\n${detailMessage}`, openConfig, showOutput, showError)

    // Action based on user input
    switch (result) {
        case openConfig:
            commands.executeCommand('workbench.action.openWorkspaceSettings')
            break
        case showOutput:
            extensionOutput.show()
            break
        case showError:
            appendToOutput(err)
            extensionOutput.show()
            break
        default:
            break
    }
}

/**
 * This will send a message from the extension to its output channel.
 * If the channel isn't existing already, it will be created during method run.
 *
 * @param message The message to append to the extensions output Channel
 */
export function appendToOutput(message: string){
    getOutputChannel().appendLine(message)
}

export function getOutputChannel(): OutputChannel {
    if(!extensionOutput) { extensionOutput = window.createOutputChannel("openHAB Extension") }
    return extensionOutput
}

/**
 * Sleep for some time
 *
 * @param sleepTime wanted time in milliseconds
 */
export async function sleep(sleepTime: number){
    return new Promise(resolve => setTimeout(resolve, sleepTime))
}