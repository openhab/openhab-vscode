import {
    commands,
    Uri,
    window,
    workspace,
} from 'vscode'

import {PreviewPanel} from './WebView/PreviewPanel'

import * as _ from 'lodash'
import * as request from 'request-promise-native'
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
    )
}

/**
 * Returns the host of the configured openHAB environment.
 * Return value may vary depending on the user configuration (e.g. Authentication settings)
 */
export function getHost() {
    let config = workspace.getConfiguration('openhab')
    let host = config.connection.host
    let port = config.connection.port
    let username = config.basicAuth.userName
    let password = config.basicAuth.password

    let protocol = 'http'

    if (host.includes('://')) {
        let split = host.split('://')
        host = split[1]
        protocol = split[0]
    }

    let authentication = (username || '') + (password ? ':' + password : '')
    authentication += authentication ? '@' : ''

    return protocol + '://' + authentication + host + (port === 80 ? '' : ':' + port)
}

/**
 * Returns the current simple mode status retreived via rest api
 */
export function getSimpleModeState(): Thenable<Boolean> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/services/org.eclipse.smarthome.links/config')
            .then((response) => {
                let responseJson = JSON.parse(response)
                resolve(responseJson.autoLinks)
            }).catch(() => reject([]))
    })
}

/**
 * Returns all available sitemaps of the configured openHAB environment via rest api
 */
export function getSitemaps(): Thenable<any[]> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/sitemaps')
            .then((response) => {
                resolve(JSON.parse(response))
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
    let srcPath: string = getHost().concat(query)
    appendToOutput(`URL that will be opened is: ${srcPath}`)

    PreviewPanel.createOrShow(
        extensionPath,
        (title !== undefined) ? title : undefined,
        srcPath
    )
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

    // Show error message with action buttons
    const message = typeof err.error === 'string' ? err.error : err.error.message
    const result = await window.showErrorMessage(`Error while connecting to openHAB REST API. ${message || ''}`, setHost, disableRest)

    // Action based on user input
    switch (result) {
        case setHost:
            commands.executeCommand('workbench.action.openWorkspaceSettings')
            break
        case disableRest:
            config.update('connection.useRestApi', false)
            break
        default:
            break
    }
}

/**
 * This will send a message frmo the extension to its output channel.
 * If the channel isn't existing already, it will be created during method run.
 *
 * @param message The message to append to the extensions output Channel
 */
export function appendToOutput(message: string){

    if(!extensionOutput) { extensionOutput = window.createOutputChannel("openHAB Extension") }

    extensionOutput.appendLine(message)
}

/**
 * Sleep for some time
 *
 * @param sleepTime wanted time in milliseconds
 */
export async function sleep(sleepTime: number){
    return new Promise(resolve => setTimeout(resolve, sleepTime))
}