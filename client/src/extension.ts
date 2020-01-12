'use strict'

import {
    commands,
    Disposable,
    ExtensionContext,
    languages,
    window,
    workspace,
    StatusBarItem,
    StatusBarAlignment
} from 'vscode'

import * as utils from './Utils'

import { ItemsExplorer } from './ItemsExplorer/ItemsExplorer'
import { ThingsExplorer } from './ThingsExplorer/ThingsExplorer'
import { ItemsProvider } from './ThingsExplorer/ItemsProvider'
import { ItemsCompletion } from './ItemsExplorer/ItemsCompletion'
import { RuleProvider } from './ItemsExplorer/RuleProvider'
import { SitemapPartialProvider } from './ItemsExplorer/SitemapPartialProvider'
import { LocalLanguageClientProvider } from './LanguageClient/LocalLanguageClientProvider'
import { RemoteLanguageClientProvider } from './LanguageClient/RemoteLanguageClientProvider'
import { Item } from './ItemsExplorer/Item'
import { Thing } from './ThingsExplorer/Thing'
import { Channel } from './ThingsExplorer/Channel'
import { HoverProvider } from './HoverProvider/HoverProvider'

import * as _ from 'lodash'
import * as ncp from 'copy-paste'
import * as path from 'path'
import { SSL_OP_EPHEMERAL_RSA } from 'constants'

let _extensionPath: string
let ohStatusBarItem: StatusBarItem

/**
 * Initializes the openHAB extension
 * and registers all commands, views and providers depending on the user configuration.
 *
 * @param disposables Array of disposables, which will be added to the corresponding subscription
 * @param config The extension configuration
 * @param context The extension context
 */
