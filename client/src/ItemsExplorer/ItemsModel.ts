import {
    commands,
    Uri,
    window,
    workspace
} from 'vscode'
import { Item } from './Item'
import * as utils from '../Utils'

import * as _ from 'lodash'
import * as request from 'request-promise-native'

/**
 * Collects Items in JSON format from REST API
 * and transforms it into a tree
 *
 * @author Kuba Wolanin - Initial contribution
 */
export class ItemsModel {

    constructor() {
    }

    /**
     * Returns Items that don't belong to any Group
     */
    public get roots(): Thenable<Item[]> {
        return this.sendRequest(null, (items: Item[]) => {
            let itemsMap = items.map(item => new Item(item))
            let rootItems = _.filter(itemsMap, (item: Item) => item.isRootItem)
            return this.sort(rootItems)
        })
    }

    /**
     * Returns members of Group-type Item
     * @param item openHAB root Item
     */
    public getChildren(item: Item): Thenable<Item[]> {
        return this.sendRequest(utils.getHost() + '/rest/items/' + item.name, (item: Item) => {
            let itemsMap = item.members.map(item => new Item(item))
            return this.sort(itemsMap)
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

    /**
     * Sends a request to rest api and returns a callback afterwards
     *
     * @param uri api endpoint to be requested
     * @param transform callback
     */
    private sendRequest(uri: string, transform): Thenable<Item[]> {
        let options = {
            uri: uri || utils.getHost() + '/rest/items',
            json: true,
            encoding: 'utf8'
        }

        return new Promise((resolve, _reject) => {
            request(options)
                .then(function (response: Item[] | Item) {
                    resolve(transform(response))
                }.bind(this))
                .catch(err => {
                    utils.appendToOutput(`Could not reload items for Items Explorer`)
                    utils.handleRequestError(err).then(err => resolve([]))
                })
        })
    }

    /**
     * Sorts items in alphabetical order. Only needed for items explorer, code completion is sorted by vscode
     */
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
