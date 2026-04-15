'use strict'

import * as vscode from 'vscode'
import * as utils from './Utils/Utils'

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
import * as path from 'path'
import { ConfigManager } from './Utils/ConfigManager'
import { UpdateNoticePanel } from './WebViews/UpdateNoticePanel'
import { OH_CONFIG_PARAMETERS } from './Utils/types'
import { MigrationManager } from './Utils/MigrationManager'

let _extensionPath: string
let ohStatusBarItem: vscode.StatusBarItem

/**
 * Initializes the openHAB extension
 * and registers all commands, views and providers depending on the user configuration.
 *
 * @param disposables Array of disposables, which will be added to the corresponding subscription
 * @param config The extension configuration
 * @param context The extension context
 */
async function init(disposables: vscode.Disposable[], context: vscode.ExtensionContext): Promise<void> {

    // Handle configuration changes
    ConfigManager.attachConfigChangeWatcher(context)

    disposables.push(vscode.commands.registerCommand('openhab.updateNotice', () => {
        UpdateNoticePanel.createOrShow(context.extensionUri)
    }))

    disposables.push(vscode.commands.registerCommand('openhab.basicUI', () => {
        let editor = vscode.window.activeTextEditor
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active')
            return
        }

        let fileName = path.basename(editor.document.fileName)

        // Open specific sitemap if a sitemap file is active
        if (fileName.endsWith('sitemap')) {
            let sitemap = fileName.split('.')[0]

            utils.appendToOutput(`Attempting to open Sitemap "${sitemap}" in BasicUI.`)
            return utils.openUI(
                _extensionPath,
                `/basicui/app?sitemap=${sitemap}`,
                sitemap
            )
        }

        // If there is only one user created sitemap open it directly, open sitemap list otherwise
        utils.getSitemaps().then(sitemaps => {
            const defaultName = sitemap => sitemap.name === '_default'
            const defaultSitemap = sitemaps.find(defaultName)

            if (sitemaps.length === 1) {
                return utils.openUI(
                    _extensionPath,
                    `/basicui/app?sitemap=${sitemaps[0].name}`,
                    sitemaps[0].name
                )
            }

            if (sitemaps.length === 2 && typeof defaultSitemap !== 'undefined') {
                const index = sitemaps.indexOf(defaultName) === 0 ? 1 : 0
                return utils.openUI(
                    _extensionPath,
                    `/basicui/app?sitemap=${sitemaps[index].name}`,
                    sitemaps[index].name
                )
            }

            return utils.openUI(_extensionPath)
        })

    }))

    disposables.push(vscode.commands.registerCommand('openhab.searchCommunity', (phrase?) => {
        let query: string = phrase || '%s'
        utils.openBrowser(`https://community.openhab.org/search?q=${query}`)
    }))

    disposables.push(vscode.commands.registerCommand('openhab.openConsole', () => {
        let command = (ConfigManager.get(OH_CONFIG_PARAMETERS.consoleCommand) as string).replace(/%openhabhost%/g, (ConfigManager.get(OH_CONFIG_PARAMETERS.connection.host) as string))
        const terminal = vscode.window.createTerminal('openHAB')
        terminal.sendText(command, true)
        terminal.show(false)
    }))

    disposables.push(vscode.commands.registerCommand('openhab.command.things.docs', (query: Thing) =>
        utils.openBrowser(`https://www.openhab.org/addons/bindings/${query.binding}/`)))

    if (ConfigManager.get(OH_CONFIG_PARAMETERS.useRestApi) as boolean) {
        const itemsExplorer = new ItemsExplorer()
        const thingsExplorer = new ThingsExplorer()
        const itemsCompletion = new ItemsCompletion()
        const ohHoverProvider = new HoverProvider()

        disposables.push(vscode.window.registerTreeDataProvider('openhabItems', itemsExplorer))
        disposables.push(vscode.window.registerTreeDataProvider('openhabThings', thingsExplorer))
        disposables.push(vscode.commands.registerCommand('openhab.command.refreshEntry', () => {
            itemsExplorer.refresh()
            thingsExplorer.refresh()
        }))

        disposables.push(vscode.commands.registerCommand('openhab.command.copyName', (query) => {
            let text: string | undefined
            if (typeof query === 'string') {
                text = String(query)
            } else if (query) {
                // Prefer UID (things), then name (items), then label as fallback
                if (query.UID || query.uid) {
                    text = String(query.UID || query.uid)
                } else if (query.name) {
                    text = String(query.name)
                } else if (query.label) {
                    text = String(query.label)
                }
            }
            if (!text) {
                vscode.window.showInformationMessage('Nothing selected to copy')
                return
            }
            vscode.env.clipboard.writeText(String(text))
        }))

        disposables.push(vscode.commands.registerCommand('openhab.command.items.copyState', (query: Item) => {
            const state = query && query.state ? String(query.state) : undefined
            if (!state) {
                vscode.window.showInformationMessage('No state available to copy')
                return
            }
            vscode.env.clipboard.writeText(state)
        }))

        disposables.push(vscode.commands.registerCommand('openhab.command.items.copyLabel', (query: Item) => {
            const label = query && query.label ? String(query.label) : undefined
            if (!label) {
                vscode.window.showInformationMessage('No label available to copy')
                return
            }
            vscode.env.clipboard.writeText(String(label))
        }))

        disposables.push(vscode.commands.registerCommand('openhab.command.items.addRule', (query: Item) => {
            const ruleProvider = new RuleProvider(query)
            ruleProvider.addRule()
        }))

        disposables.push(vscode.commands.registerCommand('openhab.command.items.addToSitemap', (query: Item) => {
            const sitemapProvider = new SitemapPartialProvider(query)
            sitemapProvider.addToSitemap()
        }))

        disposables.push(vscode.commands.registerCommand('openhab.command.things.addItems', (query: Thing | Channel) => {
            const itemsProvider = new ItemsProvider(query)
            itemsProvider.addToItems()
        }))

        disposables.push(vscode.commands.registerCommand('openhab.command.things.copyUID', (query) => {
            let uid: string | undefined
            if (typeof query === 'string') {
                uid = String(query)
            } else if (query && (query.UID || query.uid)) {
                uid = String(query.UID || query.uid)
            }
            if (!uid) {
                vscode.window.showInformationMessage('No UID available to copy')
                return
            }
            vscode.env.clipboard.writeText(String(uid))
        }))

        disposables.push(vscode.commands.registerCommand('openhab.command.things.copyLabel', (query: Thing) => {
            const label = query && query.label ? String(query.label) : undefined
            if (!label) {
                vscode.window.showInformationMessage('No label available to copy')
                return
            }
            vscode.env.clipboard.writeText(String(label))
        }))


        disposables.push(vscode.languages.registerHoverProvider({ language: 'openhab', scheme: 'file' }, {

            provideHover(document, position, token) {

                let docLine = document.lineAt(position.line)
                let hoveredLine = docLine.text.slice(docLine.firstNonWhitespaceCharacterIndex)

                let hoveredRange = document.getWordRangeAtPosition(position)
                let hoveredText = document.getText(hoveredRange)

                // let matchresult = hoveredText.match(/(\w+){1}/gm)
                let matchresult = hoveredText.match(HoverProvider.HOVERED_WORD_REGEX)

                if (!matchresult || matchresult.length > 1) {
                    console.log(`That's no single word. Waiting for the next hover.`)
                    return null
                }

                // Will return null or the hover content
                return ohHoverProvider.getHover(hoveredText, hoveredLine)
            }
        })

        )

        // Listen for document save events, to update the cached items
        vscode.workspace.onDidSaveTextDocument((savedDocument) => {
            let fileEnding = savedDocument.fileName.split(".").slice(-1)[0]

            if (fileEnding === "items") {
                console.log(`Items file was saved.\nRefreshing cached items for HoverProvider`)

                // Give item registry some time to reflect the file changes.
                utils.sleep(1500).then(() => {
                    return ohHoverProvider.updateItems()
                })
            }
        })
    }

    if (ConfigManager.get(OH_CONFIG_PARAMETERS.languageserver.remoteEnabled) as boolean) {
        const remoteLanguageClientProvider = new RemoteLanguageClientProvider()
        disposables.push(remoteLanguageClientProvider.connect())
    }

    const localLanguageClientProvider = new LocalLanguageClientProvider()
    disposables.push(localLanguageClientProvider.connect(context))

    ohStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 20)
    ohStatusBarItem.text = `$(home) openHAB`
    ohStatusBarItem.tooltip = `openHAB extension is active currently.`
    ohStatusBarItem.show()
}

// This method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

    // Check for version changes and display update notice, when needed
    MigrationManager.updateCheck(context)

    // Prepare disposables array, context and config
    const disposables: vscode.Disposable[] = []
    _extensionPath = context.extensionPath

    // Spread in the disposables array to the subscription (This will include all disposables from the init method)
    context.subscriptions.push(new vscode.Disposable(() => vscode.Disposable.from(...disposables).dispose()))

    init(disposables, context)
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
