'use strict';

import {
    commands,
    Disposable,
    ExtensionContext,
    languages,
    window,
    workspace
} from 'vscode'

import {
    OpenHABContentProvider
} from './ContentProvider/openHAB'

import {
    openBrowser,
    getSitemaps,
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

let _extensionPath: string;

async function init(disposables: Disposable[], config): Promise<void> {
    const ui = new OpenHABContentProvider()

    disposables.push(commands.registerCommand('openhab.basicUI', () => {
        let editor = window.activeTextEditor
        if (!editor) {
            window.showInformationMessage('No editor is active')
            return
        }

        let absolutePath = editor.document.fileName
        let fileName = path.basename(absolutePath)
        let ui = config.sitemapPreviewUI

        // Open specific sitemap if a sitemap file is active
        if (fileName.endsWith('sitemap')) {
            let sitemap = fileName.split('.')[0]
            return openUI(
                _extensionPath,{
                    route: `/${ui}/app?sitemap=${sitemap}`,
                }, sitemap
            )
        }

        // Open classic ui, if choosen in config
        if (ui === 'classicui') {
            return openUI(
                _extensionPath,{
                    route: `/${ui}/app?sitemap=_default`,
                }, 'Classic UI'
            )
        }

        // If there is only one user created sitemap open it directly, open sitemap list otherwise
        getSitemaps().then(sitemaps => {
            const defaultName = sitemap => sitemap.name === '_default'
            const defaultSitemap = sitemaps.find(defaultName)

            if (sitemaps.length === 1) {
                return openUI(
                    _extensionPath,{
                        route: `/${ui}/app?sitemap=${sitemaps[0].name}`,
                    }, sitemaps[0].name
                )
            }

            if (sitemaps.length === 2 && typeof defaultSitemap !== 'undefined') {
                const index = sitemaps.indexOf(defaultName) === 0 ? 1 : 0
                return openUI(
                    _extensionPath,{
                        route: `/${ui}/app?sitemap=${sitemaps[index].name}`,
                    }, sitemaps[index].name
                )
            }

            return openUI(_extensionPath)
        });

    }))

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

        return openBrowser(route.replace(/%23/g, '#'))
    }))

    disposables.push(commands.registerCommand('openhab.command.things.docs', (query: Thing) =>
        openBrowser(`https://www.openhab.org/addons/bindings/${query.binding}/`)))

    if (config.useRestApi) {
        const itemsExplorer = new ItemsExplorer()
        const thingsExplorer = new ThingsExplorer()
        const itemsCompletion = new ItemsCompletion()

        disposables.push(window.registerTreeDataProvider('openhabItems', itemsExplorer))
        disposables.push(window.registerTreeDataProvider('openhabThings', thingsExplorer))
        disposables.push(commands.registerCommand('openhab.command.refreshEntry', () => {
            itemsExplorer.refresh();
            thingsExplorer.refresh();
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
    _extensionPath = context.extensionPath;
    let config = workspace.getConfiguration('openhab')
    context.subscriptions.push(new Disposable(() => Disposable.from(...disposables).dispose()))

    init(disposables, config)
        .catch(err => console.error(err));
}

// this method is called when your extension is deactivated
export function deactivate() {
}
