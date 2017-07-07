import { window } from 'vscode'
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

    public get roots(): Thenable<Item[]> {
        return this.sendRequest(null, (items: Item[]) => {
            let itemsMap = items.map(item => new Item(item))
            let rootItems = _.filter(itemsMap, (item: Item) => item.isRootItem)
            return rootItems
        })
    }

    public getChildren(item: Item): Thenable<Item[]> {
        return this.sendRequest(this.host + item.path, (item: Item) => {
            let itemsMap = item.members.map(item => new Item(item))
            return itemsMap
        })
    }

    public get completions(): Thenable<Item[]> {
        return this.sendRequest(null, (items: Item[]) => {
            return items
        })
    }

    private sendRequest(uri: string, transform) {
        let options = {
            uri: uri || this.host + '/rest/items',
            json: true
        }

        return new Promise(resolve => {
            request(options)
                .then(function (response: Item[] | Item) {
                    resolve(this.sort(transform(response)))
                }.bind(this))
                .catch(err => {
                    window.showErrorMessage('Error while connecting: ' + err.message);
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
