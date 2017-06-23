'use strict';

import {
    commands,
    Disposable,
    ExtensionContext,
    languages,
    TextDocumentChangeEvent,
    Uri,
    ViewColumn,
    window,
    workspace
} from 'vscode'

import {
    SCHEME,
    OpenHABContentProvider
} from './ContentProvider/openHAB'

import {
    getHost,
    isOpenHABWorkspace,
    openBrowser,
    openHtml,
    openUI,
    pathExists
} from './Utils'

import { ItemsExplorer } from './ItemsExplorer/ItemsExplorer'
import { ItemReference } from './ItemsExplorer/ItemReference'
import { RuleProvider } from './ItemsExplorer/RuleProvider'
import { Item } from './ItemsExplorer/Item'

import * as _ from 'lodash'
import * as ncp from 'copy-paste'
import * as path from 'path'

async function init(context: ExtensionContext, disposables: Disposable[]): Promise<void> {
    let ui = new OpenHABContentProvider()
    let registration = workspace.registerTextDocumentContentProvider(SCHEME, ui)
    const itemsExplorer = new ItemsExplorer(getHost())

    disposables.push(languages.registerReferenceProvider({
        language: 'openhab',
        scheme: 'file'
    }, new ItemReference()))

    disposables.push(commands.registerCommand('openhab.basicUI', () => {
        let editor = window.activeTextEditor
        if (!editor) {
            window.showInformationMessage('No editor is active')
            return
        }

        let absolutePath = editor.document.fileName
        let fileName = path.basename(absolutePath)

        if (fileName.split('.')[1] === 'sitemap') {
            let sitemap = fileName.split('.')[0]
            return openUI({
                route: '/basicui/app?sitemap=' + sitemap,
            }, sitemap + ' - Basic UI')
        }

        return openUI()
    }))

    disposables.push(commands.registerCommand('openhab.searchDocs', () => openBrowser()))

    disposables.push(commands.registerCommand('openhab.searchCommunity', (phrase?) => {
        let query: string = phrase || '%s'
        openBrowser('https://community.openhab.org/search?q=' + query)
    }))

    disposables.push(commands.registerCommand('openhab.command.items.editInPaperUI', (query?) => {
        let param: string = query.name ? query.name : query
        return openUI({
            route: '/paperui/index.html%23/configuration/item/edit/' + param
        }, param + ' - Paper UI')
    }))

    disposables.push(commands.registerCommand('openhab.command.items.findInFiles', (query: Item) => {
        commands.executeCommand('workbench.action.findInFiles', query.name)
    }))

    disposables.push(commands.registerCommand('openhab.command.items.refreshEntry', () => {
        itemsExplorer.refresh()
    }))

    disposables.push(commands.registerCommand('openhab.command.items.copyName', (query: Item) =>
        ncp.copy(query.name)))

    disposables.push(commands.registerCommand('openhab.command.items.addRule', (query: Item) => {
        let ruleProvider = new RuleProvider(query)
        ruleProvider.addRule()
    }))

    if (isOpenHABWorkspace()) {
        disposables.push(window.registerTreeDataProvider('openhabItems', itemsExplorer))
    }
}

export function activate(context: ExtensionContext) {
    const disposables: Disposable[] = [];
    context.subscriptions.push(new Disposable(() => Disposable.from(...disposables).dispose()))

    init(context, disposables)
        .catch(err => console.error(err));
}

// this method is called when your extension is deactivated
export function deactivate() {
}