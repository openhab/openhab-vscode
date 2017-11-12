import {
    commands,
    Uri,
    ViewColumn,
    window,
    workspace
} from 'vscode'

import {
    Query,
    SCHEME,
    OpenHABContentProvider,
    encodeOpenHABUri
} from './ContentProvider/openHAB'

import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
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

    return protocol + '://' + authentication + host + ':' + port
}

export function getBuildVersion(): Thenable<string> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/')
            .then((response) => {
                resolve(JSON.parse(response).version)
            }).catch(() => reject())
    })
}

export function pathExists(p: string): boolean {
    try {
        fs.accessSync(p)
    } catch (err) {
        return false
    }

    return true
}

export function isOpenHABWorkspace(): boolean {
    let folders = ['items', 'rules']
    return _.some(folders, (folder) => pathExists(path.join(workspace.rootPath, folder)))
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

export function getSitemaps(): Thenable<any[]> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/sitemaps')
            .then((response) => {
                resolve(JSON.parse(response))
            }).catch(() => reject([]))
    })
}

export function openHtml(uri: Uri, title) {
    return commands.executeCommand('vscode.previewHtml', uri, ViewColumn.Two, title)
        .then((success) => {
        }, (reason) => {
            window.showErrorMessage(reason)
        })
}

export function openBrowser(url = 'http://docs.openhab.org/search?q=%s') {
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

export function openUI(query?: Query, title = 'Basic UI', editor = window.activeTextEditor) {
    let params: Query = {
        hostname: getHost()
    };

    _.extend(params, query)
    openHtml(encodeOpenHABUri(params), title)
}

export async function handleRequestError(err) {
    let config = workspace.getConfiguration('openhab')
    const setHost = 'Set openHAB host'
    const disableRest = 'Disable REST API'
    const result = await window.showErrorMessage('Error while connecting to openHAB REST API. ', setHost, disableRest)
    switch (result) {
        case setHost:
            config.update('host', 'localhost')
            commands.executeCommand('workbench.action.openWorkspaceSettings')
            break
        case disableRest:
            config.update('useRestApi', false)
            break
        default:
            break
    }
}
