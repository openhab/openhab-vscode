import * as vscode from 'vscode'
import { OutputChannel } from 'vscode'
import * as _ from 'lodash'
import axios, { AxiosRequestConfig } from 'axios'
import {PreviewPanel} from '../WebViews/PreviewPanel'
import { ConfigManager } from './ConfigManager'
import { OH_CONFIG_PARAMETERS, OH_MESSAGESTRINGS } from './types'

/**
 * Create output channel as user display for relevant informations
 */
let extensionOutput: OutputChannel = null
let warningShownAlready: boolean = false

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
    let host = ConfigManager.get(OH_CONFIG_PARAMETERS.connection.host) as string
    let port = ConfigManager.get(OH_CONFIG_PARAMETERS.connection.port) as number
    let protocol = 'http'

    if (host.includes('://')) {
        let split = host.split('://')
        host = split[1]
        protocol = split[0]
    }

    let generatedHost = protocol + '://'

    // Prefer token auth over basic auth, if available
    if(!ConfigManager.tokenAuthAvailable()){
        let username = ConfigManager.get(OH_CONFIG_PARAMETERS.connection.basicAuth.username) as string|null

        // Also make sure that there is at least a username given
        if(username != null && username != ''){
            let password = ConfigManager.get(OH_CONFIG_PARAMETERS.connection.basicAuth.password) as string|null

            // Check if given username is a openHAB 3 token
            let usernameSegments = username.split('.')
            if(usernameSegments.length === 3 && usernameSegments[0] === 'oh'){
                const warningString = `Detected openHAB 3 token as username.\nConsider using the recommended **openhab.connection.authToken** config parameter instead.\n\n`
                appendToOutput(warningString)
                if(!warningShownAlready){
                    vscode.window.showWarningMessage(warningString)
                    warningShownAlready = true
                }
            }

            let basicAuth = (username ? username : '') + (password ? ':' + password : '') +  '@'
            generatedHost += basicAuth
        }

    }

    generatedHost += host + (port === 80 ? '' : ':' + port)

    return generatedHost
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

        if(ConfigManager.tokenAuthAvailable()){
            config.headers = {
                'X-OPENHAB-TOKEN': ConfigManager.get(OH_CONFIG_PARAMETERS.connection.authToken)
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
 * @param url The url to navigate to
 */
export function openBrowser(url) {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active')
        return
    }

    let selection = editor.selection
    let text = editor.document.getText(selection)
    url = url.startsWith('http') ? url : getHost() + url
    url = url.replace('%s', text.replace(' ', '%20'))
    return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url))
}

/**
 * Opens a vscode Webview panel aside, with the given data.
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
 * @param err The current error
 */
export async function handleRequestError(err) {
    const disableRest = 'Disable REST API'
    const showOutput = 'Show Output'

    // Show error message with action buttons
    const baseMessage = `Error while connecting to openHAB REST API.`
    const message = typeof err.isAxiosError === 'string' ? err.message : err.toString()
    const result = await vscode.window.showErrorMessage(`${baseMessage}\n${OH_MESSAGESTRINGS.moreInfo}`, disableRest, showOutput)

    // Action based on user input
    switch (result) {
        case disableRest:
            ConfigManager.update(OH_CONFIG_PARAMETERS.useRestApi, false)
            break
        case showOutput:
            extensionOutput.show()
            break
    }

    appendToOutput(`---
    Error:
        ${baseMessage}

    Message:
        ${message}
---`)
}

/**
 * This will send a message from the extension to its output channel.
 * If the channel isn't existing already, it will be created during method run.
 * @param message The message to append to the extensions output Channel
 */
export function appendToOutput(message: string){
    getOutputChannel().appendLine(message)
}

/**
 * Gets the extensions output channel for referencing
 * @returns The extensions output channel
 */
export function getOutputChannel(): OutputChannel {
    if(!extensionOutput) { extensionOutput = vscode.window.createOutputChannel("openHAB Extension") }
    return extensionOutput
}

/**
 * Sleep for some time
 * @param sleepTime wanted time in milliseconds
 */
export async function sleep(sleepTime: number){
    return new Promise(resolve => setTimeout(resolve, sleepTime))
}