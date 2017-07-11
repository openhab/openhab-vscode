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

export function pathExists(p: string): boolean {
    try {
        fs.accessSync(p);
    } catch (err) {
        return false;
    }

    return true;
}

export function isOpenHABWorkspace(): boolean {
    let folders = ['items', 'rules', 'service', 'sitemap']
    return _.some(folders, (folder) => pathExists(path.join(workspace.rootPath, folder)))
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
