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
import { ThingsExplorer } from './ThingsExplorer/ThingsExplorer'
import { ItemsProvider } from './ThingsExplorer/ItemsProvider'
import { ItemsCompletion } from './ItemsExplorer/ItemsCompletion'
import { RuleProvider } from './ItemsExplorer/RuleProvider'
import { SitemapPartialProvider } from './ItemsExplorer/SitemapPartialProvider'
import { LanguageClientProvider } from './LanguageClient/LanguageClientProvider'
import { Item } from './ItemsExplorer/Item'
import { Thing } from './ThingsExplorer/Thing'
import { Channel } from './ThingsExplorer/Channel'

import * as _ from 'lodash'
import * as ncp from 'copy-paste'
import * as path from 'path'

async function init(context: ExtensionContext, disposables: Disposable[]): Promise<void> {
    let ui = new OpenHABContentProvider()
    let registration = workspace.registerTextDocumentContentProvider(SCHEME, ui)

    const itemsExplorer = new ItemsExplorer(getHost())
    const thingsExplorer = new ThingsExplorer(getHost())
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
                route: `/basicui/app?sitemap=${sitemap}`,
            }, `${sitemap} - Basic UI`)
        }

        return openUI()
    }))

    disposables.push(commands.registerCommand('openhab.searchDocs', () => openBrowser()))

    disposables.push(commands.registerCommand('openhab.searchCommunity', (phrase?) => {
        let query: string = phrase || '%s'
        openBrowser(`https://community.openhab.org/search?q=${query}`)
    }))

    disposables.push(commands.registerCommand('openhab.command.showInPaperUI', (query?) => {
        let param: string = query.name ? query.name : query
        let title = `${param} - Paper UI`
        let config = workspace.getConfiguration('openhab')
        let paperPath = config.paperPath
        let route = `/${paperPath}/index.html%23/configuration/`

        if (query.UID) {
            title =  `${query.label} - Paper UI`
            route += `things/view/${query.UID}`
        } else {
            route += `item/edit/${param}`
        }

        let options = {
            route: route
        }

        return config.paperInBrowser ? openBrowser(route.replace(/%23/g, '#')) : openUI(options, title)
    }))

    if (isOpenHABWorkspace()) {
        disposables.push(window.registerTreeDataProvider('openhabItems', itemsExplorer))
        disposables.push(window.registerTreeDataProvider('openhabThings', thingsExplorer))
        disposables.push(languages.registerCompletionItemProvider('openhab', itemsCompletion))

        if( hasExtension('misc-lsp') ) {
            let languageClientProvider = new LanguageClientProvider()
            disposables.push(languageClientProvider.connect())
        }
        // const itemsCompletion = new ItemsCompletion(getHost())
        // disposables.push(languages.registerCompletionItemProvider('openhab', itemsCompletion))
    }

    disposables.push(commands.registerCommand('openhab.command.refreshEntry', (query) => {
        itemsExplorer.refresh()
        thingsExplorer.refresh()
    }))

    disposables.push(commands.registerCommand('openhab.command.copyName', (query) =>
        ncp.copy(query.name || query.label)))

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

    disposables.push(commands.registerCommand('openhab.command.things.docs', (query: Thing) =>
    openBrowser(`http://docs.openhab.org/addons/bindings/${query.binding}/readme.html`)))

    disposables.push(commands.registerCommand('openhab.command.things.addItems', (query: Thing | Channel) => {
        let itemsProvider = new ItemsProvider(query)
        itemsProvider.addToItems()
    }))

    disposables.push(commands.registerCommand('openhab.command.things.copyUID', (query) =>
    ncp.copy(query.UID || query.uid)))

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