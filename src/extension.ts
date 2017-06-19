'use strict';

import {
    ExtensionContext,
    Disposable,
    workspace,
    window,
    Uri,
    commands,
    ViewColumn,
    TextDocumentChangeEvent
} from 'vscode'

import {
    Query,
    SCHEME,
    OpenHABContentProvider,
    encodeOpenHABUri
} from './ContentProvider/openHAB'

import _ = require('lodash')

async function init(context: ExtensionContext, disposables: Disposable[]): Promise<void> {
    let ui = new OpenHABContentProvider()
    let registration = workspace.registerTextDocumentContentProvider(SCHEME, ui)

    const openHtml = (uri: Uri, title) => {
        return commands.executeCommand('vscode.previewHtml', uri, ViewColumn.Two, title)
            .then((success) => {
            }, (reason) => {
                window.showErrorMessage(reason)
            })
    }

    const openUI = (query?: Query, title = 'OpenHAB', editor = window.activeTextEditor) =>
        openHtml(encodeOpenHABUri(query), title)

    let basicUI = commands.registerCommand('openhab.basicUI', () => {
        let editor = window.activeTextEditor
        if (!editor) {
            window.showInformationMessage('No editor is active');
            return;
        }

        let filePath = editor.document.fileName.split('\\')
        let fileName = filePath.pop()
        let hostname = filePath[0] === '' ? _.compact(filePath)[0] : 'localhost'
        let address = hostname + ':8080'

        let params = {
            hostname: address
        };

        if (fileName.split('.')[1] === 'sitemap') {
            let sitemap = fileName.split('.')[0]

            _.extend(params, {
                route: '/basicui/app?sitemap=' + sitemap,
            })

            return openUI(params, sitemap)
        }

        return openUI(params)
    });

    let docs = commands.registerCommand('openhab.searchDocs', () => {
        let editor = window.activeTextEditor
        if (!editor) {
            window.showInformationMessage('No editor is active');
            return;
        }

        let selection = editor.selection
        let text = editor.document.getText(selection)
        let url = "http://docs.openhab.org/search?q=" + text.replace(' ', '%20')
        commands.executeCommand('vscode.open', Uri.parse(url))
    });

    disposables.push(basicUI, docs);
}

export function activate(context: ExtensionContext) {
    const disposables: Disposable[] = [];
    context.subscriptions.push(new Disposable(() => Disposable.from(...disposables).dispose()));

    init(context, disposables)
        .catch(err => console.error(err));
}

// this method is called when your extension is deactivated
export function deactivate() {
}