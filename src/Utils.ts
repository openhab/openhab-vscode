import {
    commands,
    Uri,
    ViewColumn,
    window,
    workspace
} from 'vscode'

import {
    Query,
    encodeOpenHABUri
} from './ContentProvider/openHAB'

import * as _ from 'lodash'
import * as fs from 'fs'
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

export function getSitemaps(): Thenable<any[]> {
    return new Promise((resolve, reject) => {
        request(getHost() + '/rest/sitemaps')
            .then((response) => {
                resolve(JSON.parse(response))
            }).catch(() => reject([]))
    })
}

export function openHtml(uri: Uri, title) {

    const panel = window.createWebviewPanel('openHABWebView',title,ViewColumn.One,{
            enableScripts: true
        }
    );

    let query = JSON.parse(uri.query)
    panel.webview.html = getWebviewContent(title, query.hostname.concat(query.route));
    
    return panel;
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

function getWebviewContent(title, src) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
        }
        iframe {
            width: 100%;
            min-height:900px;
            border: none;
            margin: 0;
            padding: 0;
            display: block;
        }
    </style>
</head>
<body>
    <iframe src="${src}"></iframe>
</body>
</html>`;
}