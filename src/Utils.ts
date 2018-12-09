import {
    commands,
    Uri,
    window,
    workspace
} from 'vscode'

import {PreviewPanel} from './WebView/PreviewPanel'

import * as _ from 'lodash'
import * as request from 'request-promise-native'

export function getHost() {
    let config = workspace.getConfiguration('openhab')
    let host = config.host
    let port = config.port
    let username = config.username
    let password = config.password

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

export function getBuildVersion(): Thenable<string> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/')
            .then((response) => {
                resolve(JSON.parse(response).version)
            }).catch(() => reject())
    })
}

export function hasExtension(name: string): Thenable<boolean> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/extensions')
            .then((response) => {
                let resp = JSON.parse(response)
                let extension = resp.filter((addon) => addon.id === name)
                resolve(extension[0].installed)
            }).catch(() => reject(false))
    })
}

export function getSimpleModeState(): Thenable<Boolean> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/services/org.eclipse.smarthome.links/config')
            .then((response) => {
                let responseJson = JSON.parse(response);
                resolve(responseJson.autoLinks)
            }).catch(() => reject([]))
    })
}

export function getSitemaps(): Thenable<any[]> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/sitemaps')
            .then((response) => {
                resolve(JSON.parse(response))
            }).catch(() => reject([]))
    })
}

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

export function openUI(extensionPath: string, query: string = "/basicui/app", title?: string) {
    let srcPath: string = getHost().concat(query);

    PreviewPanel.createOrShow(
        extensionPath,
        (title !== undefined) ? title : undefined,
        srcPath 
    );
}

export async function handleRequestError(err) {
    let config = workspace.getConfiguration('openhab')
    const setHost = 'Set openHAB host'
    const disableRest = 'Disable REST API'
    const message = typeof err.error === 'string' ? err.error : err.error.message
    const result = await window.showErrorMessage(`Error while connecting to openHAB REST API. ${message || ''}`, setHost, disableRest)
    switch (result) {
        case setHost:
            commands.executeCommand('workbench.action.openWorkspaceSettings')
            break
        case disableRest:
            config.update('useRestApi', false)
            break
        default:
            break
    }
}