async function init(disposables: Disposable[], config, context): Promise<void> {

    disposables.push(commands.registerCommand('openhab.basicUI', () => {
        let editor = window.activeTextEditor
        if (!editor) {
            window.showInformationMessage('No editor is active')
            return
        }

        let fileName = path.basename(editor.document.fileName)
        let ui = config.sitemapPreviewUI

        // Open specific sitemap if a sitemap file is active
        if (fileName.endsWith('sitemap')) {
            let sitemap = fileName.split('.')[0]

            utils.appendToOutput(`Attempting to open Sitemap "${sitemap}" in BasicUI.`)
            return utils.openUI(
                _extensionPath,
                `/${ui}/app?sitemap=${sitemap}`,
                sitemap
            )
        }

        // Open classic ui, if choosen in config
        if (ui === 'classicui') {
            return utils.openUI(
                _extensionPath,
                `/${ui}/app?sitemap=_default`,
                'Classic UI'
            )
        }

        // If there is only one user created sitemap open it directly, open sitemap list otherwise
        utils.getSitemaps().then(sitemaps => {
            const defaultName = sitemap => sitemap.name === '_default'
            const defaultSitemap = sitemaps.find(defaultName)

            if (sitemaps.length === 1) {
                return utils.openUI(
                    _extensionPath,
                    `/${ui}/app?sitemap=${sitemaps[0].name}`,
                    sitemaps[0].name
                )
            }

            if (sitemaps.length === 2 && typeof defaultSitemap !== 'undefined') {
                const index = sitemaps.indexOf(defaultName) === 0 ? 1 : 0
                return utils.openUI(
                    _extensionPath,
                    `/${ui}/app?sitemap=${sitemaps[index].name}`,
                    sitemaps[index].name
                )
            }

            return utils.openUI(_extensionPath)
        })

    }))

    disposables.push(commands.registerCommand('openhab.searchCommunity', (phrase?) => {
        let query: string = phrase || '%s'
        utils.openBrowser(`https://community.openhab.org/search?q=${query}`)
    }))

    disposables.push(commands.registerCommand('openhab.openConsole', () => {
        let command = config.consoleCommand.replace(/%openhabhost%/g, config.connection.host)
        const terminal = window.createTerminal('openHAB')
        terminal.sendText(command, true)
        terminal.show(false)
    }))

    disposables.push(commands.registerCommand('openhab.command.showInPaperUI', (query?) => {
        let param: string = query.name ? query.name : query
        let paperPath = config.paperPath
        let route = `/${paperPath}/index.html%23/configuration/`

        route += (query.UID) ? `things/view/${query.UID}` : `item/edit/${param}`

        // Check if simple mode is enabled
        utils.getSimpleModeState().then(simpleModeActive => {

            if(!query.UID && simpleModeActive){
                window.showWarningMessage(`Your openHAB environment is running in simple mode. Paper UI can't edit items when this mode is activated!`)
                return
            }

            return utils.openBrowser(route.replace(/%23/g, '#'))
        })

    }))

    disposables.push(commands.registerCommand('openhab.command.things.docs', (query: Thing) =>
        utils.openBrowser(`https://www.openhab.org/addons/bindings/${query.binding}/`)))

    if (config.connection.useRestApi) {
        const itemsExplorer = new ItemsExplorer()
        const thingsExplorer = new ThingsExplorer()
        const itemsCompletion = new ItemsCompletion()
        const ohHoverProvider = new HoverProvider()

        disposables.push(window.registerTreeDataProvider('openhabItems', itemsExplorer))
        disposables.push(window.registerTreeDataProvider('openhabThings', thingsExplorer))
        disposables.push(commands.registerCommand('openhab.command.refreshEntry', () => {
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


        disposables.push(languages.registerHoverProvider({ language: 'openhab', scheme: 'file'}, {

                provideHover(document, position, token){
                    let hoveredRange = document.getWordRangeAtPosition(position)
                    let hoveredText = document.getText(hoveredRange)

                    let matchresult = hoveredText.match(/(\w+){1}/gm)
                    if (!matchresult || matchresult.length > 1){
                        console.log(`That's no single word. Waiting for the next hover.`)
                        return null
                    }

                    // Will return null or the hover content
                    return ohHoverProvider.getRestHover(hoveredText)
                }
            })

        )

        // Listen for document save events, to update the cached items
        workspace.onDidSaveTextDocument((savedDocument) => {
            let fileEnding = savedDocument.fileName.split(".").slice(-1)[0]

            if(fileEnding === "items"){
                console.log(`Items file was saved.\nRefreshing cached items for HoverProvider`)

                // Give item registry some time to reflect the file changes.
                utils.sleep(1500).then(() => {
                    ohHoverProvider.updateItems()
                })
            }
        })
    }

    if (config.remoteLsp.enabled) {
        const remoteLanguageClientProvider = new RemoteLanguageClientProvider()
        disposables.push(remoteLanguageClientProvider.connect())
    }

    const localLanguageClientProvider = new LocalLanguageClientProvider()
    disposables.push(localLanguageClientProvider.connect(context))

    ohStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 20)
    ohStatusBarItem.text = `$(home) openHAB`
    ohStatusBarItem.tooltip = `openHAB extension is active currently.`
    ohStatusBarItem.show()
}

// This method is called when the extension is activated
export function activate(context: ExtensionContext) {

    // Prepare disposables array, context and config
    const disposables: Disposable[] = []
    _extensionPath = context.extensionPath
    let config = workspace.getConfiguration('openhab')

    // Spread in the disposables array to the subscription (This will include all disposables from the init method)
    context.subscriptions.push(new Disposable(() => Disposable.from(...disposables).dispose()))

    init(disposables, config, context)
        .catch(err => console.error(err))

    var message = `openHAB vscode extension has been activated`
    console.log(message)
    utils.appendToOutput(message)

}

// This method is called when the extension is deactivated
export function deactivate() {
    ohStatusBarItem.hide()

    var message = `openHAB vscode extension has been shut down`
    console.log(message)
    utils.appendToOutput(message)
}
