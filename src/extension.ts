'use strict';

import {
    commands,
    CompletionItem,
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
    hasExtension,
    getBuildVersion,
    openBrowser,
    openHtml,
    openUI,
    pathExists
} from './Utils'

import { ItemsExplorer } from './ItemsExplorer/ItemsExplorer'
import { ItemsCompletion } from './ItemsExplorer/ItemsCompletion'
import { RuleProvider } from './ItemsExplorer/RuleProvider'
import { SitemapPartialProvider } from './ItemsExplorer/SitemapPartialProvider'
import { LanguageClientProvider } from './LanguageClient/LanguageClientProvider'
import { Item } from './ItemsExplorer/Item'

import * as _ from 'lodash'
import * as ncp from 'copy-paste'
import * as path from 'path'

async function init(context: ExtensionContext, disposables: Disposable[]): Promise<void> {
    let ui = new OpenHABContentProvider()
    let registration = workspace.registerTextDocumentContentProvider(SCHEME, ui)
    let paperPath = ''

    const itemsExplorer = new ItemsExplorer(getHost())
    const itemsCompletion = new ItemsCompletion(getHost())

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

    disposables.push(commands.registerCommand('openhab.command.items.showInPaperUI', (query?) => {
        let param: string = query.name ? query.name : query

        if (paperPath) {
            return openUI({
                route: '/' + paperPath + '/index.html%23/configuration/item/edit/' + param
            }, param + ' - Paper UI')
        } else {
            getBuildVersion().then((version) => {
                let str = version.split('.')[3]
                let releaseDate = new Date(+str.slice(0, 4), +str.slice(4, 6), +str.slice(-2))
                // see: https://github.com/eclipse/smarthome/issues/3827#issuecomment-314574053
                let deprecatedDate = new Date(2017, 1, 9)

                paperPath = releaseDate > deprecatedDate ? 'paperui' : 'ui'

                return openUI({
                    route: '/' + paperPath + '/index.html%23/configuration/item/edit/' + param
                }, param + ' - Paper UI')
            })
        }
    }))

    if (isOpenHABWorkspace()) {
        disposables.push(window.registerTreeDataProvider('openhabItems', itemsExplorer))
        disposables.push(languages.registerCompletionItemProvider('openhab', itemsCompletion))

        if( hasExtension('misc-lsp') ) {
            let languageClientProvider = new LanguageClientProvider()
            disposables.push(languageClientProvider.connect())
        }
    }

    disposables.push(commands.registerCommand('openhab.command.items.refreshEntry', () => {
        itemsExplorer.refresh()
    }))

    disposables.push(commands.registerCommand('openhab.command.items.copyName', (query: Item) =>
        ncp.copy(query.name)))

    disposables.push(commands.registerCommand('openhab.command.items.copyState', (query: Item) =>
        ncp.copy(query.state)))

    disposables.push(commands.registerCommand('openhab.command.items.addRule', (query: Item) => {
        let ruleProvider = new RuleProvider(query)
        ruleProvider.addRule()
    }))

    disposables.push(commands.registerCommand('openhab.command.items.addToSitemap', (query: Item) => {
        let sitemapProvider = new SitemapPartialProvider(query)
        sitemapProvider.addToSitemap()
    }))
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