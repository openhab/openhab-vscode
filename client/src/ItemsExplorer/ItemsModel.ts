import {
    commands,
    Uri,
    window,
    workspace
} from 'vscode'
import { Item } from './Item'
import { handleRequestError } from '../Utils'

import * as _ from 'lodash'
import * as request from 'request-promise-native'

/**
 * Collects Items in JSON format from REST API
 * and transforms it into a tree
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
        return this.sendRequest(this.host + '/rest/items/' + item.name, (item: Item) => {
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
            json: true,
            encoding: 'utf8'
        }

        return new Promise((resolve, reject) => {
            request(options)
                .then(function (response: Item[] | Item) {
                    resolve(transform(response))
                }.bind(this))
                .catch(err => {
                    handleRequestError(err).then(err => resolve([]))
                })
        })
    }
}
