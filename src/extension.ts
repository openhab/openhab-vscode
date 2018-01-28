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
    openBrowser,
    openHtml,
    openUI
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

import * as nls from 'vscode-nls'
const localize = nls.loadMessageBundle()

async function init(context: ExtensionContext, disposables: Disposable[], config): Promise<void> {
    const ui = new OpenHABContentProvider()
    const registration = workspace.registerTextDocumentContentProvider(SCHEME, ui)

    disposables.push(commands.registerCommand('openhab.basicUI', () => {
        let editor = window.activeTextEditor
        if (!editor) {
            window.showInformationMessage(localize('init.noActiveEditor.text','No editor is active'))
            return
        }

        let absolutePath = editor.document.fileName
        let fileName = path.basename(absolutePath)
        let ui = config.sitemapPreviewUI

        if (fileName.endsWith('sitemap')) {
            let sitemap = fileName.split('.')[0]
            return openUI({
                route: `/${ui}/app?sitemap=${sitemap}`,
            }, sitemap)
        }

        if (ui === 'classicui') {
            return openUI({
                route: `/${ui}/app?sitemap=_default`,
            }, 'Classic UI')
        }

        return openUI()
    }))

    disposables.push(commands.registerCommand('openhab.searchDocs', () => openBrowser()))

    disposables.push(commands.registerCommand('openhab.searchCommunity', (phrase?) => {
        let query: string = phrase || '%s'
        openBrowser(`https://community.openhab.org/search?q=${query}`)
    }))

    disposables.push(commands.registerCommand('openhab.openKaraf', () => {
        let command = config.karafCommand.replace(/%openhabhost%/g, config.host)
        const terminal = window.createTerminal('openHAB')
        terminal.sendText(command, true)
        terminal.show(false)
    }))

    disposables.push(commands.registerCommand('openhab.command.showInPaperUI', (query?) => {
        let param: string = query.name ? query.name : query
        let title = `${param} - Paper UI`
        let paperPath = config.paperPath
        let route = `/${paperPath}/index.html%23/configuration/`

        if (query.UID) {
            title = `${query.label} - Paper UI`
            route += `things/view/${query.UID}`
        } else {
            route += `item/edit/${param}`
        }

        let options = {
            route: route
        }

        return config.paperInBrowser ? openBrowser(route.replace(/%23/g, '#')) : openUI(options, title)
    }))

    disposables.push(commands.registerCommand('openhab.command.things.docs', (query: Thing) =>
        openBrowser(`https://docs.openhab.org/addons/bindings/${query.binding}/readme.html`)))

    if (config.useRestApi) {
        const itemsExplorer = new ItemsExplorer()
        const thingsExplorer = new ThingsExplorer()
        const itemsCompletion = new ItemsCompletion()

        disposables.push(window.registerTreeDataProvider('openhabItems', itemsExplorer))
        disposables.push(window.registerTreeDataProvider('openhabThings', thingsExplorer))
        disposables.push(commands.registerCommand('openhab.command.refreshEntry', (query) => {
            itemsExplorer.refresh()
            thingsExplorer.refresh()
        }))

        disposables.push(commands.registerCommand('openhab.command.copyName', (query) =>
            ncp.copy(query.name || query.label)))

        disposables.push(commands.registerCommand('openhab.command.items.copyState', (query: Item) =>
            ncp.copy(query.state)))

        disposables.push(commands.registerCommand('openhab.command.items.addRule', (query: Item) => {
            const ruleProvider = new RuleProvider(query)
            ruleProvider.addRule()
        }))

        disposables.push(commands.registerCommand('openhab.command.items.addToSitemap', (query: Item) => {
            const sitemapProvider = new SitemapPartialProvider(query)
            sitemapProvider.addToSitemap()
        }))

        disposables.push(commands.registerCommand('openhab.command.things.addItems', (query: Thing | Channel) => {
            const itemsProvider = new ItemsProvider(query)
            itemsProvider.addToItems()
        }))

        disposables.push(commands.registerCommand('openhab.command.things.copyUID', (query) =>
            ncp.copy(query.UID || query.uid)))

        if (config.restCompletions) {
            disposables.push(languages.registerCompletionItemProvider('openhab', itemsCompletion))
        }
    }

    if (config.lspEnabled) {
        const languageClientProvider = new LanguageClientProvider()
        disposables.push(languageClientProvider.connect())
    }
}
export function activate(context: ExtensionContext) {
    const disposables: Disposable[] = [];
    let config = workspace.getConfiguration('openhab')
    context.subscriptions.push(new Disposable(() => Disposable.from(...disposables).dispose()))

    init(context, disposables, config)
        .catch(err => console.error(err));
}

// this method is called when your extension is deactivated
export function deactivate() {
}