import {
    commands,
    Uri,
    window,
    workspace
} from 'vscode'
import { Item } from './Item'

import * as _ from 'lodash'
import * as request from 'request-promise-native'

/**
 * Collects Items in JSON format from REST API
 * and transforms it into sorted tree
 * 
 * Kuba Wolanin - Initial contribution
 */
export class ItemsModel {

    constructor(private host: string) {
    }

    /**
     * Returns Items that don't belong to any Group
     */
    public get roots(): Thenable<Item[]> {
        return this.sendRequest(null, (items: Item[]) => {
            let itemsMap = items.map(item => new Item(item))
            let rootItems = _.filter(itemsMap, (item: Item) => item.isRootItem)
            return rootItems
        })
    }

    /**
     * Returns members of Group-type Item
     * @param item openHAB root Item
     */
    public getChildren(item: Item): Thenable<Item[]> {
        return this.sendRequest(item.link, (item: Item) => {
            let itemsMap = item.members.map(item => new Item(item))
            return itemsMap
        })
    }

    /**
     * List of items used in ItemsCompletion
     */
    public get completions(): Thenable<Item[]> {
        return this.sendRequest(null, (items: Item[]) => {
            return items
        })
    }

    private sendRequest(uri: string, transform): Thenable<Item[]> {
        let options = {
            uri: uri || this.host + '/rest/items',
            json: true
        }

        return new Promise((resolve, reject) => {
            request(options)
                .then(function (response: Item[] | Item) {
                    resolve(this.sort(transform(response)))
                }.bind(this))
                .catch(async err => {
                    let config = workspace.getConfiguration('openhab')
                    const setHost = 'Set openHAB host'
                    const disableRest = 'Disable REST API'
                    const result = await window.showErrorMessage('Error while connecting to openHAB REST API. ', setHost, disableRest)
                    switch (result) {
                        case setHost:
                            config.update('host', 'localhost')
                            commands.executeCommand('workbench.action.openWorkspaceSettings')
                            break
                        case disableRest:
                            config.update('useRestApi', false)
                            break
                        default:
                            break
                    }
                    reject()
                })
        })
    }

    protected sort(nodes: Item[]): Item[] {
        return nodes.sort((n1, n2) => {
            if (n1.isGroup && !n2.isGroup) {
                return -1
            }

            if (!n1.isGroup && n2.isGroup) {
                return 1
            }

            return n1.name.localeCompare(n2.name)
        });
    }
}
